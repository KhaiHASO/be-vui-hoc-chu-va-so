import { chromium } from "playwright";
import fs from "fs";

async function inspectCanvas() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

  // Navigate to 'Bé Tập Viết Ô Ly'
  await page.getByRole("button", { name: "Bé Tập Viết Ô Ly" }).click();
  await page.waitForTimeout(1000);

  // 1. Screenshot of the whole writing section
  await page.screenshot({ path: ".ui_audit/full_writing_page.png" });

  // 2. Locate the canvas container specifically
  const canvasContainers = page.locator("div.aspect-\\[4\\/3\\]");
  const count = await canvasContainers.count();
  console.log(`Found ${count} containers with aspect-[4/3]`);

  // Left card preview
  if (count > 0) {
    await canvasContainers.first().screenshot({ path: ".ui_audit/left_guide_card.png" });
  }

  // Right dual-canvas writing area
  if (count > 1) {
    await canvasContainers.nth(1).screenshot({ path: ".ui_audit/right_canvas_area.png" });
  }

  // Also check letter 'b' (tall letter) and letter 'm' (wide letter)
  // Let's click letter 'b'
  const letterBBtn = page.getByRole("button", { name: /^b$/ });
  if (await letterBBtn.count() > 0) {
    await letterBBtn.click();
    await page.waitForTimeout(800);
    await canvasContainers.nth(1).screenshot({ path: ".ui_audit/right_canvas_letter_b.png" });
  }

  // Let's click letter 'm'
  const letterMBtn = page.getByRole("button", { name: /^m$/ });
  if (await letterMBtn.count() > 0) {
    await letterMBtn.click();
    await page.waitForTimeout(800);
    await canvasContainers.nth(1).screenshot({ path: ".ui_audit/right_canvas_letter_m.png" });
  }

  // Mobile viewport test (iPhone 12 / 13)
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await mobilePage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const b = btns.find((x) => x.textContent?.includes("Bé Tập Viết Ô Ly"));
    if (b) b.click();
  });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: ".ui_audit/mobile_writing_screen.png" });

  await browser.close();
  console.log("Screenshots captured successfully!");
}

inspectCanvas().catch(console.error);
