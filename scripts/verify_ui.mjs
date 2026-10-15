import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const targetUrl = process.env.TARGET_URL || "http://localhost:3000";
const outputDir = path.resolve(process.cwd(), ".ui_audit");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const VIEWPORTS = [
  { name: "mobile_iphone", width: 375, height: 812, isMobile: true, hasTouch: true },
  { name: "tablet_ipad", width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: "desktop_mac", width: 1440, height: 900, isMobile: false, hasTouch: false },
];

async function runAudit() {
  console.log(`🚀 Bắt đầu kiểm thử giao diện trực quan Bé Vui Học Chữ & Số tại: ${targetUrl}`);
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n📱 Kiểm tra Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
    });

    const page = await context.newPage();
    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });

    // 1. Chụp mục Học Chữ: Thẻ Chữ Cái 3D
    const letterCardShot = path.join(outputDir, `${vp.name}_1_chu_the_hoc.png`);
    await page.screenshot({ path: letterCardShot, fullPage: false });
    console.log(`   ✓ [Học Chữ] Đã chụp Thẻ Chữ Cái -> ${letterCardShot}`);

    // 2. Chụp mục Học Chữ: 11 Nét Cơ Bản
    try {
      if (vp.isMobile) {
        const menuBtn = page.getByRole("button", { name: /Mở Menu điều hướng/i });
        if (await menuBtn.isVisible()) await menuBtn.click();
        await page.waitForTimeout(400);
      }
      const strokesBtn = page.getByRole("button", { name: /11 Nét Cơ Bản/i });
      if (await strokesBtn.isVisible()) {
        await strokesBtn.click();
        await page.waitForTimeout(600);
        const strokeShot = path.join(outputDir, `${vp.name}_2_chu_11_net.png`);
        await page.screenshot({ path: strokeShot, fullPage: false });
        console.log(`   ✓ [Học Chữ] Đã chụp 11 Nét Cơ Bản -> ${strokeShot}`);
      }
    } catch (e) {
      console.warn(`   ⚠ Không chụp được 11 Nét:`, e.message);
    }

    // 3. Chụp mục Học Chữ: 14 Vần Ghép & Âm Đôi
    try {
      if (vp.isMobile) {
        const menuBtn = page.getByRole("button", { name: /Mở Menu điều hướng/i });
        if (await menuBtn.isVisible()) await menuBtn.click();
        await page.waitForTimeout(400);
      }
      const digraphsBtn = page.getByRole("button", { name: /14 Vần Ghép/i });
      if (await digraphsBtn.isVisible()) {
        await digraphsBtn.click();
        await page.waitForTimeout(600);
        const digraphShot = path.join(outputDir, `${vp.name}_3_chu_14_van_ghep.png`);
        await page.screenshot({ path: digraphShot, fullPage: false });
        console.log(`   ✓ [Học Chữ] Đã chụp 14 Vần Ghép -> ${digraphShot}`);
      }
    } catch (e) {
      console.warn(`   ⚠ Không chụp được 14 Vần Ghép:`, e.message);
    }

    // 4. Chụp mục Học Chữ: Bé Tập Viết Ô Ly
    try {
      if (vp.isMobile) {
        const menuBtn = page.getByRole("button", { name: /Mở Menu điều hướng/i });
        if (await menuBtn.isVisible()) await menuBtn.click();
        await page.waitForTimeout(400);
      }
      const writingBtn = page.getByRole("button", { name: /Bé Tập Viết Ô Ly/i });
      if (await writingBtn.isVisible()) {
        await writingBtn.click();
        await page.waitForTimeout(600);
        const writingShot = path.join(outputDir, `${vp.name}_4_chu_tap_viet.png`);
        await page.screenshot({ path: writingShot, fullPage: false });
        console.log(`   ✓ [Học Chữ] Đã chụp Bé Tập Viết Ô Ly -> ${writingShot}`);
      }
    } catch (e) {
      console.warn(`   ⚠ Không chụp được Viết Chữ:`, e.message);
    }

    // 5. Chụp mục Học Chữ: Khẩu Hình Phát Âm
    try {
      if (vp.isMobile) {
        const menuBtn = page.getByRole("button", { name: /Mở Menu điều hướng/i });
        if (await menuBtn.isVisible()) await menuBtn.click();
        await page.waitForTimeout(400);
      }
      const mouthBtn = page.getByRole("button", { name: /Khẩu Hình Phát Âm/i });
      if (await mouthBtn.isVisible()) {
        await mouthBtn.click();
        await page.waitForTimeout(600);
        const mouthShot = path.join(outputDir, `${vp.name}_5_chu_khau_hinh.png`);
        await page.screenshot({ path: mouthShot, fullPage: false });
        console.log(`   ✓ [Học Chữ] Đã chụp Khẩu Hình Phát Âm -> ${mouthShot}`);
      }
    } catch (e) {
      console.warn(`   ⚠ Không chụp được Khẩu Hình:`, e.message);
    }

    // 6. Chụp mục Học Chữ: Đố Vui Bắt Chữ
    try {
      if (vp.isMobile) {
        const menuBtn = page.getByRole("button", { name: /Mở Menu điều hướng/i });
        if (await menuBtn.isVisible()) await menuBtn.click();
        await page.waitForTimeout(400);
      }
      const quizBtn = page.getByRole("button", { name: /Đố Vui Bắt Chữ/i });
      if (await quizBtn.isVisible()) {
        await quizBtn.click();
        await page.waitForTimeout(600);
        const quizShot = path.join(outputDir, `${vp.name}_6_chu_do_vui.png`);
        await page.screenshot({ path: quizShot, fullPage: false });
        console.log(`   ✓ [Học Chữ] Đã chụp Đố Vui Bắt Chữ -> ${quizShot}`);
      }
    } catch (e) {
      console.warn(`   ⚠ Không chụp được Đố Vui:`, e.message);
    }

    // 7. Chuyển sang mục Lớn 2: HỌC SỐ
    try {
      if (vp.isMobile) {
        const switchBtn = page.getByRole("button", { name: /Đổi sang 🔢 Học Số/i });
        if (await switchBtn.isVisible()) await switchBtn.click();
      } else {
        const numberTab = page.getByRole("button", { name: /Học Số/i });
        if (await numberTab.isVisible()) await numberTab.click();
      }
      await page.waitForTimeout(600);

      const numCardShot = path.join(outputDir, `${vp.name}_7_so_the_hoc.png`);
      await page.screenshot({ path: numCardShot, fullPage: false });
      console.log(`   ✓ [Học Số] Đã chụp Thẻ Học Số -> ${numCardShot}`);

      // 8. Chụp Tách - Gộp Số
      if (vp.isMobile) {
        const menuBtn = page.getByRole("button", { name: /Mở Menu điều hướng/i });
        if (await menuBtn.isVisible()) await menuBtn.click();
        await page.waitForTimeout(400);
      }
      const bondsBtn = page.getByRole("button", { name: /Tách - Gộp Số/i });
      if (await bondsBtn.isVisible()) {
        await bondsBtn.click();
        await page.waitForTimeout(600);
        const bondsShot = path.join(outputDir, `${vp.name}_8_so_tach_gop.png`);
        await page.screenshot({ path: bondsShot, fullPage: false });
        console.log(`   ✓ [Học Số] Đã chụp Tách - Gộp Số -> ${bondsShot}`);
      }
    } catch (e) {
      console.warn(`   ⚠ Không chụp được Học Số:`, e.message);
    }

    await context.close();
  }

  await browser.close();
  console.log(`\n🎉 Hoàn thành kiểm thử trực quan! Mọi ảnh chụp lưu tại: ${outputDir}`);
}

runAudit().catch((err) => {
  console.error("❌ Lỗi kiểm thử giao diện:", err);
  process.exit(1);
});
