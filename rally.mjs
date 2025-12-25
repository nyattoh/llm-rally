import { chromium, firefox, webkit } from "playwright";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// --- CLI Arguments ---
function argValue(flag, def = null) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return def;
  return process.argv[i + 1] ?? def;
}
function hasFlag(flag) {
  return process.argv.includes(flag);
}

const CONFIG = JSON.parse(fs.readFileSync("sites.json", "utf-8"));
const USER_DATA_DIR = path.resolve("./pw-profile");

const A_KEY = argValue("--a", "chatgpt");
const B_KEY = argValue("--b", "grok");
const FIRST = argValue("--first", "chatgpt");
const ROUNDS = Number(argValue("--rounds", "5"));
const OUT_FILE = argValue("--out", "log.json");
const SEED_FILE = argValue("--seed-file", "seed.txt");
const LOGIN_ONLY = hasFlag("--login-only");
const BROWSER = argValue("--browser", "chromium");
const CHANNEL = argValue("--channel", "chrome");
const CDP_URL = argValue("--cdp", null);
const DEFAULT_BROWSER = hasFlag("--default-browser") || BROWSER === "default";

// --- Helpers ---
function getSite(key) {
  const site = CONFIG[key];
  if (!site) throw new Error(`sites.json missing key: ${key}`);
  return site;
}

function nowIso() { return new Date().toISOString(); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function safeExec(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString("utf-8").trim();
  } catch { return ""; }
}

function detectDefaultBrowser() {
  if (process.platform === "win32") {
    const out = safeExec('reg query "HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice" /v ProgId');
    const progId = out.match(/ProgId\s+REG_SZ\s+(.+)/i)?.[1]?.trim() ?? "";
    if (/ChromeHTML/i.test(progId)) return { name: "chromium", channel: "chrome" };
    if (/MSEdgeHTM/i.test(progId)) return { name: "chromium", channel: "msedge" };
    if (/FirefoxURL/i.test(progId)) return { name: "firefox", channel: null };
  }
  return { name: "chromium", channel: "chrome" };
}

function findRunningDebugPort() {
  if (process.platform !== "win32") return null;
  // Look for chrome.exe with --remote-debugging-port in its command line
  const cmd = 'Get-CimInstance Win32_Process -Filter "name = \'chrome.exe\'" | Where-Object { $_.CommandLine -like "*--remote-debugging-port=*" } | Select-Object -ExpandProperty CommandLine';
  const out = safeExec(`powershell -NoProfile -Command "${cmd}"`);
  const match = out.match(/--remote-debugging-port=(\d+)/);
  if (match) {
    const port = match[1];
    console.log(`  Found running Chrome with debug port: ${port}`);
    return `http://127.0.0.1:${port}`;
  }
  return null;
}

function resolveBrowserConfig() {
  if (CDP_URL) return { mode: "cdp", cdpEndpoint: CDP_URL.replace("localhost", "127.0.0.1") };
  const discoveredCdp = findRunningDebugPort();
  if (discoveredCdp) return { mode: "cdp", cdpEndpoint: discoveredCdp };

  let browserName = BROWSER;
  let channel = CHANNEL;
  if (DEFAULT_BROWSER) {
    const detected = detectDefaultBrowser();
    browserName = detected.name;
    channel = detected.channel;
    console.log(`Default browser detected: ${channel || browserName}`);
  }
  return { mode: "launch", browserType: (browserName === "firefox" ? firefox : browserName === "webkit" ? webkit : chromium), channel, browserName };
}

async function waitForTextChange(locator, prevText, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const cur = (await locator.innerText()).trim();
      if (cur && cur !== prevText) return;
    } catch { }
    await sleep(1000);
  }
}

async function waitForStableText(locator, timeoutMs) {
  const start = Date.now();
  let prev = "";
  let stable = 0;
  while (Date.now() - start < timeoutMs) {
    try {
      const cur = (await locator.innerText()).trim();
      if (cur && cur === prev && cur.length > 0) stable++;
      else { stable = 0; prev = cur; }
      if (stable >= 3) return;
    } catch { }
    await sleep(2000);
  }
}

async function findOrCreatePage(ctx, site) {
  const pages = ctx.pages();
  for (const page of pages) {
    const url = page.url();
    if (url.includes(site.url)) {
      console.log(`  Found existing tab for ${site.name}: ${url}`);
      await page.bringToFront();
      return page;
    }
  }
  const blankPage = pages.find(p => p.url() === "about:blank" || p.url().startsWith("chrome://"));
  const page = blankPage || await ctx.newPage();
  console.log(`  Opening ${site.name}: ${site.url}`);
  await page.goto(site.url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.bringToFront();
  return page;
}

// --- Main Logic ---
async function askAndGet(page, site, text) {
  const { input, sendButton, lastMessage, stopButton } = site.selectors;
  console.log(`  [${site.name}] Waiting for input: ${input}`);
  const inputLoc = page.locator(input).first();

  let ready = false;
  for (let i = 0; i < 10; i++) {
    try {
      if (await inputLoc.isVisible() && await inputLoc.isEnabled()) {
        ready = true;
        break;
      }
    } catch { }
    await sleep(2000);
  }
  if (!ready) {
    console.log(`  Refreshing ${site.name} as input was not found...`);
    await page.reload({ waitUntil: "domcontentloaded" });
    await inputLoc.waitFor({ state: "visible", timeout: 60000 });
  }

  await inputLoc.click();
  try {
    // Try fill first, if it's a contenteditable it might need focus or different approach
    await inputLoc.fill("");
    await inputLoc.fill(text);
  } catch (e) {
    console.warn("  Fill failed, trying sequentially...");
    await inputLoc.pressSequentially(text, { delay: 10 });
  }
  await sleep(500);

  const lastLoc = page.locator(lastMessage).last();
  let prevText = "";
  try { prevText = (await lastLoc.innerText()).trim(); } catch { }

  console.log(`  Sending message...`);
  if (sendButton) await page.locator(sendButton).first().click();
  else await inputLoc.press("Enter");

  console.log(`  Waiting for response to start...`);
  await waitForTextChange(lastLoc, prevText, 60000);

  console.log(`  Waiting for generation to finish...`);
  if (stopButton) {
    const stopLoc = page.locator(stopButton).first();
    try {
      await stopLoc.waitFor({ state: "visible", timeout: 15000 });
      await stopLoc.waitFor({ state: "hidden", timeout: 180000 });
    } catch {
      await waitForStableText(lastLoc, 120000);
    }
  } else {
    await waitForStableText(lastLoc, 180000);
  }
  return (await lastLoc.innerText()).trim();
}

async function main() {
  console.log("=== LLM Rally Starting ===");
  const browserConfig = resolveBrowserConfig();
  let ctx;

  if (browserConfig.mode === "cdp") {
    console.log(`Connecting via CDP to ${browserConfig.cdpEndpoint}...`);
    try {
      const browser = await chromium.connectOverCDP(browserConfig.cdpEndpoint);
      ctx = (browser.contexts())[0] || await browser.newContext();
      console.log("  Linked to existing session.");
    } catch (e) {
      console.error(`  CDP Connection failed: ${e.message}`);
      process.exit(1);
    }
  } else {
    console.log(`Launching ${browserConfig.browserName} (channel: ${browserConfig.channel}) with profile...`);
    const options = {
      headless: false,
      viewport: { width: 1400, height: 900 },
      ignoreDefaultArgs: ["--enable-automation"],
      args: ["--disable-blink-features=AutomationControlled"]
    };
    if (browserConfig.channel && browserConfig.browserName === "chromium") options.channel = browserConfig.channel;

    try {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          ctx = await browserConfig.browserType.launchPersistentContext(USER_DATA_DIR, options);
          break;
        } catch (e) {
          if (e.message.includes("is already in use")) throw e;
          if (attempt === 3) throw e;
          console.warn(`  Launch attempt ${attempt} failed: ${e.message}. Retrying...`);
          await sleep(2000);
        }
      }
    } catch (e) {
      if (e.message.includes("is already in use")) {
        console.error("\x1b[31mError: プロファイルが使用中です。既にブラウザが開いている場合は閉じるか、--cdp を使用してください。\x1b[0m");
      } else {
        console.error(`Launch failed: ${e.message}`);
      }
      process.exit(1);
    }
  }

  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = { runtime: {} };
  });

  const siteA = getSite(A_KEY);
  const siteB = getSite(B_KEY);
  console.log("Preparing tabs...");
  const pageA = await findOrCreatePage(ctx, siteA);
  const pageB = await findOrCreatePage(ctx, siteB);

  if (LOGIN_ONLY) {
    console.log("\n=== LOGIN ONLY MODE ===");
    console.log("Please login manually if needed, then close the browser to save.");
    await new Promise(r => ctx.on("close", r));
    return;
  }

  const seed = fs.readFileSync(path.resolve(SEED_FILE), "utf-8").trim();
  if (!seed) throw new Error("Seed text empty");

  let current = seed;
  let turnKey = FIRST;
  const log = [{ ts: nowIso(), type: "meta", a: A_KEY, b: B_KEY, first: FIRST, rounds: ROUNDS }, { ts: nowIso(), type: "seed", text: seed }];

  try {
    for (let r = 1; r <= ROUNDS; r++) {
      console.log(`\n--- Round ${r}/${ROUNDS} ---`);
      for (const key of [turnKey, (turnKey === A_KEY ? B_KEY : A_KEY)]) {
        const site = getSite(key);
        const page = (key === A_KEY ? pageA : pageB);
        console.log(`\n[${site.name}] Turn`);
        const out = await askAndGet(page, site, current);
        log.push({ ts: nowIso(), type: "turn", round: r, who: key, input: current, output: out });
        fs.writeFileSync(OUT_FILE, JSON.stringify(log, null, 2));
        current = out;
      }
    }
    console.log("\n=== Rally Complete ===");
  } catch (e) {
    console.error(`\nError: ${e.message}`);
    // Capture screenshot on error
    try {
      if (pageA) await pageA.screenshot({ path: "error_a.png" });
      if (pageB) await pageB.screenshot({ path: "error_b.png" });
      console.log("  Screenshots saved to error_a.png / error_b.png");
    } catch (ssErr) {
      console.warn("  Failed to capture error screenshot:", ssErr.message);
    }
    fs.writeFileSync(OUT_FILE, JSON.stringify(log, null, 2));
  } finally {
    if (ctx && !CDP_URL) await ctx.close();
  }
}

main().catch(console.error);
