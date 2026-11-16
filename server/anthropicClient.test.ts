import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AiUnavailable, createAnthropicClient } from './anthropicClient';

/**
 * The real Anthropic SDK, pointed at a local stand-in for the API. This checks the exact request
 * the adapter sends and that responses are read correctly. It cannot check that the real API
 * accepts the request: that needs a real key.
 */

interface Seen {
  url: string;
  headers: IncomingMessage['headers'];
  body: Record<string, unknown>;
}

let server: Server;
let seen: Seen[] = [];
let respond: (req: Seen) => { status: number; type: string; body: string };

const sse = (events: Array<[string, unknown]>) =>
  events.map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join('');

const usage = { input_tokens: 10, output_tokens: 5 };
const message = (patch: Record<string, unknown>) => ({
  id: 'msg_test',
  type: 'message',
  role: 'assistant',
  model: 'claude-opus-5-5',
  content: [],
  stop_reason: null,
  stop_sequence: null,
  usage,
  ...patch,
});

const streamOf = (chunks: string[], stopReason = 'end_turn') =>
  sse([
    ['message_start', { type: 'message_start', message: message({}) }],
    ['content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }],
    ...chunks.map((text): [string, unknown] => [
      'content_block_delta',
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } },
    ]),
    ['content_block_stop', { type: 'content_block_stop', index: 0 }],
    ['message_delta', { type: 'message_delta', delta: { stop_reason: stopReason, stop_sequence: null }, usage }],
    ['message_stop', { type: 'message_stop' }],
  ]);

beforeAll(async () => {
  server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const entry: Seen = {
      url: req.url ?? '',
      headers: req.headers,
      body: JSON.parse(Buffer.concat(chunks).toString() || '{}'),
    };
    seen.push(entry);
    const out = respond(entry);
    res.writeHead(out.status, { 'content-type': out.type });
    res.end(out.body);
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.ANTHROPIC_API_KEY = 'test-key-not-real';
});

afterAll(async () => {
  delete process.env.ANTHROPIC_BASE_URL;
  delete process.env.ANTHROPIC_API_KEY;
  await new Promise((r) => server.close(r));
});

beforeEach(() => {
  seen = [];
});

const request = {
  system: 'You play a simulated skeptic.',
  turns: [{ role: 'user' as const, content: 'Begin the practice conversation.' }],
  effort: 'low' as const,
  maxTokens: 4000,
};

describe('Anthropic adapter', () => {
  it('streams text in order and sends the request the API documents', async () => {
    respond = () => ({ status: 200, type: 'text/event-stream', body: streamOf(['Why ', 'would ', 'I?']) });
    const pieces: string[] = [];
    const result = await createAnthropicClient().streamText(request, (d) => pieces.push(d));

    expect(pieces.join('')).toBe('Why would I?');
    expect(result).toEqual({ refused: false });

    const sent = seen[0];
    expect(sent.url).toMatch(/^\/v1\/messages/);
    // This SDK version sends the key as a bearer token.
    expect(sent.headers.authorization).toBe('Bearer test-key-not-real');
    expect(sent.headers['anthropic-beta']).toContain('server-side-fallback-2026-07-01');
    expect(sent.body).toMatchObject({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      stream: true,
      system: request.system,
      messages: request.turns,
      output_config: { effort: 'low' },
      fallbacks: 'default',
    });
    // Thinking is left to the model's default; forbidden settings are never sent.
    expect(sent.body).not.toHaveProperty('thinking');
    expect(sent.body).not.toHaveProperty('temperature');
    expect(sent.body).not.toHaveProperty('betas');
  });

  it('reports a refusal instead of treating it as a reply', async () => {
    respond = () => ({ status: 200, type: 'text/event-stream', body: streamOf([], 'refusal') });
    const pieces: string[] = [];
    expect(await createAnthropicClient().streamText(request, (d) => pieces.push(d))).toEqual({ refused: true });
    expect(pieces).toEqual([]);
  });

  it('uses the model it is given, and leaves the fallback setting off for models that reject it', async () => {
    respond = () => ({ status: 200, type: 'text/event-stream', body: streamOf(['ok']) });
    await createAnthropicClient('claude-haiku-5-5').streamText(request, () => {});
    expect(seen[0].body.model).toBe('claude-haiku-5-5');
    expect(seen[0].body).not.toHaveProperty('fallbacks');
    expect(String(seen[0].headers['anthropic-beta'] ?? '')).not.toContain('server-side-fallback');
  });

  it('asks for structured output and returns it parsed', async () => {
    const Coach = z.object({ nudge: z.string(), outline: z.string(), sample: z.string() });
    const answer = { nudge: 'n', outline: 'o', sample: 's' };
    respond = () => ({
      status: 200,
      type: 'application/json',
      body: JSON.stringify(
        message({ content: [{ type: 'text', text: JSON.stringify(answer) }], stop_reason: 'end_turn' }),
      ),
    });

    expect(await createAnthropicClient().json({ ...request, maxTokens: 8000 }, Coach)).toEqual(answer);

    const sent = seen[0].body as {
      output_config: { effort: string; format: { type: string; schema: { properties: object } } };
    };
    expect(sent.output_config.effort).toBe('low');
    expect(sent.output_config.format.type).toBe('json_schema');
    expect(Object.keys(sent.output_config.format.schema.properties).sort()).toEqual(['nudge', 'outline', 'sample']);
    expect(seen[0].body).toMatchObject({ fallbacks: 'default', max_tokens: 8000 });
    expect(seen[0].body).not.toHaveProperty('stream');
  });

  it('returns null when the model declines a structured request', async () => {
    respond = () => ({
      status: 200,
      type: 'application/json',
      body: JSON.stringify(message({ content: [], stop_reason: 'refusal' })),
    });
    expect(await createAnthropicClient().json(request, z.object({ a: z.string() }))).toBeNull();
  });

  it('turns an API error into a message that is safe to show', async () => {
    respond = () => ({
      status: 401,
      type: 'application/json',
      body: JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }),
    });
    const failure = createAnthropicClient().streamText(request, () => {});
    await expect(failure).rejects.toBeInstanceOf(AiUnavailable);
    await expect(failure).rejects.toThrow('Live AI is not set up correctly.');
  });
});
