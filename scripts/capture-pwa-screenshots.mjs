import { chromium } from '@playwright/test'
import { resolve } from 'node:path'

const baseUrl = process.env.OBSERVATORY_URL || 'http://127.0.0.1:5182'
const output = resolve('public/screenshots')
const browser = await chromium.launch()

async function openExample(page) {
  await page.goto(baseUrl)
  await page.getByRole('button', { name: /Open The Abandoned Tower/ }).click()
  await page.locator('.map-scene-canvas').waitFor()
  const gridToggle = page.getByRole('button', { name: 'Toggle grid' })
  if ((await gridToggle.getAttribute('aria-pressed')) === 'true') await gridToggle.click()
  const closePanel = page.getByRole('button', { name: 'Close' })
  if (await closePanel.isVisible()) await closePanel.click()
  await page.addStyleTag({ content: '.tooltip-control::after{display:none!important}' })
  await page.evaluate(() => document.activeElement?.blur())
  await page.waitForTimeout(600)
}

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' })
  await openExample(desktop)
  await desktop.mouse.move(720, 450)
  await desktop.screenshot({ path: `${output}/observatory-basic-1440x900.jpg`, type: 'jpeg', quality: 90, fullPage: false })
  await desktop.getByRole('button', { name: 'Switch theme' }).click()
  await desktop.getByRole('button', { name: 'Place object' }).click()
  await desktop.mouse.move(720, 450)
  await desktop.waitForTimeout(250)
  await desktop.screenshot({ path: `${output}/observatory-charcoal-1440x900.jpg`, type: 'jpeg', quality: 90, fullPage: false })
  await desktop.close()

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })
  await openExample(mobile)
  await mobile.getByRole('button', { name: 'Zoom in' }).click()
  await mobile.getByRole('button', { name: 'Zoom in' }).click()
  await mobile.keyboard.down('Space')
  await mobile.mouse.move(190, 420)
  await mobile.mouse.down()
  await mobile.mouse.move(190, 300, { steps: 6 })
  await mobile.mouse.up()
  await mobile.keyboard.up('Space')
  await mobile.evaluate(() => window.scrollTo(0, 0))
  await mobile.evaluate(() => document.activeElement?.blur())
  await mobile.mouse.move(190, 420)
  await mobile.waitForTimeout(250)
  await mobile.screenshot({ path: `${output}/observatory-mobile-390x844.jpg`, type: 'jpeg', quality: 90, fullPage: false })
  await mobile.close()
} finally {
  await browser.close()
}
