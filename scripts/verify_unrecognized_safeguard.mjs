import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.locator("button:has-text('AI Chấm Bài Viết')").locator("visible=true").first().click();
  await page.waitForTimeout(1000);

  // Click Preset 1
  await page.locator("text=Bài 1: Nét chữ 'a' thực tế").first().click();
  await page.waitForTimeout(1500);

  const imgEl = page.locator("img[alt='Bài viết học sinh']").first();
  const box = await imgEl.boundingBox();

  // Drag on blank white margin at top-left
  console.log("Dragging on blank margin...");
  const sx = box.x + box.width * 0.02;
  const sy = box.y + box.height * 0.02;
  const ex = box.x + box.width * 0.08;
  const ey = box.y + box.height * 0.05;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(ex, ey, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(2000);

  const textCard = await page.locator(".text-sm.sm\\:text-base.font-black").first().innerText();
  console.log("Safeguard check result:", textCard);

  await page.screenshot({ path: "/Users/admin/Desktop/BeVuiHocChuVaSo/.ui_audit/test_safeguard_empty.png" });
  await browser.close();
}

main().catch(console.error);
