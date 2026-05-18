import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.VISUAL_AUDIT_URL || `http://localhost:${process.env.WEB_PORT || '3002'}`
const outputDir = path.resolve('logs/error-images/desktop-visual-audit')
const viewports = [
  { name: '320x640', width: 320, height: 640 },
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1536x864', width: 1536, height: 864 },
  { name: '1680x1050', width: 1680, height: 1050 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '2560x1440', width: 2560, height: 1440 },
]
const pages = [
  { name: 'home', path: '/' },
  { name: 'search-results', path: '/?query=%D0%B1%D0%B5' },
  { name: 'about', path: '/about' },
  { name: 'vacancies', path: '/vacancies' },
  { name: 'contacts', path: '/contacts' },
]

const isBenignFailedRequest = (request) => {
  const failureText = request.failure()?.errorText || ''
  const url = request.url()

  return failureText.includes('ERR_ABORTED') && url.includes('_rsc=')
}

const waitForReady = async (page) => {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  await page.locator('body').waitFor({ state: 'visible', timeout: 10000 })
}

const checkLayout = async (page) => page.evaluate(() => {
  const documentElement = document.documentElement
  const body = document.body
  const horizontalOverflow = Math.max(documentElement.scrollWidth, body.scrollWidth) - documentElement.clientWidth
  const visibleElements = Array.from(document.querySelectorAll('body *'))
    .filter((element) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)

      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    })

  const overflowingElements = visibleElements
    .map((element) => {
      const rect = element.getBoundingClientRect()
      return {
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className.slice(0, 160) : '',
        text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      }
    })
    .filter((element) => element.left < -2 || element.right > documentElement.clientWidth + 2)
    .slice(0, 10)

  const visibleProductCards = Array.from(document.querySelectorAll('article'))
    .filter((element) => {
      const rect = element.getBoundingClientRect()
      return rect.top < window.innerHeight && rect.bottom > 0
    }).length

  return {
    horizontalOverflow,
    viewportWidth: documentElement.clientWidth,
    viewportHeight: window.innerHeight,
    scrollWidth: Math.max(documentElement.scrollWidth, body.scrollWidth),
    visibleProductCards,
    overflowingElements,
  }
})

const screenshot = async (page, viewportName, name, fullPage = true) => {
  const suffix = fullPage ? 'full' : 'viewport'
  const filePath = path.join(outputDir, `${viewportName}-${name}-${suffix}.png`)
  await page.screenshot({ path: filePath, fullPage })
  return filePath
}

const buildEntry = ({
  viewport,
  pageName,
  url,
  status,
  screenshotPath,
  viewportScreenshotPath,
  layout,
  consoleErrors = [],
  failedRequests = [],
  issues = [],
}) => ({
  viewport: viewport.name,
  width: viewport.width,
  height: viewport.height,
  page: pageName,
  url,
  status,
  screenshot: screenshotPath ? path.relative(process.cwd(), screenshotPath) : null,
  viewportScreenshot: viewportScreenshotPath ? path.relative(process.cwd(), viewportScreenshotPath) : null,
  layout,
  consoleErrors: consoleErrors.slice(0, 10),
  failedRequests: failedRequests.slice(0, 10),
  issues,
})

const auditPage = async (browser, viewport, pageInfo, report) => {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
  const consoleErrors = []
  const failedRequests = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  page.on('requestfailed', (request) => {
    if (isBenignFailedRequest(request)) {
      return
    }

    failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`.trim())
  })

  const response = await page.goto(new URL(pageInfo.path, baseUrl).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })

  await waitForReady(page)

  const layout = await checkLayout(page)
  const screenshotPath = await screenshot(page, viewport.name, pageInfo.name)
  const viewportScreenshotPath = await screenshot(page, viewport.name, pageInfo.name, false)
  const status = response?.status() ?? 0
  const issues = []

  if (status >= 400 || status === 0) {
    issues.push(`HTTP status ${status}`)
  }

  if (layout.horizontalOverflow > 2) {
    issues.push(`Horizontal overflow ${layout.horizontalOverflow}px`)
  }

  if (failedRequests.length > 0) {
    issues.push(`${failedRequests.length} failed request(s)`)
  }

  report.push(buildEntry({
    viewport,
    pageName: pageInfo.name,
    url: page.url(),
    status,
    screenshotPath,
    viewportScreenshotPath,
    layout,
    consoleErrors,
    failedRequests,
    issues,
  }))

  await page.close()
}

const auditHeaderStates = async (browser, viewport, report) => {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await waitForReady(page)

  await screenshot(page, viewport.name, 'header-default', false)

  await page.evaluate(() => window.scrollTo({ top: 180 }))
  await page.waitForTimeout(350)
  await screenshot(page, viewport.name, 'header-compact', false)

  await page.locator('header input[type="text"]').first().fill('бе')
  await page.waitForTimeout(700)
  const screenshotPath = await screenshot(page, viewport.name, 'header-search-open', false)
  const layout = await checkLayout(page)
  const issues = layout.horizontalOverflow > 2 ? [`Horizontal overflow ${layout.horizontalOverflow}px`] : []

  report.push(buildEntry({
    viewport,
    pageName: 'header-states',
    url: page.url(),
    status: 200,
    screenshotPath,
    layout,
    issues,
  }))

  await page.close()
}

const auditProductDialog = async (browser, viewport, report) => {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await waitForReady(page)

  const firstProductButton = page.locator('article button').first()

  if (await firstProductButton.count() === 0) {
    report.push(buildEntry({
      viewport,
      pageName: 'product-dialog',
      url: page.url(),
      status: 0,
      layout: null,
      issues: ['No product card found'],
    }))
    await page.close()
    return
  }

  await firstProductButton.click()
  const dialog = page.locator('[role="dialog"]').first()
  const dialogOpened = await dialog.waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false)
  const layout = await checkLayout(page)
  const screenshotPath = await screenshot(page, viewport.name, 'product-dialog', false)
  const issues = []

  if (!dialogOpened) {
    issues.push('Product dialog did not open')
  }

  if (layout.horizontalOverflow > 2) {
    issues.push(`Horizontal overflow ${layout.horizontalOverflow}px`)
  }

  report.push(buildEntry({
    viewport,
    pageName: 'product-dialog',
    url: page.url(),
    status: 200,
    screenshotPath,
    layout,
    issues,
  }))

  await page.close()
}

const auditMobileFiltersDrawer = async (browser, viewport, report) => {
  if (viewport.width >= 1024) {
    return
  }

  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await waitForReady(page)

  const trigger = page.getByRole('button', { name: /Каталог/i }).first()
  const triggerFound = await trigger.count() > 0

  if (triggerFound) {
    await trigger.click()
    await page.locator('[data-slot="drawer-content"]').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
  }

  const layout = await checkLayout(page)
  const screenshotPath = await screenshot(page, viewport.name, 'mobile-filters-drawer', false)
  const issues = []

  if (!triggerFound) {
    issues.push('Mobile filters trigger not found')
  }

  if (layout.horizontalOverflow > 2) {
    issues.push(`Horizontal overflow ${layout.horizontalOverflow}px`)
  }

  report.push(buildEntry({
    viewport,
    pageName: 'mobile-filters-drawer',
    url: page.url(),
    status: 200,
    screenshotPath,
    layout,
    issues,
  }))

  await page.close()
}

await fs.mkdir(outputDir, { recursive: true })

const browser = await chromium.launch()
const report = []

try {
  for (const viewport of viewports) {
    for (const pageInfo of pages) {
      await auditPage(browser, viewport, pageInfo, report)
    }

    await auditHeaderStates(browser, viewport, report)
    await auditMobileFiltersDrawer(browser, viewport, report)
    await auditProductDialog(browser, viewport, report)
  }
} finally {
  await browser.close()
}

const reportPath = path.join(outputDir, 'report.json')
await fs.writeFile(reportPath, `${JSON.stringify({
  baseUrl,
  generatedAt: new Date().toISOString(),
  viewports,
  report,
}, null, 2)}\n`)

const failures = report.filter((entry) => entry.issues.length > 0)

console.log(`Desktop visual audit completed: ${path.relative(process.cwd(), reportPath)}`)
console.log(`Screenshots: ${path.relative(process.cwd(), outputDir)}`)

if (failures.length > 0) {
  console.error(`Found ${failures.length} issue(s):`)
  failures.forEach((entry) => {
    console.error(`- ${entry.viewport} ${entry.page}: ${entry.issues.join('; ')}`)
  })
  process.exitCode = 1
}
