import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const targetUrl = process.env.TARGET_URL || "http://localhost:3000";
const outputDir = path.resolve(process.cwd(), ".ui_audit");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function runTest() {
  console.log(`🚀 Bắt đầu kiểm thử trực quan Flexible Manual Annotation tại ${targetUrl}`);
  const browser = await chromium.launch({ headless: true });

  // 1. DESKTOP VIEWPORT (1440x900)
  console.log("\n💻 1. Kiểm thử Desktop (1440x900)...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(targetUrl, { waitUntil: "networkidle" });

  const deskGraderBtn = desktopPage.getByRole("button", { name: /AI Chấm Bài Viết/i });
  if (await deskGraderBtn.isVisible()) {
    await deskGraderBtn.click();
    await desktopPage.waitForTimeout(600);

    // Chọn preset Trang 3: Bài 3-6
    const trang3Btn = desktopPage.getByRole("button", { name: /Trang 3: Bài 3-6/i });
    await trang3Btn.click();
    await desktopPage.waitForTimeout(800);

    // Tìm SVG canvas
    const svgLocator = desktopPage.locator("svg.cursor-crosshair").first();
    const box = await svgLocator.boundingBox();
    console.log("   ✓ SVG Bounding Box:", box);

    if (box) {
      // 1. Vẽ Khoanh tự do (Freehand)
      console.log("   -> Thao tác vẽ nét khoanh tự do...");
      await desktopPage.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.25);
      await desktopPage.mouse.down();
      await desktopPage.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.22);
      await desktopPage.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.30);
      await desktopPage.mouse.move(box.x + box.width * 0.38, box.y + box.height * 0.35);
      await desktopPage.mouse.move(box.x + box.width * 0.34, box.y + box.height * 0.28);
      await desktopPage.mouse.up();
      await desktopPage.waitForTimeout(400);

      // 2. Chuyển sang công cụ Khoanh tròn/Elip
      console.log("   -> Chuyển sang công cụ Khoanh tròn/Elip...");
      const circleToolBtn = desktopPage.getByRole("button", { name: /Khoanh tròn/i });
      await circleToolBtn.click();
      await desktopPage.waitForTimeout(200);

      // Đổi tag sang "Đẹp"
      const chuanTagBtn = desktopPage.locator('button[title="Nét viết chuẩn đẹp (màu xanh)"]');
      await chuanTagBtn.click();
      await desktopPage.waitForTimeout(200);

      // Kéo vẽ hình tròn
      await desktopPage.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.4);
      await desktopPage.mouse.down();
      await desktopPage.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.52);
      await desktopPage.mouse.up();
      await desktopPage.waitForTimeout(400);

      // 3. Chuyển sang công cụ Chữ Nhật (Rect)
      console.log("   -> Chuyển sang công cụ Chữ Nhật...");
      const rectToolBtn = desktopPage.getByRole("button", { name: "Chữ nhật" });
      await rectToolBtn.click();
      await desktopPage.waitForTimeout(200);

      // Đổi tag sang "Chú ý"
      const chuyTagBtn = desktopPage.locator('button[title="Cần chú ý rèn thêm (màu cam)"]');
      await chuyTagBtn.click();
      await desktopPage.waitForTimeout(200);

      // Kéo vẽ chữ nhật
      await desktopPage.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.6);
      await desktopPage.mouse.down();
      await desktopPage.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.75);
      await desktopPage.mouse.up();
      await desktopPage.waitForTimeout(400);

      // Chụp ảnh kết quả tương tác trên Desktop
      const deskAnnotatedShot = path.join(outputDir, "manual_annotation_desktop.png");
      await desktopPage.screenshot({ path: deskAnnotatedShot, fullPage: false });
      console.log(`   ✓ Đã chụp thao tác khoanh vùng Desktop -> ${deskAnnotatedShot}`);
    }
  }
  await desktopContext.close();

  // 2. MOBILE VIEWPORT (375x812)
  console.log("\n📱 2. Kiểm thử Mobile iPhone (375x812)...");
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(targetUrl, { waitUntil: "networkidle" });

  const mobileMenu = mobilePage.getByRole("button", { name: /Mở Menu điều hướng/i });
  if (await mobileMenu.isVisible()) await mobileMenu.click();
  await mobilePage.waitForTimeout(400);

  const mobGraderBtn = mobilePage.getByRole("button", { name: /AI Chấm Bài Viết/i });
  if (await mobGraderBtn.isVisible()) {
    await mobGraderBtn.click();
    await mobilePage.waitForTimeout(600);

    const mobTrang3Btn = mobilePage.getByRole("button", { name: /Trang 3: Bài 3-6/i });
    if (await mobTrang3Btn.isVisible()) {
      await mobTrang3Btn.click();
      await mobilePage.waitForTimeout(800);

      const mobShot = path.join(outputDir, "manual_annotation_mobile.png");
      await mobilePage.screenshot({ path: mobShot, fullPage: false });
      console.log(`   ✓ Đã chụp kết quả trên mobile -> ${mobShot}`);
    }
  }
  await mobileContext.close();

  // 3. TABLET VIEWPORT (768x1024)
  console.log("\n📟 3. Kiểm thử Tablet iPad (768x1024)...");
  const tabletContext = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
  });
  const tabletPage = await tabletContext.newPage();
  await tabletPage.goto(targetUrl, { waitUntil: "networkidle" });

  const tabGraderBtn = tabletPage.getByRole("button", { name: /AI Chấm Bài Viết/i });
  if (await tabGraderBtn.isVisible()) {
    await tabGraderBtn.click();
    await tabletPage.waitForTimeout(600);

    const tabTrang3Btn = tabletPage.getByRole("button", { name: /Trang 3: Bài 3-6/i });
    if (await tabTrang3Btn.isVisible()) {
      await tabTrang3Btn.click();
      await tabletPage.waitForTimeout(800);

      const tabShot = path.join(outputDir, "manual_annotation_tablet.png");
      await tabletPage.screenshot({ path: tabShot, fullPage: false });
      console.log(`   ✓ Đã chụp kết quả trên tablet -> ${tabShot}`);
    }
  }
  await tabletContext.close();

  await browser.close();
  console.log("\n🎉 HOÀN TẤT TOÀN BỘ KIỂM THỬ TRỰC QUAN!");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
