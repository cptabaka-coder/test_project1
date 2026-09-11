#!/usr/bin/env node
// Headless-Chromium REPL for visually driving Bunny Survivor, in the spirit of
// the `chromium-cli` tool (not installed in this environment). Pipe newline
// commands to stdin; see SKILL.md for the command list and an example.
import { chromium } from "playwright";
import { createInterface } from "node:readline";
import { mkdirSync } from "node:fs";
import path from "node:path";

const outDir = process.env.VISUAL_CHECK_OUT_DIR ?? path.join(process.cwd(), ".visual-check");
mkdirSync(outDir, { recursive: true });

const errors = [];
const browser = await chromium.launch({
  // PixiJS needs WebGL; headless Chromium has no real GPU, so software-render it.
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

let shotIndex = 0;

async function run(line) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  if (!cmd) return;

  switch (cmd) {
    case "nav": {
      await page.goto(rest[0]);
      break;
    }
    case "wait-for": {
      const arg = rest.join(" ");
      if (arg.startsWith("text=")) {
        await page.getByText(arg.slice(5)).first().waitFor({ timeout: 10_000 });
      } else if (arg.startsWith("selector=")) {
        await page.waitForSelector(arg.slice(9), { timeout: 10_000 });
      } else {
        await page.waitForSelector(arg, { timeout: 10_000 });
      }
      break;
    }
    case "wait": {
      await page.waitForTimeout(Number(rest[0]));
      break;
    }
    case "screenshot": {
      shotIndex += 1;
      const name = rest[0] ?? String(shotIndex).padStart(2, "0");
      const file = path.join(outDir, `${name}.png`);
      await page.screenshot({ path: file });
      console.log(`screenshot: ${file}`);
      break;
    }
    case "press": {
      await page.keyboard.press(rest[0]);
      break;
    }
    case "hold": {
      // hold <KeyCode> <ms> — e.g. `hold KeyD 500` to move the bunny right for 500ms.
      const [code, ms] = rest;
      await page.keyboard.down(code);
      await page.waitForTimeout(Number(ms));
      await page.keyboard.up(code);
      break;
    }
    case "console-errors": {
      console.log("console/page errors:", JSON.stringify(errors));
      break;
    }
    default:
      console.error(`unknown command: ${cmd}`);
  }
}

const rl = createInterface({ input: process.stdin });
for await (const line of rl) {
  if (!line.trim() || line.trim().startsWith("#")) continue;
  try {
    await run(line);
  } catch (err) {
    console.error(`command failed: ${line}\n`, err);
    process.exitCode = 1;
  }
}

await browser.close();
