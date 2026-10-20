import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const targetUrl = process.env.TARGET_URL || "http://localhost:3000";
const outputDir = path.resolve(process.cwd(), ".ui_audit");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function testFormSwitching() {
  console.log(`🚀 Bắt đầu kiểm thử tương tác chuyển 4 dạng chữ cái tại ${targetUrl}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(targetUrl, { waitUntil: "networkidle" });

  // Mở chế độ Bé Tập Viết Ô Ly
  await page.getByRole("button", { name: /Bé Tập Viết Ô Ly/i }).click();
  await page.waitForTimeout(500);

  // 1. Chụp trạng thái mặc định (Tập viết chữ thường)
  const defaultShot = path.join(outputDir, "form_1_default_lower_cursive.png");
  await page.screenshot({ path: defaultShot });
  console.log(`   ✓ 1. Mặc định (Viết thường) -> ${defaultShot}`);

  // 2. Click nút "In hoa"
  const btnInHoa = page.getByRole("button", { name: /In hoa/i });
  await btnInHoa.click();
  await page.waitForTimeout(500);
  const inHoaShot = path.join(outputDir, "form_2_in_hoa.png");
  await page.screenshot({ path: inHoaShot });
  console.log(`   ✓ 2. Đã click In hoa -> ${inHoaShot}`);

  // 3. Click nút "Viết hoa"
  const btnVietHoa = page.getByRole("button", { name: /Viết hoa/i });
  await btnVietHoa.click();
  await page.waitForTimeout(500);
  const vietHoaShot = path.join(outputDir, "form_3_viet_hoa.png");
  await page.screenshot({ path: vietHoaShot });
  console.log(`   ✓ 3. Đã click Viết hoa -> ${vietHoaShot}`);

  // 4. Click nút "In thường"
  const btnInThuong = page.getByRole("button", { name: /In thường/i });
  await btnInThuong.click();
  await page.waitForTimeout(500);
  const inThuongShot = path.join(outputDir, "form_4_in_thuong.png");
  await page.screenshot({ path: inThuongShot });
  console.log(`   ✓ 4. Đã click In thường -> ${inThuongShot}`);

  // 5. Click lại "TẬP VIẾT"
  const btnTapViet = page.getByRole("button", { name: /^TẬP VIẾT/i });
  await btnTapViet.click();
  await page.waitForTimeout(500);
  const tapVietShot = path.join(outputDir, "form_5_tap_viet_tro_lai.png");
  await page.screenshot({ path: tapVietShot });
  console.log(`   ✓ 5. Đã click trở lại TẬP VIẾT -> ${tapVietShot}`);

  await browser.close();
  console.log("\n🎉 HOÀN THÀNH KIỂM THỬ CLICK CHUYỂN 4 DẠNG CHỮ!");
}

testFormSwitching().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
