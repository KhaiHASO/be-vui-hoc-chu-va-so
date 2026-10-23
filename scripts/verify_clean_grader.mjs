import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const targetUrl = process.env.TARGET_URL || "http://localhost:3000";
const outputDir = path.resolve(process.cwd(), ".ui_audit");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log(`🚀 Bắt đầu kiểm thử module Kính Lúp Soi Nét Mới tại ${targetUrl}`);
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

    // 3. Chụp toàn cảnh màn hình
    const fullShotPath = path.join(outputDir, `clean_grader_${vp.name}_full.png`);
    await page.screenshot({ path: fullShotPath, fullPage: true });
    console.log(`   ✓ Đã chụp toàn bộ giao diện -> ${fullShotPath}`);

    // 4. Bấm vào một ghim lỗi (❌) trên trang vở
    const errorPin = page.locator('button:has-text("❌")').first();
    if (await errorPin.isVisible()) {
      await errorPin.click();
      await page.waitForTimeout(400);
      console.log("   ✓ Đã bấm vào ghim lỗi trên trang vở");
    }

    // 5. Chụp cận cảnh Studio Kính lúp soi nét bên phải
    const studioPanel = page.locator('div:has(> canvas)').first().locator("xpath=ancestor::div[contains(@class, 'bg-[#090d16]')]");
    if (await studioPanel.isVisible()) {
      await studioPanel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const studioShotPath = path.join(outputDir, `clean_grader_${vp.name}_studio_lens.png`);
      await studioPanel.screenshot({ path: studioShotPath });
      console.log(`   ✓ Đã chụp cận cảnh Studio Kính Lúp -> ${studioShotPath}`);
    }

    await context.close();
  }

  await browser.close();
  console.log("\n🎉 HOÀN TẤT KIỂM THỬ TRỰC QUAN MODULE MỚI 100%!");
}

run().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
