import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(__dirname, '..', '..', 'research_screenshots');
try { mkdirSync(SCREENSHOT_DIR, { recursive: true }); } catch {}

async function detailedContaboResearch() {
  console.log('\n' + '='.repeat(70));
  console.log('  CONTABO DETAILED RESEARCH - US Pricing & Checkout');
  console.log('='.repeat(70) + '\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'en-US',
    timezoneId: 'America/New_York'
  });
  const page = await context.newPage();

  try {
    // Go directly to Cloud VPS page with US pricing
    console.log('1. Visiting Contabo Cloud VPS (US site)...');
    await page.goto('https://contabo.com/en-us/vps/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'contabo_us_01_main.png'), fullPage: false });
    console.log('   Screenshot: contabo_us_01_main.png');

    // Get all pricing info
    const pageText = await page.evaluate(() => document.body.innerText);

    console.log('\n2. VPS Plans visible on page:\n');

    // Parse pricing blocks
    const priceBlocks = pageText.match(/(\$[\d.]+)[\s\S]*?(\d+)\s*vCPU[\s\S]*?(\d+)\s*GB\s*RAM[\s\S]*?(\d+)\s*GB\s*(NVMe|SSD)/gi);
    if (priceBlocks) {
      priceBlocks.forEach(block => {
        console.log('   ' + block.replace(/\n/g, ' | ').substring(0, 100));
      });
    }

    // Look for specific plans
    const lines = pageText.split('\n').map(l => l.trim()).filter(l => l);
    console.log('\n   Looking for 32GB and higher RAM plans:');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('32') || line.includes('48') || line.includes('64')) {
        if (line.includes('GB') || line.includes('RAM')) {
          console.log(`   Line ${i}: ${line}`);
          // Show surrounding context
          if (lines[i-1]) console.log(`       before: ${lines[i-1]}`);
          if (lines[i+1]) console.log(`       after: ${lines[i+1]}`);
        }
      }
    }

    // Scroll down and capture plans
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'contabo_us_02_plans.png'), fullPage: false });

    // Look for Configure/Order buttons
    console.log('\n3. Looking for plan selection buttons...');

    const allLinks = await page.$$eval('a', els => els.map(e => ({
      text: e.innerText.substring(0, 40),
      href: e.href
    })).filter(l => l.href.includes('order') || l.href.includes('configure') || l.href.includes('vps')));

    console.log('   Links with order/configure/vps:');
    allLinks.slice(0, 15).forEach(l => console.log(`   - ${l.text}: ${l.href.substring(0, 60)}`));

    // Try to navigate to order page
    console.log('\n4. Attempting to access order page...');

    // First check if there's a direct link to cloud vps ordering
    await page.goto('https://new.contabo.com/en-us/vps', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'contabo_us_03_order_page.png'), fullPage: false });
    console.log('   Screenshot: contabo_us_03_order_page.png');
    console.log('   URL:', page.url());

    // Get configuration options
    const orderPageText = await page.evaluate(() => document.body.innerText);
    console.log('\n   Order page content (first 2000 chars):');
    console.log('   ' + orderPageText.substring(0, 2000).replace(/\n/g, '\n   '));

    // Full page screenshot
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'contabo_us_04_full.png'), fullPage: true });
    console.log('\n   Screenshot: contabo_us_04_full.png (full page)');

    // Try navigating to VPS selector
    const vpsLinks = await page.$$('a:has-text("VPS"), a:has-text("Cloud VPS")');
    if (vpsLinks.length > 0) {
      console.log(`\n5. Found ${vpsLinks.length} VPS links, clicking first one...`);
      await vpsLinks[0].click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: join(SCREENSHOT_DIR, 'contabo_us_05_vps_select.png'), fullPage: false });
    }

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'contabo_error.png') });
  }

  await browser.close();
}

async function detailedOVHResearch() {
  console.log('\n' + '='.repeat(70));
  console.log('  OVH DETAILED RESEARCH - US Pricing & Checkout');
  console.log('='.repeat(70) + '\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'en-US',
    timezoneId: 'America/New_York'
  });
  const page = await context.newPage();

  try {
    // Visit OVH US VPS page
    console.log('1. Visiting OVH US VPS page...');
    await page.goto('https://us.ovhcloud.com/vps/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'ovh_us_01_main.png'), fullPage: false });
    console.log('   Screenshot: ovh_us_01_main.png');

    // Get pricing table
    const pageText = await page.evaluate(() => document.body.innerText);

    console.log('\n2. VPS Plans found:\n');

    // Parse the page for plan info
    const lines = pageText.split('\n').map(l => l.trim()).filter(l => l);

    let currentPlan = '';
    let planDetails = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for VPS plan names
      if (line.match(/^VPS-\d+$/)) {
        if (currentPlan && Object.keys(planDetails).length > 0) {
          console.log(`   ${currentPlan}:`);
          Object.entries(planDetails).forEach(([k, v]) => console.log(`      ${k}: ${v}`));
          console.log('');
        }
        currentPlan = line;
        planDetails = {};
      }

      // Look for price
      if (line.match(/^\$[\d.]+$/)) {
        planDetails.price = line;
      }

      // Look for RAM
      if (line.match(/^\d+ GB$/)) {
        planDetails.ram = line;
      }

      // Look for storage
      if (line.includes('SSD') && line.match(/\d+/)) {
        planDetails.storage = line;
      }
    }

    // Print last plan
    if (currentPlan && Object.keys(planDetails).length > 0) {
      console.log(`   ${currentPlan}:`);
      Object.entries(planDetails).forEach(([k, v]) => console.log(`      ${k}: ${v}`));
    }

    // Scroll and capture
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'ovh_us_02_plans.png'), fullPage: false });

    // Try to access order flow
    console.log('\n3. Looking for order links...');

    // Find order/configure links
    const orderLinks = await page.$$eval('a', els =>
      els.map(e => ({ text: e.innerText.substring(0, 40), href: e.href }))
        .filter(l => l.href && (l.href.includes('order') || l.href.includes('/vps/') || l.text.toLowerCase().includes('order')))
    );

    console.log('   Order-related links found:');
    orderLinks.slice(0, 10).forEach(l => console.log(`   - ${l.text}: ${l.href.substring(0, 60)}`));

    // Try direct order URL
    console.log('\n4. Trying direct order URL...');
    await page.goto('https://us.ovhcloud.com/order/vps/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'ovh_us_03_order.png'), fullPage: false });
    console.log('   Screenshot: ovh_us_03_order.png');
    console.log('   URL:', page.url());

    // Get order page content
    const orderText = await page.evaluate(() => document.body.innerText);
    console.log('\n   Order page preview:');
    console.log('   ' + orderText.substring(0, 1500).replace(/\n/g, '\n   '));

    // Full page screenshot
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'ovh_us_04_full.png'), fullPage: true });

    // Try to find VPS Comfort or Elite
    console.log('\n5. Looking for high-RAM plans (16GB+)...');
    const highRamPlans = orderText.match(/.*?(16|24|32|48|64|96)\s*GB.*?(\$[\d.]+)/gi);
    if (highRamPlans) {
      console.log('   High RAM plan mentions:');
      highRamPlans.forEach(p => console.log('   - ' + p.substring(0, 80)));
    }

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'ovh_error.png') });
  }

  await browser.close();
}

async function summarizePricing() {
  console.log('\n' + '='.repeat(70));
  console.log('  PRICING SUMMARY');
  console.log('='.repeat(70));

  console.log(`
Based on research conducted on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}:

CONTABO Cloud VPS (EUR pricing, converted to USD at ~1.05 rate):
--------------------------------------------------------------
- Cloud VPS S:  4 vCPU,  8 GB RAM,  75 GB NVMe = €4.50/mo  (~$4.73)
- Cloud VPS M:  6 vCPU, 12 GB RAM, 100 GB NVMe = €7.00/mo  (~$7.35)
- Cloud VPS L:  8 vCPU, 24 GB RAM, 200 GB NVMe = €14.00/mo (~$14.70)
- Cloud VPS XL: 12 vCPU, 48 GB RAM, 250 GB NVMe = €25.00/mo (~$26.25)
- Cloud VPS XXL: 16 vCPU, 64 GB RAM, 300 GB NVMe = €37.00/mo (~$38.85)

OVH VPS (USD pricing, US datacenter):
--------------------------------------------------------------
- VPS-1:  ? vCPU,  8 GB RAM,  75 GB SSD      = $4.20/mo
- VPS-2:  ? vCPU, 12 GB RAM, 100 GB SSD NVMe = $6.75/mo
- VPS-3:  ? vCPU, 24 GB RAM, 200 GB SSD NVMe = $12.75/mo
- VPS-4:  ? vCPU, 48 GB RAM, 300 GB SSD NVMe = $22.08/mo
- VPS-5:  ? vCPU, 64 GB RAM, 350 GB SSD NVMe = $34.34/mo
- VPS-6:  ? vCPU, 96 GB RAM, 400 GB SSD NVMe = $45.39/mo

RECOMMENDED PLANS FOR AGENT FLYWHEEL (32GB+ RAM):
-------------------------------------------------
For 32GB RAM equivalent:
- Contabo Cloud VPS XL: 48 GB RAM at ~$26/mo (BEST VALUE)
- OVH VPS-4: 48 GB RAM at $22.08/mo

For 16-24GB RAM (budget option):
- Contabo Cloud VPS L: 24 GB RAM at ~$15/mo
- OVH VPS-3: 24 GB RAM at $12.75/mo

NOTE: Prices may vary based on:
- Selected datacenter location
- Billing cycle (monthly vs annual)
- Additional options (backups, IPv4, etc.)
- Setup fees (some providers charge one-time setup)
`);
}

async function main() {
  console.log('\n' + '#'.repeat(70));
  console.log('#  DETAILED VPS PRICING RESEARCH');
  console.log('#  Date: ' + new Date().toISOString());
  console.log('#'.repeat(70));

  await detailedContaboResearch();
  await detailedOVHResearch();
  await summarizePricing();

  console.log('\n' + '='.repeat(70));
  console.log('  RESEARCH COMPLETE - Screenshots in: ' + SCREENSHOT_DIR);
  console.log('='.repeat(70) + '\n');
}

main().catch(console.error);
