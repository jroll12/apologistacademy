import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { finishConversation, openHowItWorks, reply, skipIntro, startQuestion } from './helpers';

const SUFFERING = /Why does God allow suffering/;

async function expectNoViolations(page: Page) {
  // Let entrance animations finish so contrast is measured on the settled page.
  await page.waitForTimeout(700);
  const results = await new AxeBuilder({ page } as never)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes[0]?.target.join(' ')}`,
  );
  expect(summary).toEqual([]);
}

/** Every button, link and field a person can press must be at least 44px in both directions. */
async function expectTapTargets(page: Page) {
  const small = await page.evaluate(() => {
    const out: string[] = [];
    const items = document.querySelectorAll<HTMLElement>(
      'button, a[href], input:not([type=radio]), textarea, summary, label:has(input[type=radio])',
    );
    for (const el of items) {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || style.visibility === 'hidden') continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      // Links inside a sentence are exempt, as WCAG allows.
      if (el.tagName === 'A' && style.display === 'inline') continue;
      if (r.width < 43.5 || r.height < 43.5)
        out.push(
          `${el.tagName} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`,
        );
    }
    return out;
  });
  expect(small).toEqual([]);
}

test.describe('accessibility', () => {
  test.beforeEach(async ({ page }) => skipIntro(page));

  test('Home', async ({ page }) => {
    await page.goto('/');
    await expectNoViolations(page);
    await expectTapTargets(page);
  });

  test('Library', async ({ page }) => {
    await page.goto('/questions');
    await expectNoViolations(page);
    await expectTapTargets(page);
  });

  test('Question page', async ({ page }) => {
    await page.goto('/practice/suffering');
    await expectNoViolations(page);
    await expectTapTargets(page);
  });

  test('Conversation, with Coach open', async ({ page }) => {
    await startQuestion(page, SUFFERING);
    await reply(page, 'A reply');
    await expect(page.getByText('That does not explain a child who gets sick.')).toBeVisible();
    await expectNoViolations(page);
    await expectTapTargets(page);

    await page.getByRole('button', { name: 'Ask Apologist AI' }).click();
    await expect(page.getByText('Name what the skeptic is really asking')).toBeVisible();
    await expectNoViolations(page);
    await expectTapTargets(page);
  });

  test('Review', async ({ page }) => {
    await finishConversation(page, SUFFERING);
    await expectNoViolations(page);
    await expectTapTargets(page);
  });

  test('History, empty and with a conversation', async ({ page }) => {
    await page.goto('/history');
    await expectNoViolations(page);
    await startQuestion(page, SUFFERING);
    await expect(page.getByText('If God is good and strong')).toBeVisible();
    await page.goto('/history');
    await expectNoViolations(page);
    await expectTapTargets(page);
  });

  test('How it works', async ({ page }) => {
    await page.goto('/');
    await openHowItWorks(page);
    await expectNoViolations(page);
    await expectTapTargets(page);
  });
});

test.describe('keyboard and focus', () => {
  test.beforeEach(async ({ page }) => skipIntro(page));

  test('the sheet traps focus, closes on Escape, and returns focus to what opened it', async ({ page }) => {
    await page.goto('/');
    const opener = await openHowItWorks(page, 'keyboard');
    const dialog = page.getByRole('dialog', { name: 'How it works' });

    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      // Focus may pass through the browser's own controls, but never onto the page behind.
      const behind = await page.evaluate(() => {
        const a = document.activeElement;
        return !!a && a !== document.body && !a.closest('dialog');
      });
      expect(behind).toBe(false);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('tapping outside the sheet closes it', async ({ page }) => {
    await page.goto('/');
    await openHowItWorks(page);
    const dialog = page.getByRole('dialog', { name: 'How it works' });
    await page.mouse.click(8, 8);
    await expect(dialog).toBeHidden();
  });

  test('changing screen moves focus to the new heading and updates the tab title', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Browse all' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'All questions' })).toBeFocused();
    await expect(page).toHaveTitle('All questions · Apologist Academy');
    await page.getByRole('link', { name: SUFFERING }).click();
    await expect(page.getByRole('heading', { level: 1, name: SUFFERING })).toBeFocused();
    await expect(page).toHaveTitle('Why does God allow suffering? · Apologist Academy');
  });

  test('a whole turn can be taken with the keyboard alone', async ({ page }) => {
    await startQuestion(page, SUFFERING);
    await expect(page.getByText('If God is good and strong')).toBeVisible();
    await page.getByRole('textbox', { name: 'Your reply' }).focus();
    await page.keyboard.type('Typed and sent without a mouse');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Typed and sent without a mouse')).toBeVisible();
    // Focus comes back to the reply box when it is the person's turn again.
    await expect(page.getByText('That does not explain a child who gets sick.')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Your reply' })).toBeFocused();
  });

  test('every screen has exactly one h1', async ({ page }) => {
    for (const path of ['/', '/questions', '/practice/suffering', '/history']) {
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
    }
  });

  test('reduced motion: nothing animates', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const longest = await page.evaluate(() =>
      Math.max(0, ...document.getAnimations().map((a) => Number(a.effect?.getComputedTiming().duration) || 0)),
    );
    expect(longest).toBeLessThan(1);
  });
});
