import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT_DIR = path.join(process.cwd(), ".ui_audit", "visitor_logs");
fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 375, height: 812 },
  ];

  for (const vp of viewports) {
    console.log(`Checking viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
    });

    // Mở trang chủ
    await page.goto("http://localhost:3000/?dev=1", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // Chụp màn hình trang chính với badge và toast
    await page.screenshot({
      path: path.join(OUT_DIR, `${vp.name}_home_with_visitor_badge.png`),
      fullPage: false,
    });
    console.log(`✓ Saved ${vp.name}_home_with_visitor_badge.png`);

    // Bấm mở Modal Nhật Ký (chọn phần tử đang hiển thị)
    const badgeBtn = page.locator("button:visible:has-text('Online'), button:visible:has-text('đang học')").first();
    if (await badgeBtn.count() > 0) {
      await badgeBtn.click();
      await page.waitForTimeout(800);

      // Chụp màn hình Modal
      await page.screenshot({
        path: path.join(OUT_DIR, `${vp.name}_visitor_modal_open.png`),
        fullPage: false,
      });
      console.log(`✓ Saved ${vp.name}_visitor_modal_open.png`);

      // Thử bấm chuyển tab bộ lọc bên trong modal
      const aiTab = page.locator('[role="dialog"] button:has-text("AI Chấm Bài")').first();
      if (await aiTab.count() > 0) {
        await aiTab.click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(OUT_DIR, `${vp.name}_visitor_modal_filtered_ai.png`),
          fullPage: false,
        });
        console.log(`✓ Saved ${vp.name}_visitor_modal_filtered_ai.png`);
      }
    }

    await page.close();
  }

  await browser.close();
  console.log("All UI verification screenshots completed successfully!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
