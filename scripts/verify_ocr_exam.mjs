import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.locator("button:has-text('AI Chấm Bài Viết')").locator("visible=true").first().click();
  await page.waitForTimeout(1000);

  // Click Exam Preset
  const examBtn = page.locator("text=Bài thi viết chữ đẹp Lớp 1").first();
  await examBtn.click();
  await page.waitForTimeout(1500);

  const imgEl = page.locator("img[alt='Bài viết học sinh']").first();
  const box = await imgEl.boundingBox();

  // 1. Drag Row 1 (letter 'v')
  console.log("\n--- Testing Exam Row 1 (letter 'v') ---");
  let sx = box.x + box.width * 0.05;
  let sy = box.y + box.height * 0.31;
  let ex = box.x + box.width * 0.12;
  let ey = box.y + box.height * 0.36;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(ex, ey, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(2000);

  let textCard = await page.locator("text=AI Vision OCR đọc nét:").locator("..").innerText();
  console.log("Exam Row 1:\n", textCard.substring(0, 150));

  // 2. Drag Row 2 (letter 'ua')
  console.log("\n--- Testing Exam Row 2 (word 'ua') ---");
  sx = box.x + box.width * 0.20;
  sy = box.y + box.height * 0.39;
  ex = box.x + box.width * 0.32;
  ey = box.y + box.height * 0.45;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(ex, ey, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(2000);

  textCard = await page.locator("text=AI Vision OCR đọc nét:").locator("..").innerText();
  console.log("Exam Row 2:\n", textCard.substring(0, 150));

  // 3. Drag Row 3 (word 'xe ngựa')
  console.log("\n--- Testing Exam Row 3 (word 'xe ngựa') ---");
  sx = box.x + box.width * 0.06;
  sy = box.y + box.height * 0.48;
  ex = box.x + box.width * 0.28;
  ey = box.y + box.height * 0.55;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(ex, ey, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(2000);

  textCard = await page.locator("text=AI Vision OCR đọc nét:").locator("..").innerText();
  console.log("Exam Row 3:\n", textCard.substring(0, 150));

  await page.screenshot({ path: "/Users/admin/Desktop/BeVuiHocChuVaSo/.ui_audit/test_ocr_exam_rows.png" });
  await browser.close();
  console.log("\nExam tests completed successfully!");
}

main().catch(console.error);
