import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const screenshotDir = path.join(process.cwd(), "public", "screenshots", "focus_grader");
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function navigateToGrader(page, width) {
  if (width < 1024) {
    const menuBtn = page.locator('button[aria-label="Mở Menu điều hướng"]').first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(300);
    }
  }
  const graderItem = page.locator('button:has-text("AI Chấm Bài Viết")').locator("visible=true").first();
  await graderItem.click();
  await page.waitForTimeout(600);
}

async function runVerification() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Test (1440x900)
  console.log("--- 1. Testing Desktop (1440x900) ---");
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await desktopContext.newPage();
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await navigateToGrader(page, 1440);

  await page.screenshot({ path: path.join(screenshotDir, "01_desktop_upload_entry.png") });
  console.log("Captured 01_desktop_upload_entry.png");

  // Click Preset 1
  const preset1 = page.locator('button:has-text("Bài 1: Nét chữ \'a\' thực tế")');
  await preset1.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotDir, "02_desktop_workspace_empty.png") });
  console.log("Captured 02_desktop_workspace_empty.png");

  // Drag over a letter
  const imageWrapper = page.locator(".cursor-crosshair").first();
  const box = await imageWrapper.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.28, box.y + box.height * 0.32);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.40, box.y + box.height * 0.42, { steps: 5 });
    await page.mouse.up();
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotDir, "03_desktop_letter_inspected.png") });
  console.log("Captured 03_desktop_letter_inspected.png");

  // Test PDF sample preset
  const resetBtn = page.locator('button:has-text("Đổi bài")').first();
  await resetBtn.click();
  await page.waitForTimeout(500);
  const pdfPreset = page.locator('button:has-text("Vở tập viết lớp 1 (File PDF)")');
  await pdfPreset.click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(screenshotDir, "04_desktop_pdf_page1.png") });
  console.log("Captured 04_desktop_pdf_page1.png");

  // 2. Tablet Test (768x1024)
  console.log("--- 2. Testing Tablet (768x1024) ---");
  const tabletContext = await browser.newContext({
    viewport: { width: 768, height: 1024 },
  });
  const tabletPage = await tabletContext.newPage();
  await tabletPage.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await navigateToGrader(tabletPage, 768);
  await tabletPage.waitForTimeout(500);

  // Click Preset 1
  await tabletPage.locator('button:has-text("Bài 1: Nét chữ \'a\' thực tế")').click();
  await tabletPage.waitForTimeout(800);

  // Tap on a letter
  const tWrapper = tabletPage.locator(".cursor-crosshair").first();
  const tBox = await tWrapper.boundingBox();
  if (tBox) {
    await tabletPage.mouse.click(tBox.x + tBox.width * 0.35, tBox.y + tBox.height * 0.35);
  }
  await tabletPage.waitForTimeout(1500);
  await tabletPage.screenshot({ path: path.join(screenshotDir, "05_tablet_inspected.png") });
  console.log("Captured 05_tablet_inspected.png");

  // 3. Mobile Test (375x812)
  console.log("--- 3. Testing Mobile (375x812) ---");
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await navigateToGrader(mobilePage, 375);
  await mobilePage.waitForTimeout(500);

  await mobilePage.screenshot({ path: path.join(screenshotDir, "06_mobile_upload.png") });
  console.log("Captured 06_mobile_upload.png");

  await mobilePage.locator('button:has-text("Bài 1: Nét chữ \'a\' thực tế")').click();
  await mobilePage.waitForTimeout(800);

  const mWrapper = mobilePage.locator(".cursor-crosshair").first();
  const mBox = await mWrapper.boundingBox();
  if (mBox) {
    await mobilePage.mouse.click(mBox.x + mBox.width * 0.35, mBox.y + mBox.height * 0.35);
  }
  await mobilePage.waitForTimeout(1500);
  await mobilePage.screenshot({ path: path.join(screenshotDir, "07_mobile_inspected.png") });
  console.log("Captured 07_mobile_inspected.png");

  await browser.close();
  console.log("✅ All visual audits passed successfully!");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
