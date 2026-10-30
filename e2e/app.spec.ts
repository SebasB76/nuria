import { expect, Page, test } from '@playwright/test';

const PREFS = { onboarded: true, homeId: 'alborada', workId: 'centro', schoolId: 'urdesa', scenario: 'live', model: 'deepseek-flash', notifyPhone: true, quietNights: true, tasksDone: [0, 1] };

// start past the welcome screen, with no DeepSeek key so Tamy answers offline
async function open(page: Page, path: string, prefs: Partial<typeof PREFS> = {}) {
  await page.addInitScript((p) => localStorage.setItem('aguaje.prefs', JSON.stringify(p)), { ...PREFS, ...prefs });
  await page.goto(path);
}

test('welcome leads to the day view of the chosen home', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Hola, soy Tamy')).toBeVisible();
  await page.getByText('Empezar').click();
  await expect(page.getByText('¿Qué lugares te importan?')).toBeVisible();
  await page.getByText('Seguir').click();
  await expect(page.getByText('¿Cómo te aviso?')).toBeVisible();
  await page.getByText('Listo', { exact: true }).click();
  await expect(page.getByText('Tu casa hoy')).toBeVisible();
  await expect(page.getByText('Tu día')).toBeVisible();
  await expect(page.getByText('El río Guayas')).toBeVisible();
});

test('Tamy answers offline about the rain with a risk card', async ({ page }) => {
  await open(page, '/tamy');
  await expect(page.getByText('modo sin conexión')).toBeVisible();
  await page.getByText('¿Va a llover fuerte hoy?').click();
  await expect(page.getByText(/Tu barrio está en/)).toBeVisible();
  await expect(page.getByText(/^Alborada · (Tranquilo|Ojo|Cuidado|Peligro)$/)).toBeVisible();
});

test('Tamy files a street report from a chat message', async ({ page }) => {
  await open(page, '/tamy');
  await page.getByText('Hay agua hasta la rodilla en mi calle').click();
  await expect(page.getByText('Tu reporte está en el mapa')).toBeVisible();
  await expect(page.getByText(/Agua en la calle hasta la rodilla/)).toBeVisible();
});

test('safe route from Alborada to the Malecón goes around the flooded avenue', async ({ page }) => {
  await open(page, '/route');
  const best = page.getByText('Ruta recomendada');
  await expect(best).toBeVisible({ timeout: 40_000 });
  await expect(page.getByText('Más segura')).toBeVisible();
  // the recommended card is the first one, and it must not cross reported water
  const firstCard = page.locator('text=Ruta recomendada').locator('xpath=ancestor::*[contains(., "Por ")][1]');
  await expect(firstCard.getByText('Sin agua reportada en el camino.')).toBeVisible();
});

test('a report from the report screen confirms and returns', async ({ page }) => {
  await open(page, '/map');
  await page.getByText('Reportar', { exact: true }).click();
  await expect(page.getByText('¿Hasta dónde llega el agua?')).toBeVisible();
  await page.getByText('Cintura').click();
  await page.getByText('Enviar reporte').click();
  await expect(page.getByText('Tu reporte ya está en el mapa. Gracias por cuidar a tu cuadra.')).toBeVisible();
});

test('family check-in: Mamá and Hija confirm, Papá does not answer', async ({ page }) => {
  await open(page, '/family');
  await page.getByText('¿Están bien?').click();
  await expect(page.getByText('Tamy le preguntó a tu familia si está bien.')).toBeVisible();
  await expect(page.getByText(/Papá no responde/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Mamá · ')).toBeVisible();
  await expect(page.getByText('4 de 4 bien')).not.toBeVisible();
});

test('storm scenario puts the low barrios in danger and opens the danger screen', async ({ page }) => {
  await open(page, '/', { scenario: 'storm' });
  await expect(page.getByText(/^🎬 Escenario de demostración/)).toBeVisible();
  await expect(page.getByText('Peligro', { exact: true })).toBeVisible();
  await page.getByText('Qué hago ahora').click();
  await expect(page.getByText('Haz esto ahora')).toBeVisible();
  await expect(page.getByText('Llamar al 911')).toBeVisible();
});
