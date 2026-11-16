import { expect, test } from '@playwright/test';
import { finishConversation, reply, skipIntro, startQuestion } from './helpers';

const SUFFERING = /Why does God allow suffering/;

/**
 * Screenshots of the main screens at phone size, so an accidental visual change shows up
 * in review. After an intended change, refresh them with:
 *   npx playwright test visual.spec.ts --update-snapshots
 */
test.describe('screens look as expected', () => {
  test.beforeEach(async ({ page }) => skipIntro(page));

  test('Home', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('home.png');
  });

  test('Library', async ({ page }) => {
    await page.goto('/questions');
    await expect(page).toHaveScreenshot('library.png');
  });

  test('Get ready', async ({ page }) => {
    await page.goto('/practice/suffering');
    await expect(page).toHaveScreenshot('get-ready.png');
  });

  test('Conversation and Coach', async ({ page }) => {
    await startQuestion(page, SUFFERING);
    await reply(page, 'Love needs a real choice. Free will makes pain possible.');
    await expect(page.getByText('That does not explain a child who gets sick.')).toBeVisible();
    await expect(page).toHaveScreenshot('conversation.png');

    await page.getByRole('button', { name: 'Ask Apologist AI' }).click();
    await expect(page.getByText('Name what the skeptic is really asking')).toBeVisible();
    await expect(page).toHaveScreenshot('coach.png');
  });

  test('Review', async ({ page }) => {
    await finishConversation(page, SUFFERING);
    await expect(page.getByText('Ask what is behind the question.')).toBeVisible();
    await expect(page).toHaveScreenshot('review.png', { fullPage: true });
  });

  test('How it works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'How it works' }).click();
    await expect(page.getByRole('dialog', { name: 'How it works' })).toBeVisible();
    await expect(page).toHaveScreenshot('how-it-works.png');
  });
});
