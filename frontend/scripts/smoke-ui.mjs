import { chromium, expect } from '@playwright/test';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));

try {
  await page.goto(base);
  await page.getByRole('heading', { name: 'Вход в профила' }).waitFor();
  await page.getByLabel('Имейл').fill('elena@example.test');
  await page.getByLabel('Парола').fill('wrong');
  await page.getByRole('button', { name: 'Вход', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Невалиден имейл или парола');
  await page.getByLabel('Парола').fill('demo');
  await page.getByRole('button', { name: 'Вход', exact: true }).click();
  await page.getByRole('heading', { name: 'Работни регистри' }).waitFor();
  await page.getByRole('button', { name: 'Нулирай демо данните' }).click();
  await page.getByRole('button', { name: 'Нов регистър' }).last().click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Име на регистъра').fill('UI регистър');
  await dialog.getByRole('button', { name: 'Създай регистъра' }).click();
  await page.getByRole('heading', { name: 'UI регистър' }).waitFor();
  const registerId = page.url().split('#register/')[1];

  await page.getByRole('button', { name: 'Добави актив' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Наименование *').fill('Лаптоп за проверка');
  await dialog.getByLabel('Инвентарен номер *').fill('UI-001');
  await dialog.getByLabel('Местоположение *').fill('Каб. 101');
  await dialog.getByRole('button', { name: 'Запази актива' }).click();
  await expect(page.getByRole('table')).toContainText('Лаптоп за проверка');

  await page.getByRole('button', { name: 'Добави актив' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Наименование *').fill('Дубликат');
  await dialog.getByLabel('Инвентарен номер *').fill('ui-001');
  await dialog.getByLabel('Местоположение *').fill('Каб. 101');
  await dialog.getByRole('button', { name: 'Запази актива' }).click();
  await expect(dialog.getByRole('alert')).toContainText('вече има актив');
  await dialog.getByRole('button', { name: 'Затвори' }).click();

  await page.goto(`${base}#subregisters/${registerId}`);
  await page.getByRole('button', { name: 'Нов подрегистър' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Име на подрегистъра').fill('UI обхват');
  await dialog.getByRole('button', { name: 'Създай подрегистъра' }).click();
  await page.getByRole('heading', { name: 'UI обхват' }).waitFor();
  const subregisterId = page.url().split(`#subregisters/${registerId}/`)[1];
  await page.getByRole('button', { name: 'Избери активи' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('checkbox', { name: /Лаптоп за проверка/ }).check();
  await dialog.getByRole('button', { name: 'Запази обхвата' }).click();
  await page.getByRole('button', { name: 'Покани профил' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Генерирай връзка' }).click();
  const participantLink = await dialog.locator('form').getByLabel('Връзка за покана').inputValue();
  await dialog.getByRole('button', { name: 'Затвори' }).click();

  await page.getByLabel('Демо профил').selectOption('custodian');
  await expect(page).toHaveURL(/#subregisters$/);
  await page.goto(participantLink);
  await page.getByRole('button', { name: 'Приеми поканата' }).click();
  await expect(page.getByRole('heading', { name: 'UI обхват' })).toBeVisible();
  await page.getByRole('button', { name: 'Свери' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Резултат от проверката').selectOption('location');
  await dialog.getByLabel('Установено местоположение').fill('Каб. 102');
  await dialog.getByLabel('Причина или описание').fill('Преместен при проверка');
  await dialog.getByRole('button', { name: 'Подай заявка' }).click();
  await expect(page.getByRole('status')).toContainText('Заявката е изпратена');

  await page.getByLabel('Демо профил').selectOption('accounting');
  await expect(page).toHaveURL(/#invited$/);
  await page.goto(`${base}#requests`);
  await page.getByRole('button', { name: 'Одобри' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Потвърди одобрението' }).click();
  await expect(page.getByRole('status')).toContainText('Решението е записано');
  await page.goto(`${base}#register/${registerId}`);
  await expect(page.getByRole('table')).toContainText('Каб. 102');
  await page.goto(`${base}#history/${registerId}/${subregisterId}`);
  await expect(page.locator('main')).toContainText('Одобрена заявка');

  await page.goto(`${base}#subregisters/${registerId}/${subregisterId}`);
  await page.getByRole('button', { name: 'Покани профил' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Роля в подрегистъра').selectOption('guest');
  await dialog.getByRole('button', { name: 'Генерирай връзка' }).click();
  const guestLink = await dialog.locator('form').getByLabel('Връзка за покана').inputValue();
  await dialog.getByRole('button', { name: 'Затвори' }).click();
  await page.getByLabel('Демо профил').selectOption('viewer');
  await expect(page).toHaveURL(/#subregisters$/);
  await page.goto(guestLink);
  await page.getByRole('button', { name: 'Приеми поканата' }).click();
  await expect(page.getByRole('table')).toContainText('Лаптоп за проверка');
  await expect(page.getByRole('button', { name: 'Свери' })).toHaveCount(0);
  await page.getByPlaceholder('Име, номер или място').fill('UI-001');
  await expect(page.getByRole('table')).toContainText('Лаптоп за проверка');
  await page.reload();
  await expect(page.getByRole('table')).toContainText('Лаптоп за проверка');
  await expect(page.getByRole('button', { name: 'Свери' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Изход' }).click();
  await expect(page.getByRole('heading', { name: 'Вход в профила' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Вход в профила' })).toBeVisible();
  await page.getByRole('button', { name: 'Мария · Преглед' }).click();
  await expect(page.getByRole('heading', { name: 'Работни регистри' })).toBeVisible();
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('UI mock flow passed: login, create, duplicate, scope, links, participant request, approval, history, guest read-only search, reload, logout.');
} finally {
  await browser.close();
}
