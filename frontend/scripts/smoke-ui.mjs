import { chromium, expect } from '@playwright/test';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));

const password = 'test-password-1';
const admin = { name: 'Елена Петрова', email: 'elena@example.test' };
const participant = { name: 'Иван Иванов', email: 'ivan@example.test' };
const guest = { name: 'Мария Георгиева', email: 'maria@example.test' };

// getByLabel matches parts of words, and "Парола" is also part of "Повторете паролата".
const passwordField = () => page.getByLabel('Парола', { exact: true });

async function fillSignUp(account, repeated = password) {
  await page.getByRole('heading', { name: 'Вход в профила' }).waitFor();
  await page.getByRole('button', { name: 'Създайте профил' }).click();
  await page.getByLabel('Име и фамилия').fill(account.name);
  await page.getByLabel('Имейл').fill(account.email);
  await passwordField().fill(password);
  await page.getByLabel('Повторете паролата').fill(repeated);
  await page.getByRole('button', { name: 'Създай профил', exact: true }).click();
}
async function logIn(account, typed = password) {
  await page.getByLabel('Имейл').fill(account.email);
  await passwordField().fill(typed);
  await page.getByRole('button', { name: 'Вход', exact: true }).click();
}
async function logOut() {
  await page.getByRole('button', { name: 'Изход' }).click();
  await page.getByRole('heading', { name: 'Вход в профила' }).waitFor();
}

try {
  await page.goto(base);
  await fillSignUp(admin, 'different-password');
  await expect(page.locator('main')).toContainText('Паролите не съвпадат');
  await page.getByLabel('Повторете паролата').fill(password);
  await page.getByRole('button', { name: 'Създай профил', exact: true }).click();
  await page.getByRole('heading', { name: 'Работни регистри' }).waitFor();
  await expect(page.locator('body')).not.toContainText(/демо/i);
  await expect(page.getByRole('banner')).toContainText(admin.name);
  await expect(page.getByRole('main')).toContainText('Все още няма регистри');

  await logOut();
  await logIn(admin, 'wrong-password');
  await expect(page.getByRole('alert')).toContainText('Невалиден имейл или парола');
  await logIn(admin);
  await page.getByRole('heading', { name: 'Работни регистри' }).waitFor();
  await logOut();
  await fillSignUp(admin);
  await expect(page.locator('main')).toContainText('Вече има профил с този имейл');
  await page.getByRole('button', { name: 'Влезте' }).click();
  await logIn(admin);
  await page.getByRole('heading', { name: 'Работни регистри' }).waitFor();

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
  await expect(page.getByRole('status')).toContainText('Обхватът на подрегистъра е запазен');
  await page.getByRole('button', { name: 'Покани профил' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Генерирай връзка' }).click();
  const participantLink = await dialog.locator('form').getByLabel('Връзка за покана').inputValue();
  await dialog.getByRole('button', { name: 'Затвори' }).click();

  // A new colleague opens the link without an account and signs up from it.
  await logOut();
  await page.goto(participantLink);
  await expect(page.locator('main')).toContainText('Получили сте покана');
  await fillSignUp(participant);
  await page.getByRole('button', { name: 'Приеми поканата' }).click();
  await expect(page.getByRole('heading', { name: 'UI обхват' })).toBeVisible();
  await page.getByRole('button', { name: 'Свери' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Резултат от проверката').selectOption('location');
  await dialog.getByLabel('Установено местоположение').fill('Каб. 102');
  await dialog.getByLabel('Причина или описание').fill('Преместен при проверка');
  await dialog.getByRole('button', { name: 'Подай заявка' }).click();
  await expect(page.getByRole('status')).toContainText('Заявката е изпратена');

  await logOut();
  await logIn(admin);
  await page.getByRole('heading', { name: 'Работни регистри' }).waitFor();
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

  await logOut();
  await page.goto(guestLink);
  await fillSignUp(guest);
  await page.getByRole('button', { name: 'Приеми поканата' }).click();
  await expect(page.getByRole('table')).toContainText('Лаптоп за проверка');
  await expect(page.getByRole('button', { name: 'Свери' })).toHaveCount(0);
  await page.getByPlaceholder('Име, номер или място').fill('UI-001');
  await expect(page.getByRole('table')).toContainText('Лаптоп за проверка');
  await page.reload();
  await expect(page.getByRole('table')).toContainText('Лаптоп за проверка');
  await expect(page.getByRole('button', { name: 'Свери' })).toHaveCount(0);
  await logOut();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Вход в профила' })).toBeVisible();
  await logIn(guest);
  await expect(page.getByRole('heading', { name: 'Работни регистри' })).toBeVisible();
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('UI flow passed: sign-up, login, create, duplicate, scope, invitation sign-up, participant request, approval, history, guest read-only search, reload, logout.');
} finally {
  await browser.close();
}
