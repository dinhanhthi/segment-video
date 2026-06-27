const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { chromium } = require("playwright");

const rootDir = join(__dirname, "..");
const contentScript = readFileSync(join(rootDir, "content.js"), "utf8");
const videoUrl =
  "https://vdownload-5.sb-cd.com/1/2/12053619-480p.mp4?secure=h72YBOaLeKg_4qZwdvDJ2A,1782601010&m=5&d=4&_tid=12053619";

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}\nExpected:\n${expected}\nActual:\n${actual}`);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 960, height: 640 } });

  try {
    await page.setContent(`
      <!doctype html>
      <html>
        <body>
          <main style="padding: 40px">
            <video id="demo-video" src="${videoUrl}" style="width: 640px; height: 360px"></video>
          </main>
        </body>
      </html>
    `);

    await page.evaluate(() => {
      const video = document.querySelector("#demo-video");
      let time = 0;
      Object.defineProperty(video, "currentTime", {
        configurable: true,
        get: () => time,
        set: (value) => {
          time = value;
        }
      });
    });

    await page.addScriptTag({ content: contentScript });

    const controls = page.locator(".svc-controls");
    const dragHandle = page.locator(".svc-drag-handle");
    const beforeDrag = await controls.boundingBox();
    const handleBox = await dragHandle.boundingBox();
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(beforeDrag.x - 180, beforeDrag.y - 120, { steps: 5 });
    await page.mouse.up();
    const afterDrag = await controls.boundingBox();

    if (afterDrag.x >= beforeDrag.x || afterDrag.y >= beforeDrag.y) {
      throw new Error(
        `Floating controls did not move after drag.\nBefore: ${JSON.stringify(beforeDrag)}\nAfter: ${JSON.stringify(afterDrag)}`
      );
    }

    await page.evaluate(() => {
      document.querySelector("#demo-video").currentTime = 868;
    });
    await page.locator('button[data-action="start"]').click();
    let panelText = await page.locator(".svc-panel").innerText();
    if (!panelText.includes("Start captured at 14:28.")) {
      throw new Error(`Start click did not capture after drag.\n${panelText}`);
    }

    await page.evaluate(() => {
      document.querySelector("#demo-video").currentTime = 425;
    });
    await page.locator('button[data-action="end"]').click();
    panelText = await page.locator(".svc-panel").innerText();
    if (!panelText.includes("1. 14:28-07:05")) {
      throw new Error(`End click did not add first segment after drag.\n${panelText}`);
    }

    await page.evaluate(() => {
      document.querySelector("#demo-video").currentTime = 485;
    });
    await page.locator('button[data-action="start"]').click();
    panelText = await page.locator(".svc-panel").innerText();
    if (!panelText.includes("Start: 08:05")) {
      throw new Error(`Second start click did not capture.\n${panelText}`);
    }

    await page.evaluate(() => {
      document.querySelector("#demo-video").currentTime = 654;
    });
    await page.locator('button[data-action="end"]').click();
    panelText = await page.locator(".svc-panel").innerText();
    if (!panelText.includes("2. 08:05-10:54")) {
      throw new Error(`Second end click did not add segment.\n${panelText}`);
    }

    const deleteButtons = page.locator('button[data-action="delete-segment"]');
    const deleteButtonCount = await deleteButtons.count();
    if (deleteButtonCount !== 2) {
      throw new Error(`Expected 2 delete buttons, found ${deleteButtonCount}.`);
    }

    await page.locator('button[aria-label="Delete segment 1"]').click();
    const listText = await page.locator(".svc-list").innerText();
    if (!listText.includes("1. 08:05-10:54") || listText.includes("14:28-07:05")) {
      throw new Error(`Delete button did not remove and renumber the first segment.\n${listText}`);
    }

    await page.locator('button[data-action="stop"]').click();

    const output = await page.locator(".svc-output").textContent();
    assertEqual(
      output,
      `VIDEO_URL="${videoUrl}"\n\nSEGMENTS=(\n  "08:05-10:54"\n)`,
      "Stop modal should render copyable SEGMENTS output."
    );

    panelText = await page.locator(".svc-panel").innerText();
    if (!panelText.includes("1. 08:05-10:54")) {
      throw new Error(`Stored segment panel did not show the remaining segment.\n${panelText}`);
    }
  } finally {
    await browser.close();
  }
})();
