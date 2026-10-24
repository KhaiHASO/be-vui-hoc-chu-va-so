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

  if (box) {
    // Letter 'a' in Row 1:
    // x around 35% to 45% of image width
    // y around 25% to 35% of image height
    const startX = box.x + box.width * 0.35;
    const startY = box.y + box.height * 0.25;
    const endX = box.x + box.width * 0.45;
    const endY = box.y + box.height * 0.35;

    console.log(`Dragging letter 'a' from (${startX}, ${startY}) to (${endX}, ${endY}) ...`);
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.mouse.up();

    console.log("Waiting for AI Vision spot inspection to finish...");
    await page.waitForTimeout(2500);
  }

  await page.screenshot({ path: "/Users/admin/Desktop/BeVuiHocChuVaSo/.ui_audit/ai_vision_row1_letter_a.png", fullPage: false });
  console.log("Saved row 1 letter a screenshot to .ui_audit/ai_vision_row1_letter_a.png");

  await browser.close();
}

main().catch(console.error);
