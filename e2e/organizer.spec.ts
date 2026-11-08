import { expect, test } from '@playwright/test';

test('capture, projects, notes, planning, and completion stay connected', async ({ page }, testInfo) => {
  const errors: string[] = [];
  const dialogs: string[] = [];
  let acceptDialog = false;
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('dialog', async dialog => {
    dialogs.push(dialog.message());
    if (acceptDialog) await dialog.accept(); else await dialog.dismiss();
  });
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const heading = (name: string) => page.getByRole('heading', { name, exact: true });
  async function tab(name: string) { await page.getByRole('tab', { name, exact: true }).click(); await expect(heading(name)).toBeVisible(); }
  await page.clock.setFixedTime(new Date('2026-11-08T04:00:00Z'));
  expect((await page.goto('/'))?.status()).toBe(200);
  await expect(heading('Today')).toBeVisible({ timeout: 60000 });
  await page.screenshot({ path: testInfo.outputPath('today-light.png') });

  await test.step('Create a project and a scheduled task with an independent deadline', async () => {
    await tab('Projects');
    await button('New project').click();
    await page.getByRole('textbox', { name: 'Project name' }).fill('School design studio');
    await button('Create project').click();
    await expect(heading('Projects')).toBeVisible();
    await page.getByRole('button', { name: /School design studio, 0 of 0/ }).click();
    await button('Add a task').click();
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Sketch the homepage');
    await page.getByRole('textbox', { name: 'Details', exact: true }).fill('Start with the mobile layout.');
    await page.getByRole('switch', { name: 'Set a deadline' }).click();
    await page.getByLabel('Due date', { exact: true }).fill('2026-11-10');
    await page.getByRole('switch', { name: 'Schedule a work session' }).click();
    await page.getByLabel('Scheduled day', { exact: true }).fill('2026-11-09');
    await page.getByLabel('Start time', { exact: true }).fill('09:30');
    await page.getByRole('textbox', { name: 'Estimated minutes' }).fill('45');
    await button('Add task').click();
    await expect(button('Edit Sketch the homepage')).toBeVisible();
  });
  await test.step('Keep project notes alongside tasks', async () => {
    await page.getByRole('tab', { name: 'Notes · 0' }).click();
    await button('Add a note').click();
    await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Design decisions');
    await page.getByRole('textbox', { name: 'Your note', exact: true }).fill('Use generous spacing.');
    await button('Save note').click();
    await expect(button('Open note Design decisions')).toBeVisible();
    await button('Back').click();
  });
  await test.step('Reject an overlap and show the same task on the calendar', async () => {
    await tab('Calendar');
    await button('Add a commitment').click();
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Design critique');
    await page.getByLabel('Scheduled day', { exact: true }).fill('2026-11-09');
    await page.getByLabel('Start time', { exact: true }).fill('09:45');
    await button('Add commitment').click();
    await expect(page.getByRole('alert')).toContainText('overlaps');
    await page.getByLabel('Start time', { exact: true }).fill('10:30');
    await button('Add commitment').click();
    await expect(heading('Calendar')).toBeVisible();
    await button('Next week').click();
    await button('Monday, November 9').click();
    await expect(page.getByText('Design critique', { exact: true })).toBeVisible();
    await expect(button('Edit Sketch the homepage')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('calendar-light.png') });
  });
  await test.step('Capture survives reload and converts without duplication', async () => {
    await tab('Today');
    await button('Capture a thought').click();
    await page.getByRole('textbox', { name: 'Your thought', exact: true }).fill('Remember simpler navigation');
    await button('Save to inbox').click();
    await expect(heading('Today')).toBeVisible();
    expect((await page.reload())?.status()).toBe(200);
    await button('Organize Remember simpler navigation').click();
    await button('Keep as a note').click();
    await button('Save note').click();
    await expect(button('Open note Remember simpler navigation')).toBeVisible();
    await expect(button('Organize Remember simpler navigation')).toHaveCount(0);
  });
  await test.step('Search note bodies, complete tasks, and preserve archived projects', async () => {
    await page.getByRole('textbox', { name: 'Search your space' }).fill('generous spacing');
    await expect(button('Open note Design decisions')).toBeVisible();
    await page.getByRole('textbox', { name: 'Search your space' }).fill('');
    await page.getByRole('checkbox', { name: 'Complete Sketch the homepage' }).click();
    await tab('Projects');
    await page.getByRole('button', { name: /School design studio, 1 of 1/ }).click();
    await expect(page.getByRole('checkbox', { name: 'Reopen Sketch the homepage' })).toBeAttached();
    await button('Edit project').click();
    acceptDialog = true;
    await button('Archive project').click();
    await expect(page.getByText('Archived · your tasks and notes are preserved.', { exact: true })).toBeVisible();
    acceptDialog = false;
    await button('Back').click();
    await page.getByRole('tab', { name: 'Archived', exact: true }).click();
    await expect(page.getByRole('button', { name: /School design studio, 1 of 1/ })).toBeVisible();
  });
  await test.step('Guard unsaved text on dismissal', async () => {
    await tab('Today');
    await button('Quick capture').click();
    await page.getByRole('textbox', { name: 'Your thought', exact: true }).fill('Do not discard me accidentally');
    await Promise.all([page.waitForEvent('dialog'), button('Close capture').click()]);
    await expect(page.getByRole('textbox', { name: 'Your thought', exact: true })).toHaveValue('Do not discard me accidentally');
    acceptDialog = true;
    await Promise.all([page.waitForEvent('dialog'), button('Close capture').click()]);
    await expect(heading('Today')).toBeVisible();
    acceptDialog = false;
  });
  await test.step('Follow dark appearance and disclose unavailable AI', async () => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(heading('Today')).toHaveCSS('color', 'rgb(246, 242, 250)');
    await page.screenshot({ path: testInfo.outputPath('today-dark.png') });
    await button('Ask Muuco').click();
    await expect(page.getByText('Cloud AI is not connected', { exact: true })).toBeVisible();
  });
  expect(errors).toEqual([]);
  expect(dialogs).toHaveLength(3);
});

test('the first-run interface fits a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  await page.getByRole('button', { name: 'Capture a thought', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Your thought', exact: true })).toBeVisible();
});

test('an overnight commitment stays visible on Today and both calendar days', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-08T04:00:00Z'));
  await page.goto('/calendar');
  await page.getByRole('button', { name: 'Add a commitment', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Overnight design session');
  await page.getByLabel('Scheduled day', { exact: true }).fill('2026-11-08');
  await page.getByLabel('Start time', { exact: true }).fill('23:00');
  await page.getByRole('textbox', { name: 'Duration in minutes', exact: true }).fill('120');
  await page.getByRole('button', { name: 'Add commitment', exact: true }).click();
  const session = page.getByRole('button', { name: 'Edit commitment Overnight design session', exact: true });
  await expect(session).toBeVisible();
  await page.getByRole('tab', { name: 'Today', exact: true }).click();
  await expect(session).toBeVisible();
  await page.getByRole('tab', { name: 'Calendar', exact: true }).click();
  await page.getByRole('button', { name: 'Next week', exact: true }).click();
  await page.getByRole('button', { name: 'Monday, November 9', exact: true }).click();
  await expect(session).toBeVisible();
  await expect(page.getByText('Continues', { exact: true })).toBeVisible();
});
