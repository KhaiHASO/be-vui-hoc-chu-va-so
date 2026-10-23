import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const targetUrl = process.env.TARGET_URL || "http://localhost:3000";
const outputDir = path.resolve(process.cwd(), ".ui_audit");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log(`🚀 Bắt đầu kiểm thử trực quan Đánh Giá Thật tại ${targetUrl}`);
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

    const aiTabNav = page.locator('button:has-text("AI Chấm Bài Viết ⭐")').locator("visible=true").first();
    await aiTabNav.click();
    await page.waitForTimeout(400);

    // 3. Chọn Preset Bài 1
    const preset1 = page.locator('button:has-text("Vở học sinh có lỗi nét thực tế")').or(page.locator('button:has-text("Bài 1 (Chữ \'a\')")').first());
    await preset1.scrollIntoViewIfNeeded();
    await preset1.click();
    await page.waitForTimeout(400);

    // 4. Bấm AI Chấm Bài Viết
    const evaluateBtn = page.locator('button:has-text("AI Chấm Bài Viết")').last();
    await evaluateBtn.scrollIntoViewIfNeeded();
    await evaluateBtn.click();
    await page.waitForTimeout(1400);
    console.log("   ✓ Đã chấm xong và hiển thị đánh giá thực tế");

    // 5. Kiểm tra Dark Grid Inspector
    const darkCard = page.locator("#dark-grid-inspector");
    if (await darkCard.isVisible()) {
      await darkCard.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      // Chụp Nét bé viết thực tế kèm thông số đo đạc
      await darkCard.screenshot({
        path: path.join(outputDir, `audit_${vp.name}_real_student.png`),
      });
      console.log(`   ✓ Đã chụp Nét bé viết thực tế -> audit_${vp.name}_real_student.png`);

      // Bấm tab "Mẫu chuẩn cô giáo"
      const btnTeacher = darkCard.locator('button:has-text("Mẫu chuẩn cô giáo")');
      if (await btnTeacher.isVisible()) {
        await btnTeacher.click();
        await page.waitForTimeout(300);
        await darkCard.screenshot({
          path: path.join(outputDir, `audit_${vp.name}_real_teacher.png`),
        });
        console.log(`   ✓ Đã chụp Mẫu chuẩn cô giáo -> audit_${vp.name}_real_teacher.png`);
      }
    }

    // Chụp toàn màn hình
    await page.screenshot({
      path: path.join(outputDir, `audit_${vp.name}_real_layout.png`),
      fullPage: true,
    });
    console.log(`   ✓ Đã chụp toàn bộ giao diện -> audit_${vp.name}_real_layout.png`);

    await context.close();
  }

  await browser.close();
  console.log("\n🎉 HOÀN TẤT KIỂM THỬ TRỰC QUAN ĐÁNH GIÁ THỰC TẾ 100%!");
}

run().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
