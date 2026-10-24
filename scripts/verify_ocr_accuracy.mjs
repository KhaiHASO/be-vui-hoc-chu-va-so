import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log("Navigating to http://localhost:3000 ...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

  const graderTab = page.locator("button:has-text('AI Chấm Bài Viết')").locator("visible=true").first();
  await graderTab.click();
  await page.waitForTimeout(1000);

  const presetBtn = page.locator("text=Bài 1: Nét chữ 'a' thực tế").first();
  if (await presetBtn.isVisible()) {
    await presetBtn.click();
    await page.waitForTimeout(1500);
  }

  const imgEl = page.locator("img[alt='Bài viết học sinh']").first();
  const box = await imgEl.boundingBox();

  if (!box) {
    console.error("Could not find student writing image!");
    await browser.close();
    return;
  }

  // Test 1: Row 1 (letter a)
  console.log("\n--- Testing Row 1 (letter 'a') ---");
  let sx = box.x + box.width * 0.35;
  let sy = box.y + box.height * 0.12;
  let ex = box.x + box.width * 0.45;
  let ey = box.y + box.height * 0.18;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(ex, ey, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(2000);

  let textCard = await page.locator("text=AI Vision OCR đọc nét:").locator("..").innerText();
  console.log("Row 1 Vision Card Content:\n", textCard.substring(0, 200));

  await page.screenshot({ path: "/Users/admin/Desktop/BeVuiHocChuVaSo/.ui_audit/test_ocr_row1_a.png" });

  // Test 2: Row 3 (word ca)
  console.log("\n--- Testing Row 3 (word 'ca') ---");
  sx = box.x + box.width * 0.35;
  sy = box.y + box.height * 0.33;
  ex = box.x + box.width * 0.50;
  ey = box.y + box.height * 0.42;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(ex, ey, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(2000);

  textCard = await page.locator("text=AI Vision OCR đọc nét:").locator("..").innerText();
  console.log("Row 3 Vision Card Content:\n", textCard.substring(0, 200));

  await page.screenshot({ path: "/Users/admin/Desktop/BeVuiHocChuVaSo/.ui_audit/test_ocr_row3_ca.png" });

  await browser.close();
  console.log("\nAll OCR tests completed successfully!");
}

main().catch(console.error);
