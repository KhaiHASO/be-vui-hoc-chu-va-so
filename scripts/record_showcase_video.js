/**
 * Production Video Showcase Recorder for Bé Vui Học Chữ Và Số
 * Records the authentic Next.js application at http://localhost:3000
 * Perfectly synchronized with the original ThuAm.mp3 (121.728s total)
 */

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const VIDEO_DIR = "/tmp/pw_raw_video";
const FINAL_OUTPUT = "/Users/macos/Desktop/BeVuiHocChuVaSo/BeVuiHocChuVaSo_VideoGioiThieu.mp4";
const AUDIO_PATH = "/Users/macos/Desktop/BeVuiHocChuVaSo/ThuAm.mp3";

if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

// Clean old recordings
fs.readdirSync(VIDEO_DIR).forEach((f) => {
  try {
    fs.unlinkSync(path.join(VIDEO_DIR, f));
  } catch {}
});

// Helper for Catmull-Rom spline interpolation (smooth curves for handwriting)
function getCatmullRomPoints(pts, numSamples = 8) {
  const result = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let t = 0; t < 1; t += 1 / numSamples) {
      const t2 = t * t;
      const t3 = t2 * t;
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      );
      result.push({ x: Math.round(x), y: Math.round(y) });
    }
  }
  result.push(pts[pts.length - 1]);
  return result;
}

async function run() {
  console.log("🎥 Khởi chạy Playwright Chromium để quay video showcase từ http://localhost:3000 ...");
  console.log(`🎵 Audio file: ${AUDIO_PATH}`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--enable-font-antialiasing",
      "--force-device-scale-factor=1",
      "--window-size=1920,1080",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  // Inject a visual cursor and click ripple into the browser page with real-time mousemove tracking
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const cursor = document.createElement("div");
      cursor.id = "custom-cursor-pointer";
      cursor.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 24px;
        height: 24px;
        pointer-events: none;
        z-index: 999999;
        transform: translate(-100px, -100px);
        transition: transform 0.02s linear;
      `;
      cursor.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.45));">
          <path d="M5.5 3.2L18.5 13.5L12 14.5L15.5 21.5L12.5 22.8L9 15.8L5.5 19V3.2Z" fill="#7c3aed" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/>
        </svg>
      `;
      document.body.appendChild(cursor);

      // Real-time tracking of cursor position on EVERY mouse move
      window.addEventListener("mousemove", (e) => {
        cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      });

      window.__clickRipple = (x, y) => {
        const ripple = document.createElement("div");
        ripple.style.cssText = `
          position: fixed;
          top: ${y - 18}px;
          left: ${x - 18}px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.5);
          pointer-events: none;
          z-index: 999998;
          animation: cursorRipple 0.45s ease-out forwards;
        `;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 450);
      };

      const style = document.createElement("style");
      style.innerHTML = `
        @keyframes cursorRipple {
          0% { transform: scale(0.35); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    });
  });

  // Smooth mouse move helper
  async function smoothMove(x, y, durationMs = 500) {
    const steps = Math.max(12, Math.floor(durationMs / 20));
    await page.mouse.move(x, y, { steps });
  }

  // Smooth click helper
  async function smoothClickLocator(locator, waitAfter = 500) {
    try {
      if (!locator) return;
      if (!(await locator.isVisible({ timeout: 2500 }).catch(() => false))) return;
      const box = await locator.boundingBox({ timeout: 2500 }).catch(() => null);
      if (!box) return;
      const targetX = Math.round(box.x + box.width / 2);
      const targetY = Math.round(box.y + box.height / 2);
      await smoothMove(targetX, targetY, 400);
      await page.evaluate(({ cx, cy }) => window.__clickRipple?.(cx, cy), { cx: targetX, cy: targetY });
      await page.mouse.down();
      await page.waitForTimeout(80);
      await page.mouse.up();
      if (waitAfter > 0) await page.waitForTimeout(waitAfter);
    } catch (err) {
      console.warn("Click error ignored:", err.message);
    }
  }

  // Smooth scroll helper
  async function smoothScroll(deltaY, steps = 15, delay = 25) {
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, deltaY / steps);
      await page.waitForTimeout(delay);
    }
  }

  // Exact scene time keeper
  async function waitSceneTime(sceneStart, durationSeconds) {
    const elapsed = (Date.now() - sceneStart) / 1000;
    const remaining = durationSeconds - elapsed;
    if (remaining > 0) {
      await page.waitForTimeout(Math.round(remaining * 1000));
    }
  }

  const tourStartTime = Date.now();

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 1 [0:00 - 0:13 = 13.0s] Intro, Thương hiệu bevuihocchuvaso.site & Thẻ Chữ Cái 3D
  // Lời đọc: "Nét chữ, nết người. Bước vào lớp một là hành trình khám phá đầy mới mẻ của mỗi đứa trẻ..."
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("▶ [0:00 - 0:13] Scene 1: Intro, Thương hiệu & Thẻ Chữ Cái 3D");
  const s1Start = Date.now();

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // Move smoothly over brand badge in sidebar showing bevuihocchuvaso.site
  await smoothMove(138, 78, 700);
  await page.waitForTimeout(1800);

  // Move cursor to the 3D Letter Card for 'A'
  const cardLocator = page.locator("button:has-text('Lật Thẻ'), div.aspect-\\[4\\/3\\], img[alt*='Mặt trước']").first();
  const cardBox = await cardLocator.boundingBox({ timeout: 2000 }).catch(() => null);
  if (cardBox) {
    await smoothMove(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2, 800);
    await page.waitForTimeout(1200);
  }

  // Click Lật Thẻ 3D
  const flipBtn = page.locator("button:has-text(\"Lật Thẻ\")").first();
  await smoothClickLocator(flipBtn, 1500);

  await waitSceneTime(s1Start, 13.0);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 2 [0:13 - 0:24 = 11.0s] Tổng quan Nền tảng Học Liệu & Bảng Dấu Thanh
  // Lời đọc: "Với mong muốn mang đến cho trẻ một khởi đầu nhẹ nhàng và vui vẻ, chúng tôi giới thiệu nền tảng Bé Vui Học Chữ và Số..."
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("▶ [0:13 - 0:24] Scene 2: Tổng quan Nền tảng & Bảng Luyện Đọc Dấu Thanh");
  const s2Start = Date.now();

  // Click Nghe Cô Giảng
  const voiceBtn = page.locator("button:has-text(\"Nghe Cô Giảng\")").first();
  await smoothClickLocator(voiceBtn, 1400);

  // Scroll down to Bảng Luyện Đọc Phản Xạ 6 Dấu Thanh & Vần
  await smoothScroll(360, 15, 25);
  await page.waitForTimeout(600);

  // Click "cá"
  const caWord = page.locator("button:has-text(\"cá\")").first();
  await smoothClickLocator(caWord, 1000);

  // Click "nhà"
  const nhaWord = page.locator("button:has-text(\"nhà\")").first();
  await smoothClickLocator(nhaWord, 1000);

  // Click "bà"
  const baWord = page.locator("button:has-text(\"bà\")").first();
  await smoothClickLocator(baWord, 1000);

  // Scroll back to top
  await smoothScroll(-360, 15, 20);

  await waitSceneTime(s2Start, 11.0);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 3 [0:24 - 0:38 = 14.0s] 29 Chữ Cái, 11 Nét Cơ Bản & 14 Vần Ghép
  // Lời đọc: "Tại phân hệ Bé Học Chữ, các em làm quen với 29 chữ cái tiếng Việt, 11 nét cơ bản và 14 vần ghép..."
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("▶ [0:24 - 0:38] Scene 3: 29 Chữ Cái, 11 Nét Cơ Bản & 14 Vần Ghép");
  const s3Start = Date.now();

  // Click 11 Nét Cơ Bản in sidebar
  const strokesBtn = page.locator("aside button:has-text(\"11 Nét Cơ Bản\")").first();
  await smoothClickLocator(strokesBtn, 1400);

  // Click Nét hất
  const netHat = page.locator("button:has-text(\"Nét hất\"), button:has-text(\"Nét móc\")").first();
  await smoothClickLocator(netHat, 2000);

  // Click Nét khuyết trên
  const netKhuyet = page.locator("button:has-text(\"Nét khuyết trên\"), button:has-text(\"Nét khuyết\")").first();
  await smoothClickLocator(netKhuyet, 2200);

  // Click 14 Vần Ghép & Âm Đôi in sidebar
  const digraphsBtn = page.locator("aside button:has-text(\"14 Vần Ghép & Âm Đôi\")").first();
  await smoothClickLocator(digraphsBtn, 1500);

  // Click Vần ch
  const vanCh = page.locator("button:has-text(\"ch\"), div:has-text(\"ch\")").first();
  await smoothClickLocator(vanCh, 1600);

  // Click Vần kh
  const vanKh = page.locator("button:has-text(\"kh\"), div:has-text(\"kh\")").first();
  await smoothClickLocator(vanKh, 1800);

  await waitSceneTime(s3Start, 14.0);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 4 [0:38 - 0:48 = 10.0s] Bé Tập Viết Ô Ly (Dual Canvas Digital Board) ⭐
  // Lời đọc: "Không chỉ nhận biết mặt chữ, bé còn được thực hành trên bảng tập viết số hóa. Từng điểm đặt bút, hướng viết và nét chữ mẫu..."
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("▶ [0:38 - 0:48] Scene 4: Bé Tập Viết Ô Ly - Chữ 'a' Chuẩn Điểm 1 & Điểm 2");
  const s4Start = Date.now();

  // Click Bé Tập Viết Ô Ly
  const writingBtn = page.locator("aside button:has-text(\"Bé Tập Viết Ô Ly\")").first();
  await smoothClickLocator(writingBtn, 1200);

  // Click "Đậm" stroke button
  const damBtn = page.locator("button:has-text(\"Đậm\")").first();
  await smoothClickLocator(damBtn, 300);

  // Find the drawing canvas
  const drawCanvas = page.locator("canvas.cursor-crosshair").first();
  const cBox = await drawCanvas.boundingBox({ timeout: 2500 }).catch(() => null);

  if (cBox) {
    const pt = (rx, ry) => ({
      x: Math.round(cBox.x + cBox.width * rx),
      y: Math.round(cBox.y + cBox.height * ry),
    });

    // Stroke 1: Nét cong kín từ Điểm 1 theo chiều ngược kim đồng hồ
    const s1Ctrl = [
      pt(0.28, 0.52), // Điểm 1
      pt(0.23, 0.55),
      pt(0.18, 0.62),
      pt(0.17, 0.74),
      pt(0.20, 0.85),
      pt(0.29, 0.94),
      pt(0.39, 0.93),
      pt(0.47, 0.84),
      pt(0.50, 0.70),
      pt(0.51, 0.52), // Kết thúc chạm Điểm 2
    ];
    const s1Path = getCatmullRomPoints(s1Ctrl, 6);

    // Di chuyển chuột đến Điểm 1 và vẽ Nét 1
    await smoothMove(s1Path[0].x, s1Path[0].y, 350);
    await page.mouse.down();
    for (let i = 1; i < s1Path.length; i++) {
      await page.mouse.move(s1Path[i].x, s1Path[i].y, { steps: 2 });
      await page.waitForTimeout(20);
    }
    await page.mouse.up();
    await page.waitForTimeout(180);

    // Stroke 2: Nét móc ngược từ Điểm 2
    const s2Ctrl = [
      pt(0.51, 0.52), // Điểm 2
      pt(0.51, 0.65),
      pt(0.51, 0.78),
      pt(0.51, 0.87),
      pt(0.54, 0.93),
      pt(0.60, 0.93),
      pt(0.66, 0.86),
      pt(0.71, 0.74), // Dừng nét ở dòng kẻ 2
    ];
    const s2Path = getCatmullRomPoints(s2Ctrl, 6);

    // Di chuyển chuột đến Điểm 2 và vẽ Nét 2
    await smoothMove(s2Path[0].x, s2Path[0].y, 250);
    await page.mouse.down();
    for (let i = 1; i < s2Path.length; i++) {
      await page.mouse.move(s2Path[i].x, s2Path[i].y, { steps: 2 });
      await page.waitForTimeout(20);
    }
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Click "Khen Bé Hoàn Thành 🎉"
    const khenBtn = page.locator("button:has-text(\"Khen Bé Hoàn Thành\")").first();
    await smoothClickLocator(khenBtn, 1200);
  }

  await waitSceneTime(s4Start, 10.0);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 5 [0:48 - 1:01 = 13.0s] Bé Học Số (Thẻ Số 3D, Bé Tập Đếm & Tách - Gộp CPA)
  // Lời đọc: "Đến với phân hệ Bé Học Số, các con được khám phá những con số từ 0 đến 10 qua hoạt động tập đếm..."
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("▶ [0:48 - 1:01] Scene 5: Bé Học Số (Thẻ Số 3D, Bé Tập Đếm & Tách - Gộp)");
  const s5Start = Date.now();

  // Click Học Số tab in sidebar
  const numbersTab = page.locator("aside button:has-text(\"Học Số\")").first();
  await smoothClickLocator(numbersTab, 1400);

  // Lật Thẻ Học Số 3D
  const numFlip = page.locator("button:has-text(\"Lật Thẻ\")").first();
  await smoothClickLocator(numFlip, 1600);

  // Click Bé Tập Đếm
  const countingBtn = page.locator("aside button:has-text(\"Bé Tập Đếm\")").first();
  await smoothClickLocator(countingBtn, 1600);

  // Click 3 counting interactive cards
  const countItems = page.locator("button:has([alt*=\"đếm\"]), div.cursor-pointer, button.rounded-2xl").filter({ hasText: /[1-9]/ });
  const countCount = await countItems.count();
  for (let i = 0; i < Math.min(3, countCount); i++) {
    await smoothClickLocator(countItems.nth(i), 900);
  }

  // Click Tách - Gộp Số
  const bondsBtn = page.locator("aside button:has-text(\"Tách - Gộp Số\")").first();
  await smoothClickLocator(bondsBtn, 1600);

  // Quick scroll to reveal CPA Ten Frame
  await smoothScroll(200, 10, 25);
  await page.waitForTimeout(1000);
  await smoothScroll(-200, 10, 20);

  await waitSceneTime(s5Start, 13.0);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 6 [1:01 - 1:21 = 20.0s] AI Chấm Bài Viết ⭐: Nhận diện ô ly & Nét mẫu chuẩn
  // Lời đọc: "Điểm nhấn của dự án là module AI chấm bài viết vở ô ly, hỗ trợ thầy cô và phụ huynh theo dõi quá trình luyện chữ của bé..."
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("▶ [1:01 - 1:21] Scene 6: AI Chấm Bài Viết ⭐: Dò Tìm Dòng Kẻ & Nét Mẫu Chuẩn");
  const s6Start = Date.now();

  // Switch back to Học Chữ
  const lettersTab = page.locator("aside button:has-text(\"Học Chữ\")").first();
  await smoothClickLocator(lettersTab, 900);

  // Click AI Chấm Bài Viết
  const aiBtn = page.locator("aside button:has-text(\"AI Chấm Bài Viết ⭐\")").first();
  await smoothClickLocator(aiBtn, 1500);

  // Click Preset Bài 12-13
  const preset1 = page.locator("button:has-text(\"Bài 12-13\")").first();
  await smoothClickLocator(preset1, 1800);

  // Move cursor smoothly over bounding box "kì cọ" on the document canvas
  const boxKiCo = page.locator("[data-box-element=\"true\"]").first();
  const bBox = await boxKiCo.boundingBox({ timeout: 2000 }).catch(() => null);
  if (bBox) {
    await smoothMove(bBox.x + bBox.width / 2, bBox.y + bBox.height / 2, 700);
    await page.waitForTimeout(2000);
  }

  // Glide cursor across other boxes "lá hẹ", "hồ cá"
  const allBoxes = page.locator("[data-box-element=\"true\"]");
  const boxCount = await allBoxes.count();
  if (boxCount >= 2) {
    const box2 = await allBoxes.nth(1).boundingBox().catch(() => null);
    if (box2) {
      await smoothMove(box2.x + box2.width / 2, box2.y + box2.height / 2, 800);
      await page.waitForTimeout(1500);
    }
  }

  // Click back to first box "kì cọ"
  if (bBox) {
    await smoothMove(bBox.x + bBox.width / 2, bBox.y + bBox.height / 2, 600);
    await page.mouse.down();
    await page.waitForTimeout(80);
    await page.mouse.up();
  }

  await waitSceneTime(s6Start, 20.0);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 7 [1:21 - 1:35 = 14.0s] Kính Lúp Soi Nét, Blink Comparator & Độ Khớp
  // Lời đọc: "Nhờ chức năng phóng to và khoanh vùng, người hướng dẫn có thể quan sát rõ hơn những vị trí con cần luyện tập..."
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("▶ [1:21 - 1:35] Scene 7: Kính Lúp Soi Nét, Blink Comparator & Độ Khớp");
  const s7Start = Date.now();

  // Move to right-hand Magnifier view
  const magnifier = page.locator("div:has-text(\"Kính Lúp Soi Nét\")").first();
  const magBox = await magnifier.boundingBox({ timeout: 2000 }).catch(() => null);
  if (magBox) {
    await smoothMove(magBox.x + magBox.width / 2, magBox.y + 110, 600);
    await page.waitForTimeout(1400);
  }

  // Click "Chớp" button (Blink comparator) for 3.0s
  const blinkBtn = page.locator("button:has-text(\"Chớp\")").first();
  if (await blinkBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await smoothClickLocator(blinkBtn, 3000);
    await smoothClickLocator(blinkBtn, 600);
  }

  // Drag "Độ mờ nét đỏ" slider smoothly
  const opacitySlider = page.locator("input[type=\"range\"]").first();
  if (await opacitySlider.isVisible({ timeout: 1500 }).catch(() => false)) {
    const sBox = await opacitySlider.boundingBox({ timeout: 1500 }).catch(() => null);
    if (sBox) {
      await smoothMove(sBox.x + sBox.width * 0.65, sBox.y + sBox.height / 2, 400);
      await page.mouse.down();
      await page.mouse.move(sBox.x + sBox.width * 0.95, sBox.y + sBox.height / 2, { steps: 12 });
      await page.waitForTimeout(500);
      await page.mouse.move(sBox.x + sBox.width * 0.45, sBox.y + sBox.height / 2, { steps: 12 });
      await page.waitForTimeout(500);
      await page.mouse.move(sBox.x + sBox.width * 0.70, sBox.y + sBox.height / 2, { steps: 10 });
      await page.mouse.up();
    }
  }

  await waitSceneTime(s7Start, 14.0);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 8 [1:35 - 1:44 = 9.0s] Tùy Biến Mẫu Chữ & Hướng Dẫn Sửa Nét Sư Phạm
  // Lời đọc: "Giáo viên cũng có thể điều chỉnh mẫu chữ và xem xét kết quả cho phù hợp với từng bé."
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("▶ [1:35 - 1:44] Scene 8: Tùy Biến Mẫu Chữ & Hướng Dẫn Sửa Nét");
  const s8Start = Date.now();

  // Click "Căn nét" to reveal D-pad navigation
  const adjustBtn = page.locator("button:has-text(\"Căn nét\")").first();
  await smoothClickLocator(adjustBtn, 1200);

  // Click "lá hẹ" in inspected letters history list
  const laHeItem = page.locator("text=「lá hẹ」").first();
  await smoothClickLocator(laHeItem, 1600);

  // Click audio button on teacher correction guidance
  const speakTipBtn = page.locator("button[title=\"Nghe hướng dẫn sửa nét\"]").first();
  await smoothClickLocator(speakTipBtn, 2200);

  // Click "hồ cá" in history list
  const hoCaItem = page.locator("text=「hồ cá」").first();
  await smoothClickLocator(hoCaItem, 1800);

  await waitSceneTime(s8Start, 9.0);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 9 [1:44 - 1:53 = 9.0s] Cẩm Nang Phụ Huynh (Tư thế ngồi & Cách cầm bút)
  // Lời đọc: "Nền tảng sử dụng trên máy tính, máy tính bảng và điện thoại, giúp việc học tiếp nối giữa lớp học và gia đình..."
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("▶ [1:44 - 1:53] Scene 9: Cẩm Nang Phụ Huynh (Tư Thế Ngồi & Cầm Bút)");
  const s9Start = Date.now();

  // Click Học Số -> Góc Ba Mẹ
  await smoothClickLocator(numbersTab, 700);
  const parentBtn = page.locator("aside button:has-text(\"Góc Ba Mẹ\")").first();
  await smoothClickLocator(parentBtn, 1500);

  // Smooth scroll through posture & pen-holding guidelines
  await smoothScroll(420, 18, 30);
  await page.waitForTimeout(2000);
  await smoothScroll(380, 18, 30);
  await page.waitForTimeout(2000);
  await smoothScroll(-800, 20, 25);

  await waitSceneTime(s9Start, 9.0);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE 10 [1:53 - 2:01.73 = 8.73s] Outro & Call to Action (bevuihocchuvaso.site)
  // Lời đọc: "Bé Vui Học Chữ và Số cùng con làm quen từng con chữ, khám phá từng con số... Hãy cùng trải nghiệm ngay hôm nay!"
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("▶ [1:53 - 2:01.73] Scene 10: Outro & Call to Action (bevuihocchuvaso.site)");
  const s10Start = Date.now();

  // Return to Học Chữ -> Thẻ Chữ Cái 3D
  await smoothClickLocator(lettersTab, 700);
  const flashcardBtn = page.locator("aside button:has-text(\"Thẻ Chữ Cái 3D\")").first();
  await smoothClickLocator(flashcardBtn, 1200);

  // Move mouse smoothly to the brand header with domain badge bevuihocchuvaso.site
  await smoothMove(138, 78, 800);
  await page.waitForTimeout(1500);

  // Gentle circular hover around the domain badge
  for (let a = 0; a <= Math.PI * 2; a += 0.3) {
    const cx = Math.round(138 + 20 * Math.cos(a));
    const cy = Math.round(78 + 10 * Math.sin(a));
    await page.mouse.move(cx, cy, { steps: 2 });
    await page.waitForTimeout(25);
  }

  await waitSceneTime(s10Start, 8.73);

  const totalElapsed = (Date.now() - tourStartTime) / 1000;
  console.log(`🏁 Hoàn tất toàn bộ kịch bản! Tổng thời gian ghi hình: ${totalElapsed.toFixed(2)}s (Mục tiêu: 121.73s)`);
  console.log("Đang đóng browser context để lưu trữ file video Playwright...");

  await context.close();
  await browser.close();

  // Find recorded webm file
  const webmFiles = fs.readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".webm"));
  if (webmFiles.length === 0) {
    throw new Error("Không tìm thấy file video webm do Playwright ghi lại!");
  }
  const rawWebmPath = path.join(VIDEO_DIR, webmFiles[0]);
  console.log(`✓ Đã ghi nhận video gốc từ Playwright: ${rawWebmPath}`);

  // Mux with the authentic ThuAm.mp3 using ffmpeg
  console.log(`🎬 Ghép âm thanh gốc ${AUDIO_PATH} và mã hóa MP4 1080p 60fps...`);
  const ffmpegCmd = `/opt/homebrew/bin/ffmpeg -y -i "${rawWebmPath}" -i "${AUDIO_PATH}" -filter_complex "[0:v]fps=60,format=yuv420p[v]" -map "[v]" -map 1:a -c:v libx264 -preset medium -crf 17 -c:a aac -b:a 192k -shortest "${FINAL_OUTPUT}"`;

  execSync(ffmpegCmd, { stdio: "inherit" });

  console.log(`\n🎉 HOÀN TẤT 100%! VIDEO SHOWCASE CHÍNH THỨC ĐÃ XUẤT TẠI:\n${FINAL_OUTPUT}`);
}

run().catch((err) => {
  console.error("❌ Lỗi khi quay video showcase:", err);
  process.exit(1);
});
