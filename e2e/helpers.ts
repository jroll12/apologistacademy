import { expect, type Page } from '@playwright/test';

const STORE_KEY = 'ap.practice.v1';

/** Start each test as someone who has already seen the first-run intro. */
export async function skipIntro(page: Page) {
  await page.addInitScript((key) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ v: 1, seenIntro: true }));
  }, STORE_KEY);
}

export const replyBox = (page: Page) => page.getByRole('textbox', { name: 'Your reply' });

/** Type a reply and send it, once it is the person's turn. */
export async function reply(page: Page, text: string) {
  await expect(replyBox(page)).toBeEnabled();
  await replyBox(page).fill(text);
  await page.getByRole('button', { name: 'Send' }).click();
}

/** Open a question from the library and start it. */
export async function startQuestion(page: Page, question: RegExp) {
  await page.goto('/questions');
  await page.getByRole('link', { name: question }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page).toHaveURL(/\/talk\//);
}

/** Play a whole conversation to the review. */
export async function finishConversation(page: Page, question: RegExp) {
  await startQuestion(page, question);
  for (let n = 1; n <= 5; n++) await reply(page, `Reply ${n}`);
  await expect(page.getByRole('heading', { name: 'Coach review' })).toBeVisible();
}

/**
 * Open "How it works". On a phone it sits in the menu; on desktop it is in the top bar.
 * Returns the control that focus should come back to when the sheet closes.
 */
export async function openHowItWorks(page: Page, how: 'click' | 'keyboard' = 'click') {
  const menu = page.getByRole('button', { name: 'Menu' });
  const onPhone = await menu.isVisible();
  const opener = onPhone ? menu : page.getByRole('button', { name: 'How it works' });
  if (how === 'keyboard') {
    await opener.focus();
    await page.keyboard.press('Enter');
  } else {
    await opener.click();
  }
  if (onPhone) {
    const item = page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name: 'How it works' });
    if (how === 'keyboard') {
      await item.focus();
      await page.keyboard.press('Enter');
    } else {
      await item.click();
    }
  }
  await expect(page.getByRole('dialog', { name: 'How it works' })).toBeVisible();
  return opener;
}
