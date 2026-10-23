import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const targetUrl = process.env.TARGET_URL || "http://localhost:3000";
const outputDir = path.resolve(process.cwd(), ".ui_audit");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function verify() {
  console.log(`🚀 Bắt đầu kiểm thử trực quan Tập Viết Chữ Thường Theo Sách tại: ${targetUrl}`);
  const browser = await chromium.launch({ headless: true });

  // 1. DESKTOP (1440x900)
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

  // Kiểm tra không còn các nút In hoa / Viết hoa / In thường
  const textInHoa = await desktopPage.locator("text='In hoa'").count();
  const textVietHoa = await desktopPage.locator("text='Viết hoa'").count();
  console.log(`   ✓ Nút In hoa đếm được: ${textInHoa} (phải là 0)`);
  console.log(`   ✓ Nút Viết hoa đếm được: ${textVietHoa} (phải là 0)`);

  const dskFileA = path.join(outputDir, "lowercase_textbook_desktop_a.png");
  await desktopPage.screenshot({ path: dskFileA, fullPage: false });
  console.log(`   ✓ Đã chụp ảnh desktop chữ 'a' -> ${dskFileA}`);

  // Test toggle sang "Tự Viết"
  const toggleBtn = desktopPage.getByRole("button", { name: /Mẫu Sách|Tự Viết/i });
  await toggleBtn.click();
  await desktopPage.waitForTimeout(400);

  const dskFileTuViet = path.join(outputDir, "lowercase_textbook_desktop_tuviet.png");
  await desktopPage.screenshot({ path: dskFileTuViet, fullPage: false });
  console.log(`   ✓ Đã chụp ảnh desktop chế độ tự viết ô ly -> ${dskFileTuViet}`);

  await desktopContext.close();

  // 2. TABLET (768x1024)
  console.log("\n📟 2. Kiểm thử Tablet (768x1024)...");
  const tabletContext = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
  });
  const tabletPage = await tabletContext.newPage();
  await tabletPage.goto(targetUrl, { waitUntil: "networkidle" });

  // Bấm menu hoặc tab
  const tabWritingBtn = tabletPage.getByRole("button", { name: /Bé Tập Viết Ô Ly/i });
  if (await tabWritingBtn.isVisible()) {
    await tabWritingBtn.click();
  } else {
    const menuBtn = tabletPage.getByRole("button", { name: /Mở Menu điều hướng/i });
    if (await menuBtn.isVisible()) await menuBtn.click();
    await tabletPage.waitForTimeout(300);
    await tabletPage.getByRole("button", { name: /Bé Tập Viết Ô Ly/i }).click();
  }
  await tabletPage.waitForTimeout(600);

  const tabFile = path.join(outputDir, "lowercase_textbook_tablet.png");
  await tabletPage.screenshot({ path: tabFile, fullPage: false });
  console.log(`   ✓ Đã chụp ảnh tablet -> ${tabFile}`);

  await tabletContext.close();

  // 3. MOBILE IPHONE (375x812)
  console.log("\n📱 3. Kiểm thử Mobile (375x812)...");
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(targetUrl, { waitUntil: "networkidle" });

  const mobMenuBtn = mobilePage.getByRole("button", { name: /Mở Menu điều hướng/i });
  if (await mobMenuBtn.isVisible()) await mobMenuBtn.click();
  await mobilePage.waitForTimeout(300);
  await mobilePage.getByRole("button", { name: /Bé Tập Viết Ô Ly/i }).click();
  await mobilePage.waitForTimeout(600);

  const mobFile = path.join(outputDir, "lowercase_textbook_mobile.png");
  await mobilePage.screenshot({ path: mobFile, fullPage: false });
  console.log(`   ✓ Đã chụp ảnh mobile -> ${mobFile}`);

  await mobileContext.close();
  await browser.close();

  console.log("\n🎉 HOÀN TẤT KIỂM THỬ TRỰC QUAN!");
}

verify().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
