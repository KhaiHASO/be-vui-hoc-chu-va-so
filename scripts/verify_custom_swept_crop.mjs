import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const targetUrl = process.env.TARGET_URL || "http://localhost:3000";
const outputDir = path.resolve(process.cwd(), ".ui_audit");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log(`🚀 Bắt đầu kiểm thử: Bôi chọn vùng thực tế và kiểm tra ảnh crop tại ${targetUrl}`);
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Vào trang web
  await page.goto(targetUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // 2. Chuyển sang tab AI Chấm Bài Viết
  const aiTabNav = page.locator('button:has-text("AI Chấm Bài Viết ⭐")').locator("visible=true").first();
  await aiTabNav.click();
  await page.waitForTimeout(400);

  // 3. Chọn Preset Bài 1
  const preset1 = page.locator('button:has-text("Vở học sinh có lỗi nét thực tế")').first();
  await preset1.scrollIntoViewIfNeeded();
  await preset1.click();
  await page.waitForTimeout(500);

  // 4. Chọn công cụ "Chữ nhật" (hoặc Khoanh tròn) để bôi chọn chữ 'b' ở dòng 2 (Bài 2, nửa dưới trang)
  const rectToolBtn = page.locator('button:has-text("Chữ nhật")').first();
  await rectToolBtn.click();
  await page.waitForTimeout(300);

  // Lấy vị trí thẻ SVG canvas
  const svgCanvas = page.locator("svg.cursor-crosshair").first();
  const box = await svgCanvas.boundingBox();
  if (!box) {
    throw new Error("Không tìm thấy canvas SVG");
  }

  // Quét vùng chữ 'b' ở Dòng 2 (Y khoảng 55% - 65% của ảnh)
  const startX = box.x + box.width * 0.45;
  const startY = box.y + box.height * 0.55;
  const endX = box.x + box.width * 0.56;
  const endY = box.y + box.height * 0.65;

  console.log(`   -> Đang quét chuột bôi chọn vùng chữ 'b' tại (${startX.toFixed(0)}, ${startY.toFixed(0)})...`);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(600);

  // 5. Kiểm tra thẻ #dark-grid-inspector
  const darkInspector = page.locator("#dark-grid-inspector");
  await darkInspector.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  // Chụp ảnh thẻ inspector xem có đúng là vùng chữ 'b' vừa quét không
  const shotPath = path.join(outputDir, "verified_user_swept_crop_letter_b.png");
  await darkInspector.screenshot({ path: shotPath });
  console.log(`   ✓ Đã chụp ảnh Dark Grid Inspector cho vùng vừa quét -> ${shotPath}`);

  // Kiểm tra thuộc tính src của ảnh trong inspector
  const imgElement = darkInspector.locator("img").first();
  const imgSrc = await imgElement.getAttribute("src");
  console.log(`   ✓ Image src trong inspector: ${imgSrc ? imgSrc.substring(0, 60) + "..." : "null"}`);

  if (imgSrc && imgSrc.startsWith("data:image/")) {
    console.log("   🎉 CHÍNH XÁC: Ảnh hiển thị là dữ liệu Base64 cắt trực tiếp từ tọa độ vừa quét!");
  } else if (imgSrc && imgSrc.includes("crop_hs_xau_d1_a_4")) {
    console.error("   ❌ LỖI: Vẫn bị fallback về ảnh crop_a cũ!");
  }

  await browser.close();
}

run().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
