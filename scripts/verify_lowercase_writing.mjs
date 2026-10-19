import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const targetUrl = process.env.TARGET_URL || "http://localhost:3000";
const outputDir = path.resolve(process.cwd(), ".ui_audit");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function verifyWriting() {
  console.log(`🚀 Bắt đầu kiểm thử trực quan Tính năng Tập Viết Chữ Thường Lớp 1 tại: ${targetUrl}`);
  const browser = await chromium.launch({ headless: true });

  // 1. DESKTOP MAC (1440x900)
  console.log("\n💻 1. Kiểm thử Desktop (1440x900)...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(targetUrl, { waitUntil: "networkidle" });

  // Bấm vào chế độ "Bé Tập Viết Ô Ly"
  await desktopPage.getByRole("button", { name: /Bé Tập Viết Ô Ly/i }).click();
  await desktopPage.waitForTimeout(600);

  // Chụp màn hình chữ 'a'
  const dskLetterA = path.join(outputDir, "writing_lowercase_a_desktop.png");
  await desktopPage.screenshot({ path: dskLetterA, fullPage: false });
  console.log(`   ✓ Đã chụp chữ 'a' viết thường trên desktop -> ${dskLetterA}`);

  // Chọn chữ 'b' từ thanh chọn nhanh
  const btnB = desktopPage.getByRole("button", { name: /^b$/i });
  if (await btnB.isVisible()) {
    await btnB.click();
    await desktopPage.waitForTimeout(500);
    const dskLetterB = path.join(outputDir, "writing_lowercase_b_desktop.png");
    await desktopPage.screenshot({ path: dskLetterB, fullPage: false });
    console.log(`   ✓ Đã chụp chữ 'b' viết thường trên desktop -> ${dskLetterB}`);
  }

  await desktopContext.close();

  // 2. MOBILE IPHONE (375x812)
  console.log("\n📱 2. Kiểm thử Mobile iPhone (375x812)...");
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(targetUrl, { waitUntil: "networkidle" });

  // Mở menu mobile
  const menuBtn = mobilePage.getByRole("button", { name: /Mở Menu điều hướng/i });
  if (await menuBtn.isVisible()) await menuBtn.click();
  await mobilePage.waitForTimeout(400);

  await mobilePage.getByRole("button", { name: /Bé Tập Viết Ô Ly/i }).click();
  await mobilePage.waitForTimeout(600);

  const mobLetterA = path.join(outputDir, "writing_lowercase_a_mobile.png");
  await mobilePage.screenshot({ path: mobLetterA, fullPage: false });
  console.log(`   ✓ Đã chụp chữ 'a' viết thường trên mobile -> ${mobLetterA}`);

  // Bấm chuyển chế độ mẫu mờ
  const ghostBtn = mobilePage.getByRole("button", { name: /Mẫu nét đứt|Chữ thảo mờ|Tự viết/i });
  if (await ghostBtn.isVisible()) {
    await ghostBtn.click();
    await mobilePage.waitForTimeout(300);
    const mobGhost = path.join(outputDir, "writing_lowercase_ghost_toggle_mobile.png");
    await mobilePage.screenshot({ path: mobGhost, fullPage: false });
    console.log(`   ✓ Đã chụp đổi chế độ mẫu mờ trên mobile -> ${mobGhost}`);
  }

  await mobileContext.close();

  await browser.close();
  console.log("\n🎉 HOÀN TẤT KIỂM THỬ TRỰC QUAN TẬP VIẾT CHỮ THƯỜNG!");
}

verifyWriting().catch((err) => {
  console.error("Lỗi test:", err);
  process.exit(1);
});
