import { expect, test } from '@playwright/test';
import { reply, skipIntro } from './helpers';

/**
 * The live path, end to end, against the built-in fake model (MOCK_AI=1).
 * This proves the browser, the /api routes, streaming, limits and the review wiring.
 * It does not prove anything about real Claude replies: that needs a real key.
 */
test.describe('live AI path (fake model)', () => {
  test.beforeEach(async ({ page }) => skipIntro(page));

  test('the server reports live, and styles can be chosen', async ({ page, request }) => {
    expect(await (await request.get('/api/status')).json()).toEqual({ live: true });
    await page.goto('/practice/suffering');
    await expect(page.getByRole('radio', { name: /Hostile/ })).toBeEnabled();
    await expect(page.getByText('Styles need live AI')).toHaveCount(0);
    await page.getByText('Hostile', { exact: true }).click();
    await expect(page.getByRole('radio', { name: /Hostile/ })).toBeChecked();
  });

  test('replies stream in, Coach responds, and the review covers what was said', async ({ page }) => {
    await page.goto('/practice/suffering');
    await page.getByText('Tough', { exact: true }).click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.getByText('Mock skeptic message 1.')).toBeVisible();

    await page.getByRole('button', { name: 'Ask Apologist AI' }).click();
    await expect(page.getByText('AI help in steps.')).toBeVisible();
    await expect(page.getByText('Mock nudge.')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(0);

    for (let n = 1; n <= 5; n++) {
      await reply(page, `Live reply ${n}`);
      if (n < 5) await expect(page.getByText(`Mock skeptic message ${n + 1}.`)).toBeVisible();
    }

    await expect(page.getByRole('heading', { name: 'Coach review' })).toBeVisible();
    await expect(page.getByText('Mock skeptic closing line.').first()).toBeVisible();
    // A live review is personal, so it does include "What you covered".
    await expect(page.getByRole('heading', { name: 'What you covered' })).toBeVisible();
    await expect(page.getByText('Mock: what you covered.')).toBeVisible();
    await expect(page.getByText('general notes for this question')).toHaveCount(0);
    // Sources still come only from the curated list, never from the model.
    await expect(page.getByRole('heading', { name: 'Sources' })).toHaveCount(0);
  });

  test('the server rejects bad requests and enforces its own cap', async ({ request }) => {
    const base = { questionId: 'suffering', persona: 'curious', difficulty: 'standard' };
    expect((await request.post('/api/skeptic', { data: { ...base, questionId: 'nope', messages: [] } })).status()).toBe(
      400,
    );
    expect(
      (await request.post('/api/skeptic', { data: { ...base, messages: [{ from: 'me', text: 'hi' }] } })).status(),
    ).toBe(400);
    const tooLong = [
      { from: 'skeptic', text: 'a' },
      { from: 'me', text: 'x'.repeat(601) },
    ];
    expect((await request.post('/api/skeptic', { data: { ...base, messages: tooLong } })).status()).toBe(400);
    expect((await request.get('/api/coach')).status()).toBe(405);
  });
});
