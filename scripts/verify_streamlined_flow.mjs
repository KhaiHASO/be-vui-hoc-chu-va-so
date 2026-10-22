import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const targetUrl = process.env.TARGET_URL || "http://localhost:3000";
const outputDir = path.resolve(process.cwd(), ".ui_audit");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function runTest() {
  console.log(`🚀 Bắt đầu kiểm thử luồng tinh gọn & an toàn tại ${targetUrl}`);
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();
  await page.goto(targetUrl, { waitUntil: "networkidle" });

  // 1. Mở màn hình AI Chấm Bài Viết
  const graderBtn = page.getByRole("button", { name: /AI Chấm Bài Viết/i });
  await graderBtn.click();
  await page.waitForTimeout(600);

  // Chụp ảnh màn hình Landing tải ảnh tinh gọn
  const landingShot = path.join(outputDir, "streamlined_upload_landing.png");
  await page.screenshot({ path: landingShot });
  console.log(`   ✓ Đã chụp màn hình Landing tải ảnh -> ${landingShot}`);

  // 2. Bấm thử nghiệm nhanh với bài thi mẫu
  console.log("   -> Bấm thử với bài mẫu...");
  const trySampleBtn = page.getByRole("button", { name: /Bài thi mẫu/i });
  await trySampleBtn.click();
  await page.waitForTimeout(600);

  // 3. Kiểm tra các nút công cụ đa năng
  const editorShot = path.join(outputDir, "streamlined_editor_toolbar.png");
  await page.screenshot({ path: editorShot });
  console.log(`   ✓ Đã chụp trình chỉnh sửa đa năng -> ${editorShot}`);

  // 4. Vẽ khoanh 1 nét tự do & 1 nét tròn
  const svgLocator = page.locator("svg.cursor-crosshair").first();
  const box = await svgLocator.boundingBox();
  if (box) {
    console.log("   -> Vẽ nét khoanh tự do...");
    await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.45);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.18, box.y + box.height * 0.42);
    await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.52);
    await page.mouse.move(box.x + box.width * 0.14, box.y + box.height * 0.55);
    await page.mouse.move(box.x + box.width * 0.09, box.y + box.height * 0.48);
    await page.mouse.up();
    await page.waitForTimeout(400);

    // Chuyển sang khoanh tròn
    console.log("   -> Vẽ nét khoanh tròn...");
    const circleBtn = page.getByRole("button", { name: /Khoanh tròn/i });
    await circleBtn.click();
    await page.waitForTimeout(200);

    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.45);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.55);
    await page.mouse.up();
    await page.waitForTimeout(400);
  }

  // 5. Bấm AI Chấm Bài Viết và chờ phản hồi từ DeepSeek Flash
  console.log("   -> Bấm AI Chấm Bài Viết...");
  const evalBtn = page.getByRole("button", { name: /AI Chấm Bài Viết/i }).last();
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/evaluate-handwriting") && res.status() === 200,
      { timeout: 35000 }
    ),
    evalBtn.click(),
  ]);

  console.log("   ✓ Response status:", response.status());
  const resData = await response.json();
  console.log("   ✓ Điểm tổng:", resData.tong_diem, "| Xếp loại:", resData.xep_loai);

  await page.waitForTimeout(800);
  const resultShot = path.join(outputDir, "streamlined_evaluation_result.png");
  await page.screenshot({ path: resultShot });
  console.log(`   ✓ Đã chụp kết quả chấm điểm sư phạm -> ${resultShot}`);

  // 6. Kiểm tra tính năng Reload xóa trắng dữ liệu (Zero Storage)
  console.log("   -> Reload lại trang để kiểm tra không lưu ảnh cũ...");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // Mở lại AI Chấm Bài Viết
  const graderBtnAfterReload = page.getByRole("button", { name: /AI Chấm Bài Viết/i });
  await graderBtnAfterReload.click();
  await page.waitForTimeout(500);

  const afterReloadShot = path.join(outputDir, "streamlined_after_reload.png");
  await page.screenshot({ path: afterReloadShot });
  console.log(`   ✓ Đã chụp sau reload (phải về lại màn hình tải ảnh trắng tinh) -> ${afterReloadShot}`);

  await context.close();
  await browser.close();
  console.log("\n🎉 HOÀN TẤT KIỂM THỬ LUỒNG TINH GỌN!");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
