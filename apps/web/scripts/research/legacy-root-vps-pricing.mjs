import { chromium } from 'playwright';

const SCREENSHOT_DIR = './research_screenshots';

async function researchContabo() {
  console.log('\n=== CONTABO VPS RESEARCH ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    // Visit Contabo VPS page
    console.log('Visiting Contabo VPS page...');
    await page.goto('https://contabo.com/en/vps/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Take screenshot of main VPS page
    await page.screenshot({ path: `${SCREENSHOT_DIR}/contabo_vps_main.png`, fullPage: false });
    console.log('Screenshot saved: contabo_vps_main.png');

    // Get pricing information from the page
    const vpsPlans = await page.evaluate(() => {
      const plans = [];
      // Look for pricing cards
      const cards = document.querySelectorAll('.product-card, .pricing-card, [class*="vps"], [class*="plan"]');
      cards.forEach(card => {
        const text = card.innerText;
        if (text.includes('€') || text.includes('$') || text.includes('RAM') || text.includes('vCPU')) {
          plans.push(text.substring(0, 500));
        }
      });
      return plans;
    });

    console.log('\nContabo VPS Plans Found:');
    vpsPlans.slice(0, 5).forEach((plan, i) => {
      console.log(`\n--- Plan ${i + 1} ---`);
      console.log(plan);
    });

    // Scroll down to see more plans
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/contabo_vps_plans.png`, fullPage: false });
    console.log('Screenshot saved: contabo_vps_plans.png');

    // Try to find and click on Cloud VPS L or similar high-RAM plan
    console.log('\nLooking for Cloud VPS L or 32GB RAM plan...');

    // Get all text content to understand the page structure
    const pageText = await page.evaluate(() => document.body.innerText);

    // Look for pricing patterns
    const priceMatches = pageText.match(/(\d+[\.,]\d{2})\s*(€|EUR|\$|USD).*?(per month|\/mo|monthly)/gi);
    if (priceMatches) {
      console.log('\nPrices found:');
      priceMatches.slice(0, 10).forEach(p => console.log('  ' + p));
    }

    // Look for RAM specs
    const ramMatches = pageText.match(/\d+\s*GB\s*(RAM|Memory)/gi);
    if (ramMatches) {
      console.log('\nRAM options found:');
      [...new Set(ramMatches)].forEach(r => console.log('  ' + r));
    }

    // Try clicking configure on a plan
    const configButtons = await page.$$('text=Configure, text=Order, text=Add to cart');
    if (configButtons.length > 0) {
      console.log(`\nFound ${configButtons.length} configuration buttons`);
    }

    // Take full page screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/contabo_full_page.png`, fullPage: true });
    console.log('Screenshot saved: contabo_full_page.png');

  } catch (error) {
    console.error('Error researching Contabo:', error.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/contabo_error.png` });
  }

  await browser.close();
}

async function researchOVH() {
  console.log('\n=== OVH VPS RESEARCH ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    // Visit OVH VPS page (US site)
    console.log('Visiting OVH VPS page...');
    await page.goto('https://us.ovhcloud.com/vps/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ovh_vps_main.png`, fullPage: false });
    console.log('Screenshot saved: ovh_vps_main.png');

    // Get page content
    const pageText = await page.evaluate(() => document.body.innerText);

    // Look for pricing
    const priceMatches = pageText.match(/\$[\d,]+\.?\d*\s*(\/mo|per month|monthly)?/gi);
    if (priceMatches) {
      console.log('\nPrices found:');
      [...new Set(priceMatches)].slice(0, 15).forEach(p => console.log('  ' + p));
    }

    // Look for plan names
    const planMatches = pageText.match(/(VPS\s+\w+|Starter|Essential|Comfort|Elite)/gi);
    if (planMatches) {
      console.log('\nPlan types found:');
      [...new Set(planMatches)].forEach(p => console.log('  ' + p));
    }

    // Scroll to see plans
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ovh_vps_plans.png`, fullPage: false });
    console.log('Screenshot saved: ovh_vps_plans.png');

    // Take full page screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ovh_full_page.png`, fullPage: true });
    console.log('Screenshot saved: ovh_full_page.png');

  } catch (error) {
    console.error('Error researching OVH:', error.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ovh_error.png` });
  }

  await browser.close();
}

async function main() {
  console.log('Starting VPS pricing research...\n');

  await researchContabo();
  await researchOVH();

  console.log('\n=== RESEARCH COMPLETE ===');
  console.log(`Screenshots saved to ${SCREENSHOT_DIR}/`);
}

main().catch(console.error);
