import { expect, test } from '@playwright/test';
import { finishConversation, reply, replyBox, skipIntro, startQuestion } from './helpers';

const SUFFERING = /Why does God allow suffering/;

test.describe('first visit', () => {
  test('shows How it works once, then never again', async ({ page }) => {
    await page.goto('/');
    const intro = page.getByRole('dialog', { name: 'How it works' });
    await expect(intro).toBeVisible();
    await expect(intro.getByText('simulated character, not a real person')).toBeVisible();
    await intro.getByRole('button', { name: 'Got it' }).click();
    await expect(intro).toBeHidden();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Practice a hard talk' })).toBeVisible();
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});

test.describe('practice', () => {
  test.beforeEach(async ({ page }) => skipIntro(page));

  test('a full conversation: five turns, then a review with no scores', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('region', { name: 'Suggested to start' }).getByRole('link', { name: 'Start' }).click();
    await expect(page.getByRole('heading', { level: 2, name: SUFFERING })).toBeVisible();
    await page.getByRole('button', { name: 'Start', exact: true }).click();

    await expect(page.getByText('If God is good and strong, why is there so much pain?')).toBeVisible();
    await expect(page.getByText('Turn 1 of 5')).toBeVisible();

    for (let n = 1; n <= 5; n++) {
      await reply(page, `My reply ${n}`);
      if (n < 5) {
        // The composer pauses while the skeptic writes, and the turn moves on.
        await expect(replyBox(page)).toBeDisabled();
        await expect(page.getByText(`Turn ${n + 1} of 5`)).toBeVisible();
      }
    }

    await expect(page).toHaveURL(/\/review\//);
    await expect(page.getByRole('heading', { name: 'Coach review' })).toBeVisible();
    await expect(page.getByText('I need to think about that. Thanks for the talk.').first()).toBeVisible();
    await expect(page.getByText('Ask what is behind the question.')).toBeVisible();
    await expect(page.getByText('Psalm 34:18 (BSB)')).toBeVisible();
    await expect(page.getByText('Sources to be added.')).toBeVisible();
    // A scripted review must not pretend to know what the person covered.
    await expect(page.getByText('What you covered')).toHaveCount(0);
    // "No scores" is a promise: no digits out of ten, no percentages, no grades.
    await expect(page.locator('main')).not.toContainText(/\d+\s*(\/|out of)\s*\d+|\d+%|grade|rating/i);

    await page.getByText('Your conversation').click();
    await expect(page.getByText('My reply 3')).toBeVisible();
  });

  test('a conversation survives a reload and can be resumed from Home', async ({ page }) => {
    await startQuestion(page, SUFFERING);
    await reply(page, 'Before the reload');
    await expect(page.getByText('That does not explain a child who gets sick.')).toBeVisible();
    await replyBox(page).fill('A half-written thought');

    await page.reload();
    await expect(page.getByText('Before the reload')).toBeVisible();
    await expect(page.getByText('Turn 2 of 5')).toBeVisible();
    await expect(replyBox(page)).toHaveValue('A half-written thought');

    await page.goto('/');
    const resume = page.getByRole('region', { name: 'Pick up where you left off' });
    await expect(resume.getByText(SUFFERING)).toBeVisible();
    await resume.getByRole('link', { name: 'Resume' }).click();
    await expect(page.getByText('Before the reload')).toBeVisible();
  });

  test('the browser Back button stays inside the app', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Browse all' }).click();
    await expect(page).toHaveURL(/\/questions$/);
    await page.getByRole('link', { name: SUFFERING }).click();
    await expect(page).toHaveURL(/\/practice\/suffering$/);
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'All questions' })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Practice a hard talk' })).toBeVisible();
  });

  test('Coach gives a nudge, then an outline, then a sample reply', async ({ page }) => {
    await startQuestion(page, SUFFERING);
    await expect(page.getByText('If God is good and strong')).toBeVisible();
    await page.getByRole('button', { name: 'Ask Apologist AI' }).click();

    const coach = page
      .getByRole('heading', { name: 'Coach' })
      .locator('xpath=ancestor::*[self::dialog or self::aside][1]');
    await expect(coach.getByText('Name what the skeptic is really asking')).toBeVisible();
    await expect(coach.getByText('Shows when you ask.')).toBeVisible();
    await coach.getByRole('button', { name: 'Show outline' }).click();
    await expect(coach.getByText('Step 2 of 3: outline')).toBeVisible();
    await expect(coach.getByText('Agree that the pain is real.')).toBeVisible();
    await coach.getByRole('button', { name: 'Show sample reply' }).click();
    await expect(coach.getByText("I won't pretend that makes sense of a sick child.")).toBeVisible();
    await expect(coach.getByRole('button', { name: /^Show/ })).toHaveCount(0);
    await coach.getByRole('button', { name: 'Back to my reply' }).click();
    await expect(page.getByRole('heading', { name: 'Coach' })).toBeHidden();
  });

  test('the daily limit blocks a fourth conversation, counts on the first reply, and resets the next day', async ({
    page,
  }) => {
    // Opening and leaving a question does not use up a conversation.
    await startQuestion(page, SUFFERING);
    await expect(page.getByText('If God is good and strong')).toBeVisible();

    for (const q of [/Can I trust the Bible/, /Did Jesus really rise/, /Is Jesus the only way/]) {
      await startQuestion(page, q);
      await reply(page, 'One reply');
    }

    await page.goto('/practice/science');
    await expect(page.getByRole('heading', { name: 'Daily limit reached' })).toBeVisible();
    await expect(page.getByText(/Resets at \d{1,2}:\d{2}/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start', exact: true })).toHaveCount(0);

    // A conversation already under way is never cut off.
    await page.goto('/history');
    await page.getByRole('link', { name: /Is Jesus the only way/ }).click();
    await reply(page, 'Still allowed');
    await expect(page.getByText('Turn 3 of 5')).toBeVisible();

    // The next day the limit is gone.
    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('ap.practice.daily')!);
      localStorage.setItem('ap.practice.daily', JSON.stringify({ ...saved, day: '2000-01-01' }));
    });
    await page.goto('/practice/science');
    await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
  });
});

test.describe('library and history', () => {
  test.beforeEach(async ({ page }) => skipIntro(page));

  test('search and topic filters narrow the list and live in the URL', async ({ page }) => {
    await page.goto('/questions');
    const cards = page.locator('main ul > li');
    await expect(cards).toHaveCount(16);

    await page.getByRole('searchbox', { name: 'Search questions' }).fill('bible');
    await expect(cards).toHaveCount(2);
    await expect(page).toHaveURL(/q=bible/);

    await page.getByRole('searchbox', { name: 'Search questions' }).fill('');
    await page.getByRole('button', { name: 'The church' }).click();
    await expect(cards).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'The church' })).toHaveAttribute('aria-pressed', 'true');

    // The filter is restored from the URL.
    await page.reload();
    await expect(cards).toHaveCount(2);

    await page.getByRole('searchbox', { name: 'Search questions' }).fill('zzzz');
    await expect(page.getByRole('heading', { name: 'No questions match' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(cards).toHaveCount(16);
  });

  test('a finished question is marked as practiced and appears in history with its review', async ({ page }) => {
    await finishConversation(page, SUFFERING);

    await page.goto('/');
    await expect(page.getByText('1 of 16 practiced')).toBeVisible();
    // The suggestion moves on to a question not practiced yet.
    await expect(page.getByRole('region', { name: 'Suggested to start' })).not.toContainText(
      'Why does God allow suffering?',
    );

    await page.goto('/questions');
    await expect(page.getByRole('link', { name: SUFFERING })).toContainText('Practiced');

    await page.goto('/history');
    await page.getByRole('link', { name: SUFFERING }).click();
    await expect(page).toHaveURL(/\/review\//);
    await expect(page.getByRole('heading', { name: 'Coach review' })).toBeVisible();
  });

  test('"Surprise me" never picks the suggested question', async ({ page }) => {
    for (let i = 0; i < 6; i++) {
      await page.goto('/');
      await page.getByRole('button', { name: 'Surprise me' }).click();
      await expect(page).toHaveURL(/\/practice\//);
      expect(page.url()).not.toMatch(/\/practice\/suffering$/);
    }
  });

  test('unknown links explain themselves', async ({ page }) => {
    await page.goto('/talk/does-not-exist');
    await expect(page.getByRole('heading', { name: 'We could not find that conversation' })).toBeVisible();
    await page.goto('/nowhere');
    await expect(page.getByRole('heading', { name: 'We could not find that page' })).toBeVisible();
  });
});

test.describe('layout', () => {
  test.beforeEach(async ({ page }) => skipIntro(page));

  for (const path of ['/', '/questions', '/practice/suffering', '/history']) {
    test(`${path} never scrolls sideways`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('a long reply wraps and the composer grows instead of scrolling sideways', async ({ page }) => {
    await startQuestion(page, SUFFERING);
    await expect(replyBox(page)).toBeEnabled();
    const before = (await replyBox(page).boundingBox())!.height;
    await replyBox(page).fill('A long reply that keeps going well past the width of the box. '.repeat(4));
    const after = (await replyBox(page).boundingBox())!.height;
    expect(after).toBeGreaterThan(before);
    const sideways = await replyBox(page).evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(sideways).toBeLessThanOrEqual(0);
  });
});
