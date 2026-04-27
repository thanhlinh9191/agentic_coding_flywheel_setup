import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(__dirname, '..', '..', 'research_screenshots');

// Ensure directory exists
try { mkdirSync(SCREENSHOT_DIR, { recursive: true }); } catch {}

async function researchContabo() {
  console.log('\n' + '='.repeat(60));
  console.log('  CONTABO VPS RESEARCH');
  console.log('='.repeat(60) + '\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    // Visit Contabo VPS page
    console.log('1. Visiting https://contabo.com/en/vps/');
    await page.goto('https://contabo.com/en/vps/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Take screenshot of main VPS page
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'contabo_01_vps_main.png'), fullPage: false });
    console.log('   Screenshot: contabo_01_vps_main.png');

    // Get all text to understand pricing
    const pageText = await page.evaluate(() => document.body.innerText);

    // Extract pricing info
    console.log('\n2. Extracting VPS plan information...\n');

    // Parse for Cloud VPS plans
    const lines = pageText.split('\n').filter(line => line.trim());

    const planInfo = [];

    for (const line of lines) {
      if (line.includes('Cloud VPS') || line.includes('vCPU') || line.includes('GB RAM') ||
          line.includes('€') || line.includes('SSD') || line.includes('NVMe')) {
        planInfo.push(line.trim());
      }
    }

    console.log('   Plan details found:');
    // Get unique meaningful lines
    const uniqueLines = [...new Set(planInfo)].filter(l => l.length > 3 && l.length < 100);
    uniqueLines.slice(0, 30).forEach(l => console.log('   - ' + l));

    // Scroll to see more
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'contabo_02_plans_scroll.png'), fullPage: false });
    console.log('\n   Screenshot: contabo_02_plans_scroll.png');

    // Try to find a configure/order button for a VPS plan
    console.log('\n3. Looking for order buttons...');

    // Look for buttons
    const buttons = await page.$$eval('a, button', els =>
      els.filter(e => {
        const text = e.innerText?.toLowerCase() || '';
        return text.includes('configure') || text.includes('order') || text.includes('add to') || text.includes('select');
      }).map(e => ({text: e.innerText, href: e.href})).slice(0, 10)
    );

    console.log('   Order buttons found:', buttons.length);
    buttons.forEach(b => console.log('   - ' + b.text + (b.href ? ` (${b.href.substring(0, 50)}...)` : '')));

    // Full page screenshot
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'contabo_03_full_page.png'), fullPage: true });
    console.log('\n   Screenshot: contabo_03_full_page.png (full page)');

    // Try to click on a plan to see configuration
    console.log('\n4. Attempting to access plan configuration...');
    const orderLink = await page.$('a:has-text("Configure"), a:has-text("Order")');
    if (orderLink) {
      await orderLink.click();
      await page.waitForTimeout(5000);
      await page.screenshot({ path: join(SCREENSHOT_DIR, 'contabo_04_configuration.png'), fullPage: false });
      console.log('   Screenshot: contabo_04_configuration.png');

      const configText = await page.evaluate(() => document.body.innerText);
      const priceLines = configText.split('\n').filter(l => l.includes('€') || l.includes('$'));
      console.log('\n   Pricing on configuration page:');
      priceLines.slice(0, 15).forEach(l => console.log('   - ' + l.trim()));
    }

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'contabo_error.png') });
  }

  await browser.close();
}

async function researchOVH() {
  console.log('\n' + '='.repeat(60));
  console.log('  OVH VPS RESEARCH (US Site)');
  console.log('='.repeat(60) + '\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    // Visit OVH US VPS page
    console.log('1. Visiting https://us.ovhcloud.com/vps/');
    await page.goto('https://us.ovhcloud.com/vps/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'ovh_01_vps_main.png'), fullPage: false });
    console.log('   Screenshot: ovh_01_vps_main.png');

    // Get page content
    const pageText = await page.evaluate(() => document.body.innerText);

    console.log('\n2. Extracting VPS plan information...\n');

    // Look for plan info
    const lines = pageText.split('\n').filter(line => line.trim());
    let planInfo = [];

    for (const line of lines) {
      if (line.includes('VPS') || line.includes('vCPU') || line.includes('GB') ||
          line.includes('$') || line.includes('/mo') || line.includes('Starter') ||
          line.includes('Essential') || line.includes('Comfort') || line.includes('Elite')) {
        planInfo.push(line.trim());
      }
    }

    console.log('   Plan details found:');
    const uniqueLines = [...new Set(planInfo)].filter(l => l.length > 3 && l.length < 100);
    uniqueLines.slice(0, 30).forEach(l => console.log('   - ' + l));

    // Scroll and screenshot
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'ovh_02_plans_scroll.png'), fullPage: false });
    console.log('\n   Screenshot: ovh_02_plans_scroll.png');

    // Full page
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'ovh_03_full_page.png'), fullPage: true });
    console.log('   Screenshot: ovh_03_full_page.png (full page)');

    // Try to find order buttons
    console.log('\n3. Looking for order buttons...');
    const buttons = await page.$$eval('a, button', els =>
      els.filter(e => {
        const text = e.innerText?.toLowerCase() || '';
        return text.includes('order') || text.includes('buy') || text.includes('get started') || text.includes('select');
      }).map(e => ({text: e.innerText?.substring(0, 50), href: e.href})).slice(0, 10)
    );

    console.log('   Order buttons found:', buttons.length);
    buttons.forEach(b => console.log('   - ' + b.text));

    // Try clicking an order button
    console.log('\n4. Attempting to access configuration/checkout...');
    const orderBtn = await page.$('a:has-text("Order"), a:has-text("Get started"), button:has-text("Order")');
    if (orderBtn) {
      await orderBtn.click();
      await page.waitForTimeout(5000);
      await page.screenshot({ path: join(SCREENSHOT_DIR, 'ovh_04_configuration.png'), fullPage: false });
      console.log('   Screenshot: ovh_04_configuration.png');

      console.log('   Current URL:', page.url());
    }

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'ovh_error.png') });
  }

  await browser.close();
}

async function main() {
  console.log('\n' + '#'.repeat(60));
  console.log('#  VPS PRICING RESEARCH - Contabo & OVH');
  console.log('#  ' + new Date().toISOString());
  console.log('#'.repeat(60));

  await researchContabo();
  await researchOVH();

  console.log('\n' + '='.repeat(60));
  console.log('  RESEARCH COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);
}

main().catch(console.error);
