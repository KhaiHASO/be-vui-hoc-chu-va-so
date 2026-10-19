import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const targetUrl = process.env.TARGET_URL || "http://localhost:3000";
const outputDir = path.resolve(process.cwd(), ".ui_audit");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function runTest() {
  console.log(`🚀 Bắt đầu kiểm thử trực quan AI Grader & Bố Cục Mobile tại ${targetUrl}`);
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

  // 1.1 Kiểm tra mục Khẩu Hình (Khắc phục lỗi anh1.jpg)
  const menuBtn = mobilePage.getByRole("button", { name: /Mở Menu điều hướng/i });
  if (await menuBtn.isVisible()) await menuBtn.click();
  await mobilePage.waitForTimeout(400);

  const mouthBtn = mobilePage.getByRole("button", { name: /Khẩu Hình Phát Âm/i });
  if (await mouthBtn.isVisible()) {
    await mouthBtn.click();
    await mobilePage.waitForTimeout(500);
    const mouthShot = path.join(outputDir, "verify_mobile_mouth_fix.png");
    await mobilePage.screenshot({ path: mouthShot, fullPage: false });
    console.log(`   ✓ Đã chụp kiểm chứng sửa lỗi header đè chữ (anh1.jpg) -> ${mouthShot}`);
  }

  // 1.2 Kiểm tra mục AI Chấm Bài Viết
  const menuBtn2 = mobilePage.getByRole("button", { name: /Mở Menu điều hướng/i });
  if (await menuBtn2.isVisible()) await menuBtn2.click();
  await mobilePage.waitForTimeout(400);

  const graderBtn = mobilePage.getByRole("button", { name: /AI Chấm Bài Viết/i });
  if (await graderBtn.isVisible()) {
    await graderBtn.click();
    await mobilePage.waitForTimeout(500);

    // Bấm xem bài thi mẫu
    const sampleBtn = mobilePage.getByRole("button", { name: /Xem Bài Thi Mẫu Lớp 1/i });
    await sampleBtn.click();
    await mobilePage.waitForTimeout(400);

    const uploadedShot = path.join(outputDir, "verify_mobile_grader_preview.png");
    await mobilePage.screenshot({ path: uploadedShot, fullPage: false });
    console.log(`   ✓ Đã chụp ảnh đã tải bài thi lên mobile -> ${uploadedShot}`);

    // Bấm chấm điểm
    const evalBtn = mobilePage.getByRole("button", { name: /Bắt Đầu Nhận Xét & Chấm Điểm/i });
    await evalBtn.click();
    await mobilePage.waitForTimeout(1500); // Đợi AI phân tích xong

    const resultShot = path.join(outputDir, "verify_mobile_grader_result.png");
    await mobilePage.screenshot({ path: resultShot, fullPage: false });
    console.log(`   ✓ Đã chụp kết quả chấm điểm AI trên mobile -> ${resultShot}`);
  }
  await mobileContext.close();

  // 2. TABLET VIEWPORT (768x1024)
  console.log("\n📱 2. Kiểm thử Tablet iPad (768x1024)...");
  const tabletContext = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const tabletPage = await tabletContext.newPage();
  await tabletPage.goto(targetUrl, { waitUntil: "networkidle" });

  const tabGraderBtn = tabletPage.getByRole("button", { name: /AI Chấm Bài Viết/i });
  if (await tabGraderBtn.isVisible()) {
    await tabGraderBtn.click();
    await tabletPage.waitForTimeout(400);
    const tabSampleBtn = tabletPage.getByRole("button", { name: /Xem Bài Thi Mẫu Lớp 1/i });
    await tabSampleBtn.click();
    await tabletPage.waitForTimeout(300);
    const tabEvalBtn = tabletPage.getByRole("button", { name: /Bắt Đầu Nhận Xét & Chấm Điểm/i });
    await tabEvalBtn.click();
    await tabletPage.waitForTimeout(1500);

    const tabResultShot = path.join(outputDir, "verify_tablet_grader_result.png");
    await tabletPage.screenshot({ path: tabResultShot, fullPage: false });
    console.log(`   ✓ Đã chụp kết quả chấm điểm AI trên tablet -> ${tabResultShot}`);
  }
  await tabletContext.close();

  // 3. DESKTOP VIEWPORT (1440x900)
  console.log("\n💻 3. Kiểm thử Desktop Mac (1440x900)...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(targetUrl, { waitUntil: "networkidle" });

  const dskGraderBtn = desktopPage.getByRole("button", { name: /AI Chấm Bài Viết/i });
  if (await dskGraderBtn.isVisible()) {
    await dskGraderBtn.click();
    await desktopPage.waitForTimeout(400);
    const dskSampleBtn = desktopPage.getByRole("button", { name: /Xem Bài Thi Mẫu Lớp 1/i });
    await dskSampleBtn.click();
    await desktopPage.waitForTimeout(300);
    const dskEvalBtn = desktopPage.getByRole("button", { name: /Bắt Đầu Nhận Xét & Chấm Điểm/i });
    await dskEvalBtn.click();
    await desktopPage.waitForTimeout(1500);

    const dskResultShot = path.join(outputDir, "verify_desktop_grader_result.png");
    await desktopPage.screenshot({ path: dskResultShot, fullPage: false });
    console.log(`   ✓ Đã chụp kết quả chấm điểm AI trên desktop -> ${dskResultShot}`);
  }
  await desktopContext.close();

  await browser.close();
  console.log("\n🎉 HOÀN THÀNH TOÀN BỘ KIỂM THỬ TRỰC QUAN PLAYWRIGHT!");
}

runTest().catch((err) => {
  console.error("Lỗi test:", err);
  process.exit(1);
});
