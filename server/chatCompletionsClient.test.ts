import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AiUnavailable } from './anthropicClient';
import { createChatCompletionsClient, extractJson, parseLabelled } from './chatCompletionsClient';
import { agentEndpoint, createAi } from './deps';

const REQ = {
  system: 'Be a skeptic.',
  turns: [{ role: 'user' as const, content: 'Hi' }],
  effort: 'low' as const,
  maxTokens: 100,
};

let server: Server;
let url = '';
let seen: {
  headers: IncomingMessage['headers'];
  body: Record<string, unknown> & { messages: { role: string; content: string }[]; stream?: boolean };
} | null = null;
let respond: (stream: boolean) => { status: number; type: string; body: string } = () => ({
  status: 200,
  type: 'application/json',
  body: '{}',
});

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const body = JSON.parse(raw);
      seen = { headers: req.headers, body };
      const r = respond(body.stream === true);
      res.writeHead(r.status, { 'content-type': r.type });
      res.end(r.body);
    });
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1/chat/completions`;
});
afterAll(() => new Promise((ok) => server.close(ok)));
beforeEach(() => (seen = null));

const client = () => createChatCompletionsClient({ url, apiKey: 'test-key-not-real' });
const sse = (...parts: string[]) =>
  parts.map((p) => `data: ${JSON.stringify({ choices: [{ delta: { content: p } }] })}\n\n`).join('') +
  'data: [DONE]\n\n';

describe('chat-completions client', () => {
  it('streams text and sends x-api-key and the documented fields', async () => {
    respond = () => ({ status: 200, type: 'text/event-stream', body: sse('Hel', 'lo ', 'there') });
    const out: string[] = [];
    const result = await client().streamText(REQ, (t) => out.push(t));
    expect(out.join('')).toBe('Hello there');
    expect(result.refused).toBe(false);
    expect(seen!.headers['x-api-key']).toBe('test-key-not-real');
    expect(seen!.body).toMatchObject({ stream: true, max_completion_tokens: 100, response_format: { type: 'raw' } });
    expect(seen!.body.messages[0]).toEqual({ role: 'system', content: 'Be a skeptic.' });
    expect(seen!.body.messages[1]).toEqual({ role: 'user', content: 'Hi' });
  });

  it('sends no memory or sign-in metadata', async () => {
    respond = () => ({ status: 200, type: 'text/event-stream', body: sse('ok') });
    await client().streamText(REQ, () => {});
    expect(seen!.body.metadata).toEqual({ anonymous: true, language: 'en', max_memories: 0 });
  });

  it('falls back to a Bearer token when x-api-key is refused', async () => {
    respond = () => ({ status: 200, type: 'text/event-stream', body: sse('ok') });
    const real = respond;
    let first = true;
    respond = (stream) => {
      if (first) {
        first = false;
        return { status: 401, type: 'application/json', body: '{}' };
      }
      return real(stream);
    };
    const out: string[] = [];
    await client().streamText(REQ, (t) => out.push(t));
    expect(out.join('')).toBe('ok');
    expect(seen!.headers.authorization).toBe('Bearer test-key-not-real');
    expect(seen!.headers['x-api-key']).toBeUndefined();
  });

  it('reports a content filter as a refusal', async () => {
    respond = () => ({
      status: 200,
      type: 'text/event-stream',
      body: `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: 'content_filter' }] })}\n\n`,
    });
    expect((await client().streamText(REQ, () => {})).refused).toBe(true);
  });

  it('parses JSON replies, including inside code fences, and checks them against the schema', async () => {
    const schema = z.object({ nudge: z.string() });
    respond = () => ({
      status: 200,
      type: 'application/json',
      body: JSON.stringify({ choices: [{ message: { content: 'Here:\n```json\n{"nudge":"ask why"}\n```' } }] }),
    });
    expect(await client().json(REQ, schema)).toEqual({ nudge: 'ask why' });
    expect(seen!.body.stream).toBe(false);
    expect(seen!.body.messages[0].content).toContain('one JSON object only');
    // The exact shape is spelled out, so the agent does not have to guess field names.
    expect(seen!.body.messages[0].content).toContain('"nudge"');
    expect(seen!.body.messages[0].content).toContain('"required"');
  });

  it('retries once when the JSON does not match, then gives up safely', async () => {
    const schema = z.object({ nudge: z.string() });
    let calls = 0;
    respond = () => {
      calls++;
      return {
        status: 200,
        type: 'application/json',
        body: JSON.stringify({ choices: [{ message: { content: '{"wrong":1}' } }] }),
      };
    };
    await expect(client().json(REQ, schema)).rejects.toBeInstanceOf(AiUnavailable);
    expect(calls).toBe(2);
  });

  it('skips the second try when the first was already slow', async () => {
    const schema = z.object({ nudge: z.string() });
    let calls = 0;
    let t = 0;
    respond = () => {
      calls++;
      t += 6000; // each call "takes" 6 seconds
      return {
        status: 200,
        type: 'application/json',
        body: JSON.stringify({ choices: [{ message: { content: 'not json' } }] }),
      };
    };
    const slow = createChatCompletionsClient({ url, apiKey: 'k', now: () => t });
    await expect(slow.json(REQ, schema)).rejects.toBeInstanceOf(AiUnavailable);
    expect(calls).toBe(1);
  });

  it('sends reasoning_effort only when asked', async () => {
    respond = () => ({ status: 200, type: 'text/event-stream', body: sse('ok') });
    await client().streamText(REQ, () => {});
    expect(seen!.body.reasoning_effort).toBeUndefined();
    await createChatCompletionsClient({ url, apiKey: 'k', reasoningEffort: 'low' }).streamText(REQ, () => {});
    expect(seen!.body.reasoning_effort).toBe('low');
  });

  it('asks for labelled text when given labels, and reads it back', async () => {
    const schema = z.object({ covered: z.string(), couldAdd: z.string() });
    const labels = { covered: 'What you covered', couldAdd: 'What you could add' };
    respond = () => ({
      status: 200,
      type: 'application/json',
      body: JSON.stringify({
        choices: [
          {
            message: {
              content: '**What you covered:** You named the pain.\n\nWhat you could add: Ask a question back.',
            },
          },
        ],
      }),
    });
    expect(await client().json({ ...REQ, labels }, schema)).toEqual({
      covered: 'You named the pain.',
      couldAdd: 'Ask a question back.',
    });
    expect(seen!.body.messages[0].content).toContain('What you covered: ...');
    expect(seen!.body.messages[0].content).not.toContain('JSON Schema');
  });

  it('stops waiting at the deadline and says so', async () => {
    const schema = z.object({ nudge: z.string() });
    const slow = createChatCompletionsClient({
      url,
      apiKey: 'k',
      fetch: (_u, init) =>
        new Promise((_ok, fail) =>
          init!.signal!.addEventListener('abort', () =>
            fail(Object.assign(new Error('aborted'), { name: 'TimeoutError' })),
          ),
        ),
    });
    const t0 = Date.now();
    await expect(slow.json({ ...REQ, deadlineMs: 150 }, schema)).rejects.toThrow('took too long');
    expect(Date.now() - t0).toBeLessThan(1000);
  });

  it.each([
    [401, 'not set up correctly'],
    [429, 'busy'],
    [500, 'had a problem'],
  ])('maps HTTP %i to a safe message', async (status, text) => {
    respond = () => ({ status, type: 'application/json', body: '{"secret":"internal detail"}' });
    await expect(client().streamText(REQ, () => {})).rejects.toThrow(text);
  });

  it('parseLabelled needs every label, in any order', () => {
    const labels = { a: 'First', b: 'Second' };
    expect(parseLabelled('Second: two\nFirst: one', labels)).toEqual({ a: 'one', b: 'two' });
    expect(parseLabelled('First: one', labels)).toBeUndefined();
    expect(parseLabelled('First:\nSecond: two', labels)).toBeUndefined();
  });

  it('extractJson ignores text with no object', () => {
    expect(extractJson('no json here')).toBeUndefined();
    expect(extractJson('{broken')).toBeUndefined();
  });
});

describe('provider choice', () => {
  it('uses the Apologist agent when its settings are present, unless told otherwise', () => {
    const base = { APOLOGIST_API_URL: url, APOLOGIST_API_KEY: 'k', ANTHROPIC_API_KEY: 'a' };
    expect(createAi(base)).not.toBeNull();
    expect(createAi({ APOLOGIST_API_URL: url })).toBeNull();
    expect(createAi({ ...base, AI_PROVIDER: 'anthropic' })).not.toBeNull();
    expect(createAi({})).toBeNull();
  });

  it('builds the endpoint from just the domain', () => {
    expect(agentEndpoint({ APOLOGIST_AGENT_DOMAIN: 'apologist-academy.apologist.ai' })).toBe(
      'https://apologist-academy.apologist.ai/api/v1/chat/completions',
    );
    expect(agentEndpoint({ APOLOGIST_AGENT_DOMAIN: ' https://x.example/path ' })).toBe(
      'https://x.example/api/v1/chat/completions',
    );
    expect(agentEndpoint({ APOLOGIST_API_URL: 'https://full/url', APOLOGIST_AGENT_DOMAIN: 'd.example' })).toBe(
      'https://full/url',
    );
    expect(agentEndpoint({})).toBeNull();
    expect(createAi({ APOLOGIST_AGENT_DOMAIN: 'd.example', APOLOGIST_API_KEY: 'k' })).not.toBeNull();
  });
});
