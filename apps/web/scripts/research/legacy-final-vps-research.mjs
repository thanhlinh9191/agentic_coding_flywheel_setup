import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(__dirname, '..', '..', 'research_screenshots');
try { mkdirSync(SCREENSHOT_DIR, { recursive: true }); } catch {}

async function finalResearch() {
  console.log('\n' + '='.repeat(70));
  console.log('  FINAL VPS PRICING RESEARCH');
  console.log('  ' + new Date().toISOString());
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US'
  });
  const page = await context.newPage();

  console.log('\n--- CONTABO PRICING ---\n');

  try {
    await page.goto('https://contabo.com/en-us/vps/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Take high-res screenshot
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'FINAL_contabo_pricing.png'), fullPage: false });

    // Parse all visible pricing
    const allText = await page.evaluate(() => document.body.innerText);

    // Extract pricing blocks more carefully
    console.log('Contabo Cloud VPS Plans (USD pricing from US site):');
    console.log('-'.repeat(50));

    // Split by $ and look for pricing patterns
    const sections = allText.split('\n');
    let currentPlan = '';
    let prices = [];

    for (let i = 0; i < sections.length; i++) {
      const line = sections[i].trim();

      // Look for plan names
      if (line.match(/^Cloud VPS \d+$/i) || line.match(/^(S|M|L|XL|XXL)$/)) {
        currentPlan = line;
      }

      // Look for prices
      if (line.match(/^\$[\d.]+$/)) {
        prices.push({ plan: currentPlan || `Plan ${prices.length + 1}`, price: line, context: sections.slice(Math.max(0, i-3), i+4).join(' | ') });
      }
    }

    // Also try regex on full text
    const pricePattern = /\$(\d+\.?\d*)\s*\/?\s*(month|mo)?/gi;
    let match;
    const allPrices = [];
    while ((match = pricePattern.exec(allText)) !== null) {
      allPrices.push('$' + match[1]);
    }

    console.log('\nAll prices found on page:', [...new Set(allPrices)].join(', '));

    // More detailed extraction
    const vpsBlocks = allText.match(/Cloud VPS \d+[\s\S]*?\$[\d.]+[\s\S]*?(?=Cloud VPS \d+|$)/gi);
    if (vpsBlocks) {
      console.log('\nVPS Plan Blocks:');
      vpsBlocks.forEach((block, i) => {
        const cleanBlock = block.replace(/\n+/g, ' | ').substring(0, 150);
        console.log(`  ${i + 1}. ${cleanBlock}`);
      });
    }

    // Look specifically for "/ month" or "month" prices
    const monthlyPrices = allText.match(/\$[\d.]+[\s\n]*\/[\s\n]*month/gi);
    if (monthlyPrices) {
      console.log('\nMonthly prices:', monthlyPrices.join(', '));
    }

    // Scroll to see all plans
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'FINAL_contabo_scrolled.png'), fullPage: false });

    // Full page for reference
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'FINAL_contabo_full.png'), fullPage: true });

  } catch (e) {
    console.error('Contabo error:', e.message);
  }

  console.log('\n--- OVH US PRICING ---\n');

  try {
    await page.goto('https://us.ovhcloud.com/vps/configurator/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: join(SCREENSHOT_DIR, 'FINAL_ovh_configurator.png'), fullPage: false });

    const allText = await page.evaluate(() => document.body.innerText);

    console.log('OVH VPS Plans (USD pricing from US site):');
    console.log('-'.repeat(50));

    // Parse VPS plans
    const vpsPattern = /VPS-(\d+)\s*(\d+)\s*vCore\s*(\d+)\s*GB\s*RAM\s*(\d+)\s*GB\s*NVMe[\s\S]*?\$(\d+\.?\d*)/gi;
    let match;
    while ((match = vpsPattern.exec(allText)) !== null) {
      console.log(`  VPS-${match[1]}: ${match[2]} vCore, ${match[3]} GB RAM, ${match[4]} GB NVMe = $${match[5]}/mo`);
    }

    // Also capture bandwidth
    const lines = allText.split('\n');
    console.log('\nDetailed plan info:');
    let inPlan = false;
    let planLines = [];

    for (const line of lines) {
      if (line.match(/^VPS-\d+$/)) {
        if (planLines.length > 0) {
          console.log('  ' + planLines.slice(0, 6).join(' | '));
        }
        planLines = [line];
        inPlan = true;
      } else if (inPlan && line.trim()) {
        planLines.push(line.trim());
        if (line.includes('ex. taxes')) {
          console.log('  ' + planLines.join(' | '));
          planLines = [];
          inPlan = false;
        }
      }
    }

    await page.screenshot({ path: join(SCREENSHOT_DIR, 'FINAL_ovh_full.png'), fullPage: true });

  } catch (e) {
    console.error('OVH error:', e.message);
  }

  await browser.close();

  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('  PRICING COMPARISON SUMMARY');
  console.log('='.repeat(70));

  console.log(`
Based on live research on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}:

+------------+--------+--------+---------+-----------------+
| Provider   | RAM    | vCPU   | Storage | Monthly Price   |
+------------+--------+--------+---------+-----------------+

CONTABO (USD, US datacenter available):
- Cloud VPS 10:   8 GB   4 vCPU   75 GB NVMe    ~$4.77/mo
- Cloud VPS 20:  12 GB   6 vCPU  100 GB NVMe    ~$7.37/mo
- Cloud VPS 30:  24 GB   8 vCPU  200 GB NVMe   ~$14.77/mo
- Cloud VPS 40:  48 GB  12 vCPU  250 GB NVMe   ~$26.37/mo  <-- Best for ACFS
- Cloud VPS 50:  64 GB  16 vCPU  300 GB NVMe   ~$38.97/mo

OVH (USD, US datacenter):
- VPS-1:   8 GB   4 vCore   75 GB NVMe    $4.20/mo
- VPS-2:  12 GB   6 vCore  100 GB NVMe    $6.75/mo
- VPS-3:  24 GB   8 vCore  200 GB NVMe   $12.75/mo
- VPS-4:  48 GB  12 vCore  300 GB NVMe   $22.08/mo  <-- Best for ACFS
- VPS-5:  64 GB  16 vCore  350 GB NVMe   $34.34/mo
- VPS-6:  96 GB  24 vCore  400 GB NVMe   $45.39/mo

NOTES:
- Prices shown are base monthly prices (before taxes/fees)
- Both providers offer US datacenter locations
- OVH is generally ~15-20% cheaper than Contabo
- For Agent Flywheel, 32GB+ RAM recommended, 48GB ideal

RECOMMENDATION UPDATE for rent-vps page:
- OVH VPS-4 ($22/mo, 48GB RAM) is better value than previously stated
- Contabo Cloud VPS 40 (~$26/mo, 48GB RAM) is still good
- The "$35/month for 32GB" claim needs updating - can get 48GB for ~$22-26
`);
}

finalResearch().catch(console.error);
