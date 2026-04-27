import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(__dirname, '..', '..', 'research_screenshots');
try { mkdirSync(SCREENSHOT_DIR, { recursive: true }); } catch {}

async function researchContaboCheckout() {
  console.log('\n' + '='.repeat(70));
  console.log('  CONTABO CHECKOUT RESEARCH - Navigate to actual pricing');
  console.log('='.repeat(70) + '\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'en-US',
    timezoneId: 'America/New_York'
  });
  const page = await context.newPage();

  try {
    // Visit each Cloud VPS product page
    const products = [
      { name: 'Cloud VPS 10 (8GB)', url: 'https://contabo.com/en-us/vps/cloud-vps-10/' },
      { name: 'Cloud VPS 20 (12GB)', url: 'https://contabo.com/en-us/vps/cloud-vps-20/' },
      { name: 'Cloud VPS 30 (24GB)', url: 'https://contabo.com/en-us/vps/cloud-vps-30/' },
      { name: 'Cloud VPS 40 (48GB)', url: 'https://contabo.com/en-us/vps/cloud-vps-40/' },
      { name: 'Cloud VPS 50 (64GB)', url: 'https://contabo.com/en-us/vps/cloud-vps-50/' },
    ];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`\n${i + 1}. Visiting ${product.name}...`);
      console.log(`   URL: ${product.url}`);

      await page.goto(product.url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2000);

      // Take screenshot
      await page.screenshot({
        path: join(SCREENSHOT_DIR, `contabo_product_${i + 1}.png`),
        fullPage: false
      });

      // Get pricing info
      const pageText = await page.evaluate(() => document.body.innerText);

      // Look for price
      const priceMatch = pageText.match(/\$(\d+\.?\d*)\s*\/\s*month/i) ||
                         pageText.match(/\$(\d+\.?\d*)/);
      const ramMatch = pageText.match(/(\d+)\s*GB\s*RAM/i);
      const cpuMatch = pageText.match(/(\d+)\s*vCPU/i);
      const storageMatch = pageText.match(/(\d+)\s*GB\s*(NVMe|SSD)/i);

      console.log(`   Price: ${priceMatch ? '$' + priceMatch[1] + '/mo' : 'Not found'}`);
      console.log(`   RAM: ${ramMatch ? ramMatch[1] + ' GB' : 'Not found'}`);
      console.log(`   vCPU: ${cpuMatch ? cpuMatch[1] : 'Not found'}`);
      console.log(`   Storage: ${storageMatch ? storageMatch[1] + ' GB ' + storageMatch[2] : 'Not found'}`);

      // Look for US datacenter option
      const hasUSDatacenter = pageText.toLowerCase().includes('united states') ||
                               pageText.toLowerCase().includes('usa') ||
                               pageText.toLowerCase().includes('new york') ||
                               pageText.toLowerCase().includes('seattle') ||
                               pageText.toLowerCase().includes('los angeles');
      console.log(`   US Datacenter: ${hasUSDatacenter ? 'Yes' : 'Not visible on this page'}`);

      // Full product details
      const specLines = pageText.split('\n')
        .filter(l => l.includes('GB') || l.includes('vCPU') || l.includes('$') || l.includes('Traffic'))
        .slice(0, 10);
      if (specLines.length > 0) {
        console.log('   Key specs found:');
        specLines.forEach(l => console.log('     - ' + l.trim().substring(0, 60)));
      }
    }

    // Now try to access the configurator/order page for a 32GB+ plan
    console.log('\n\n' + '='.repeat(70));
    console.log('  ATTEMPTING CHECKOUT FLOW FOR 48GB PLAN');
    console.log('='.repeat(70) + '\n');

    console.log('Visiting Cloud VPS 40 (48GB RAM) configuration...');
    await page.goto('https://contabo.com/en-us/vps/cloud-vps-40/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Look for "Order" or "Configure" button
    const orderButton = await page.$('a:has-text("Order"), button:has-text("Order"), a:has-text("Configure"), a:has-text("Select")');

    if (orderButton) {
      console.log('Found order button, clicking...');
      await orderButton.click();
      await page.waitForTimeout(5000);

      console.log('Current URL after click:', page.url());
      await page.screenshot({ path: join(SCREENSHOT_DIR, 'contabo_checkout_1.png'), fullPage: false });

      // Get checkout content
      const checkoutText = await page.evaluate(() => document.body.innerText);

      // Look for region/datacenter selection
      console.log('\nLooking for US datacenter options...');
      const regionLines = checkoutText.split('\n')
        .filter(l => l.toLowerCase().includes('region') ||
                     l.toLowerCase().includes('location') ||
                     l.toLowerCase().includes('united states') ||
                     l.toLowerCase().includes('usa') ||
                     l.toLowerCase().includes('datacenter'));
      regionLines.slice(0, 10).forEach(l => console.log('   ' + l.trim()));

      // Look for monthly price
      console.log('\nLooking for pricing details...');
      const priceLines = checkoutText.split('\n')
        .filter(l => l.includes('$') || l.includes('month') || l.includes('total'));
      priceLines.slice(0, 15).forEach(l => console.log('   ' + l.trim()));
    } else {
      console.log('No order button found on page');

      // Look for any links
      const links = await page.$$eval('a', els =>
        els.map(e => ({ text: e.innerText.substring(0, 30), href: e.href }))
          .filter(l => l.text.toLowerCase().includes('order') || l.text.toLowerCase().includes('select') || l.text.toLowerCase().includes('configure'))
      );
      console.log('Links found:', links);
    }

    // Full page screenshot
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'contabo_checkout_full.png'), fullPage: true });

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'contabo_checkout_error.png') });
  }

  await browser.close();
}

async function main() {
  await researchContaboCheckout();

  console.log('\n' + '='.repeat(70));
  console.log('  CONTABO RESEARCH COMPLETE');
  console.log('='.repeat(70) + '\n');
}

main().catch(console.error);
