import { chromium } from "playwright";

async function verifyNewCanvas() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log("1. Navigating to http://localhost:3000 ...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

  console.log("2. Clicking 'Bé Tập Viết Ô Ly' ...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const b = btns.find((x) => x.textContent?.includes("Bé Tập Viết Ô Ly"));
    if (b) b.click();
  });
  await page.waitForTimeout(1000);

  // Take screenshot of Desktop page
  await page.screenshot({ path: ".ui_audit/new_canvas_desktop_letter_a.png" });
  console.log("✓ Saved .ui_audit/new_canvas_desktop_letter_a.png");

  // Click letter 'b'
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const b = btns.find((x) => x.textContent?.trim() === "b");
    if (b) b.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: ".ui_audit/new_canvas_desktop_letter_b.png" });
  console.log("✓ Saved .ui_audit/new_canvas_desktop_letter_b.png");

  // Click letter 'm'
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const b = btns.find((x) => x.textContent?.trim() === "m");
    if (b) b.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: ".ui_audit/new_canvas_desktop_letter_m.png" });
  console.log("✓ Saved .ui_audit/new_canvas_desktop_letter_m.png");

  await browser.close();
  console.log("🎉 DONE!");
}

verifyNewCanvas().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
