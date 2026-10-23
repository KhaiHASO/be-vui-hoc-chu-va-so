import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const targetUrl = process.env.TARGET_URL || "http://localhost:3000";
const outputDir = path.resolve(process.cwd(), ".ui_audit");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log(`🚀 Bắt đầu kiểm thử giao diện AI Chấm Bài Viết tinh gọn tại ${targetUrl}`);
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
    await page.waitForTimeout(600);
    console.log("   ✓ Đã vào module AI Chấm Bài Viết");

    // 3. Chụp toàn cảnh màn hình ban đầu (1x)
    const fullShotPath = path.join(outputDir, `clean_grader_${vp.name}_full.png`);
    await page.screenshot({ path: fullShotPath, fullPage: true });
    console.log(`   ✓ Đã chụp toàn bộ giao diện 1 màn hình -> ${fullShotPath}`);

    // 4. Bấm vào một ghim lỗi (❌) trên trang vở để phóng to
    const errorPin = page.locator('button:has-text("❌")').first();
    if (await errorPin.isVisible()) {
      await errorPin.click();
      await page.waitForTimeout(500);
      const zoomedShotPath = path.join(outputDir, `clean_grader_${vp.name}_zoomed_error.png`);
      await page.screenshot({ path: zoomedShotPath, fullPage: true });
      console.log(`   ✓ Đã bấm ghim lỗi & phóng to cận cảnh -> ${zoomedShotPath}`);
    }

    // 5. Thử click tự do vào một nét chữ bất kỳ trên trang vở (trên desktop)
    if (vp.name === "desktop") {
      const studentImg = page.locator('img[alt="Trang vở học sinh"]').first();
      if (await studentImg.isVisible()) {
        const box = await studentImg.boundingBox();
        if (box) {
          // Click vào chữ 'ca' ở dòng 3 (khoảng 40% width, 40% height)
          await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.4);
          await page.waitForTimeout(500);
          const freeClickShot = path.join(outputDir, `clean_grader_desktop_free_click.png`);
          await page.screenshot({ path: freeClickShot, fullPage: true });
          console.log(`   ✓ Đã kiểm tra click tự do phóng to -> ${freeClickShot}`);
        }
      }

      // Thử bấm nút "Toàn trang" để thu nhỏ lại
      const resetBtn = page.locator('button:has-text("Toàn trang")').first();
      if (await resetBtn.isVisible()) {
        await resetBtn.click();
        await page.waitForTimeout(400);
        const resetShot = path.join(outputDir, `clean_grader_desktop_reset.png`);
        await page.screenshot({ path: resetShot, fullPage: true });
        console.log(`   ✓ Đã bấm nút Toàn trang -> ${resetShot}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log("\n🎉 HOÀN TẤT KIỂM THỬ TRỰC QUAN GIAO DIỆN MỚI 100%!");
}

run().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
