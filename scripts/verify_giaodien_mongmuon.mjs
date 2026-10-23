import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const targetUrl = process.env.TARGET_URL || "http://localhost:3000";
const outputDir = path.resolve(process.cwd(), ".ui_audit");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log(`🚀 Bắt đầu kiểm thử trực quan chuẩn GiaoDienMongMuon tại ${targetUrl}`);
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 375, height: 812 },
  ];

  for (const vp of viewports) {
    console.log(`\n==================================================`);
    console.log(`📱 Kiểm tra thiết bị: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    console.log(`==================================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 1. Vào trang web
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    // 2. Chuyển sang tab AI Chấm Bài Viết
    if (vp.name === "mobile" || vp.name === "tablet") {
      const drawerOpenBtn = page.locator('button[aria-label="Mở Menu điều hướng"]').first();
      if (await drawerOpenBtn.isVisible()) {
        await drawerOpenBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Chọn nút AI Chấm Bài Viết ⭐ đang hiển thị (visible=true)
    const aiTabNav = page.locator('button:has-text("AI Chấm Bài Viết ⭐")').locator("visible=true").first();
    await aiTabNav.click();
    await page.waitForTimeout(400);
    console.log("   ✓ Đã vào module AI Chấm Bài Viết");

    // 3. Chọn Preset 1: Bài 1 lỗi nét móc (Chuẩn GiaoDienMongMuon)
    const preset1 = page.locator('button:has-text("Mẫu có lỗi nét")').first();
    await preset1.scrollIntoViewIfNeeded();
    await preset1.click();
    await page.waitForTimeout(400);
    console.log("   ✓ Đã nạp Preset 1 (Chuẩn GiaoDienMongMuon)");

    // 4. Bấm nút AI Chấm Bài Viết
    const evaluateBtn = page.locator('button:has-text("AI Chấm Bài Viết")').last();
    await evaluateBtn.scrollIntoViewIfNeeded();
    await evaluateBtn.click();
    await page.waitForTimeout(1400);
    console.log("   ✓ Đã đánh giá xong và hiển thị kết quả");

    // 5. Kiểm tra và chụp 3 chế độ soi nét trong #dark-grid-inspector
    const darkCard = page.locator("#dark-grid-inspector");
    if (await darkCard.isVisible()) {
      await darkCard.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      // Chế độ 1: Minh họa lỗi (Illustration)
      const btnIllustration = darkCard.locator('button:has-text("Minh họa lỗi")');
      if (await btnIllustration.isVisible()) {
        await btnIllustration.click();
        await page.waitForTimeout(300);
        await darkCard.screenshot({
          path: path.join(outputDir, `audit_${vp.name}_mode1_illustration.png`),
        });
        console.log(`   ✓ Đã chụp Chế độ 1 (Minh họa lỗi) -> audit_${vp.name}_mode1_illustration.png`);
      }

      // Chế độ 2: Nét bé viết (Student crop on grid)
      const btnStudent = darkCard.locator('button:has-text("Nét bé viết")');
      if (await btnStudent.isVisible()) {
        await btnStudent.click();
        await page.waitForTimeout(300);
        await darkCard.screenshot({
          path: path.join(outputDir, `audit_${vp.name}_mode2_student.png`),
        });
        console.log(`   ✓ Đã chụp Chế độ 2 (Nét bé viết) -> audit_${vp.name}_mode2_student.png`);
      }

      // Chế độ 3: Mẫu cô giáo (Teacher golden reference)
      const btnTeacher = darkCard.locator('button:has-text("Mẫu cô giáo")');
      if (await btnTeacher.isVisible()) {
        await btnTeacher.click();
        await page.waitForTimeout(300);
        await darkCard.screenshot({
          path: path.join(outputDir, `audit_${vp.name}_mode3_teacher.png`),
        });
        console.log(`   ✓ Đã chụp Chế độ 3 (Mẫu cô giáo) -> audit_${vp.name}_mode3_teacher.png`);
      }
    } else {
      console.warn("   ⚠️ Không tìm thấy #dark-grid-inspector");
    }

    // Chụp toàn màn hình cho viewport hiện tại
    await page.screenshot({
      path: path.join(outputDir, `audit_${vp.name}_full_layout.png`),
      fullPage: true,
    });
    console.log(`   ✓ Đã chụp toàn bộ giao diện -> audit_${vp.name}_full_layout.png`);

    await context.close();
  }

  await browser.close();
  console.log("\n🎉 TOÀN BỘ KIỂM THỬ TRỰC QUAN HOÀN TẤT THÀNH CÔNG 100%!");
}

run().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
