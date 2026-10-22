import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const targetUrl = process.env.TARGET_URL || "http://localhost:3000";
const outputDir = path.resolve(process.cwd(), ".ui_audit");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function runTest() {
  console.log(`🚀 Bắt đầu kiểm thử trực quan AI Grader & Bounding Boxes tại ${targetUrl}`);
  const browser = await chromium.launch({ headless: true });

  // 1. MOBILE VIEWPORT (375x812)
  console.log("\n📱 1. Kiểm thử Mobile iPhone (375x812)...");
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(targetUrl, { waitUntil: "networkidle" });

  const menuBtn = mobilePage.getByRole("button", { name: /Mở Menu điều hướng/i });
  if (await menuBtn.isVisible()) await menuBtn.click();
  await mobilePage.waitForTimeout(400);

  const graderBtn = mobilePage.getByRole("button", { name: /AI Chấm Bài Viết/i });
  if (await graderBtn.isVisible()) {
    await graderBtn.click();
    await mobilePage.waitForTimeout(500);

    // Bấm chọn preset "Trang 3: Bài 3-6"
    const presetBtn = mobilePage.getByRole("button", { name: /Trang 3: Bài 3-6/i });
    if (await presetBtn.isVisible()) {
      await presetBtn.click();
      await mobilePage.waitForTimeout(1000);

      const resultShot = path.join(outputDir, "verify_mobile_grader_trang03.png");
      await mobilePage.screenshot({ path: resultShot, fullPage: false });
      console.log(`   ✓ Đã chụp kết quả Bounding Box trên mobile -> ${resultShot}`);
    }
  }
  await mobileContext.close();

  // 2. DESKTOP VIEWPORT (1440x900)
  console.log("\n💻 2. Kiểm thử Desktop (1440x900)...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(targetUrl, { waitUntil: "networkidle" });

  const deskGraderBtn = desktopPage.getByRole("button", { name: /AI Chấm Bài Viết/i });
  if (await deskGraderBtn.isVisible()) {
    await deskGraderBtn.click();
    await desktopPage.waitForTimeout(500);

    // Bấm chọn preset "Trang 3: Bài 3-6"
    const trang3Btn = desktopPage.getByRole("button", { name: /Trang 3: Bài 3-6/i });
    await trang3Btn.click();
    await desktopPage.waitForTimeout(1000);

    // Click vào chip "ê #3"
    const eChip = desktopPage.getByRole("button", { name: /ê #3/i });
    if (await eChip.isVisible()) {
      await eChip.click();
      await desktopPage.waitForTimeout(400);
    }

    const deskTrang3Shot = path.join(outputDir, "verify_desktop_grader_trang03.png");
    await desktopPage.screenshot({ path: deskTrang3Shot, fullPage: false });
    console.log(`   ✓ Đã chụp kết quả 2 cột Trang 3 trên desktop -> ${deskTrang3Shot}`);

    // Bấm chọn preset "Bài thi viết chữ đẹp"
    const examBtn = desktopPage.getByRole("button", { name: /Bài thi viết chữ đẹp/i });
    await examBtn.click();
    await desktopPage.waitForTimeout(1000);

    const deskExamShot = path.join(outputDir, "verify_desktop_grader_exam.png");
    await desktopPage.screenshot({ path: deskExamShot, fullPage: false });
    console.log(`   ✓ Đã chụp kết quả Bài thi viết chữ đẹp trên desktop -> ${deskExamShot}`);
  }
  await desktopContext.close();

  await browser.close();
  console.log("\n🎉 HOÀN TẤT KIỂM THỬ TRỰC QUAN PLAYWRIGHT!");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
