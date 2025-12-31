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

// Generate timestamp-based log filename
function generateLogFilename() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return path.join("logs", `${timestamp}.json`);
}

const OUT_FILE = argValue("--out", null) || generateLogFilename();
const LOGS_DIR = path.dirname(OUT_FILE);
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}
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

/**
 * Wait for a new message to appear (count increases)
 */
async function waitForNewMessage(page, selector, prevCount, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const count = await page.locator(selector).count();
    if (count > prevCount) {
      return true;
    }
    await sleep(300);
  }
  return false;
}

/**
 * Wait for text to become stable (no changes for 2 consecutive checks)
 */
async function waitForStableText(locator, timeoutMs) {
  const start = Date.now();
  let prev = "";
  let stableCount = 0;
  const STABLE_THRESHOLD = 2; // Need 2 consecutive identical reads
  const POLL_INTERVAL = 500; // Check every 500ms for faster response

  while (Date.now() - start < timeoutMs) {
    try {
      const cur = (await locator.innerText({ timeout: 1000 })).trim();
      if (cur && cur.length > 0) {
        if (cur === prev) {
          stableCount++;
          if (stableCount >= STABLE_THRESHOLD) {
            return cur;
          }
        } else {
          stableCount = 0;
          prev = cur;
        }
      }
    } catch { }
    await sleep(POLL_INTERVAL);
  }
  return prev; // Return whatever we have on timeout
}

/**
 * For Claude: wait for data-is-streaming to become "false"
 */
async function waitForStreamingComplete(page, selector, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const lastEl = page.locator(selector).last();
      const streaming = await lastEl.getAttribute("data-is-streaming", { timeout: 1000 });
      if (streaming === "false") {
        return true;
      }
    } catch { }
    await sleep(300);
  }
  return false;
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

async function askAndGet(page, site, text) {
  const { input, sendButton, lastMessage, stopButton } = site.selectors;
  console.log(`  [${site.name}] Waiting for input...`);
  const inputLoc = page.locator(input).first();

  // Wait for input to be ready
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
    await inputLoc.waitFor({ state: "visible", timeout: 120000 });
  }

  // Get current message count BEFORE sending
  const prevCount = await page.locator(lastMessage).count();
  console.log(`  Current message count: ${prevCount}`);

  // Type and send
  await inputLoc.click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.insertText(text);
  await sleep(500);

  console.log(`  Sending message...`);
  if (sendButton) {
    const btn = page.locator(sendButton).first();
    await btn.waitFor({ state: "visible", timeout: 120000 });
    await btn.click();
  } else {
    await inputLoc.press("Enter");
  }

  // Wait for new message or text change
  console.log(`  Waiting for response to appear...`);
  const newMessageAppeared = await waitForNewMessage(page, lastMessage, prevCount, 60000);

  if (!newMessageAppeared) {
    // Maybe count didn't change but text did - check last element
    const lastLoc = page.locator(lastMessage).last();
    const currentText = await lastLoc.innerText({ timeout: 3000 }).catch(() => "");
    if (!currentText) {
      throw new Error("No response appeared within timeout.");
    }
  }

  // Get the last message locator
  const lastLoc = page.locator(lastMessage).last();
  console.log(`  Response started. Waiting for completion...`);

  // Determine completion strategy based on site
  let finalText = "";

  if (site.name === "Claude") {
    // For Claude: watch data-is-streaming attribute
    const completed = await waitForStreamingComplete(page, lastMessage, 180000);
    if (!completed) {
      console.log(`  Warning: Streaming did not complete, using stable text fallback`);
    }
    await sleep(500); // Brief pause to ensure DOM is updated
    finalText = await lastLoc.innerText({ timeout: 5000 }).catch(() => "");
  } else if (stopButton) {
    // For ChatGPT/others: watch stop button
    const stopLoc = page.locator(stopButton).first();
    try {
      await stopLoc.waitFor({ state: "visible", timeout: 10000 });
      console.log(`  Stop button appeared, waiting for it to disappear...`);
      await stopLoc.waitFor({ state: "hidden", timeout: 180000 });
      await sleep(300);
    } catch {
      // Stop button might not appear for short responses
    }
    finalText = await waitForStableText(lastLoc, 30000);
  } else {
    // Fallback: wait for stable text
    finalText = await waitForStableText(lastLoc, 120000);
  }

  finalText = finalText.trim();

  if (!finalText) {
    throw new Error("Failed to extract response text.");
  }

  console.log(`  Got response (${finalText.length} chars)`);
  return finalText;
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
          const lockFile = path.join(USER_DATA_DIR, "SingletonLock");
          if (fs.existsSync(lockFile)) {
            try { fs.unlinkSync(lockFile); } catch (e) { }
          }
          ctx = await browserConfig.browserType.launchPersistentContext(USER_DATA_DIR, options);
          break;
        } catch (e) {
          if (e.message.includes("is already in use") || e.message.includes("closed")) {
            // Just report it, don't crash yet, let it retry
          }
          if (attempt === 3) throw e;
          console.warn(`  Launch attempt ${attempt} failed: ${e.message.split("\n")[0]}. Retrying...`);
          await sleep(5000);
        }
      }
    } catch (e) {
      console.error(`Launch failed: ${e.message}`);
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

  const seedContent = fs.readFileSync(path.resolve(SEED_FILE), "utf-8").trim();
  if (!seedContent) throw new Error("Seed text empty");

  let current = seedContent;
  let turnKey = FIRST;
  const log = [{ ts: nowIso(), type: "meta", a: A_KEY, b: B_KEY, first: FIRST, rounds: ROUNDS }, { ts: nowIso(), type: "seed", text: seedContent }];

  try {
    for (let r = 1; r <= ROUNDS; r++) {
      console.log(`\n--- Round ${r}/${ROUNDS} ---`);
      const turnOrder = [turnKey, (turnKey === A_KEY ? B_KEY : A_KEY)];

      for (let i = 0; i < turnOrder.length; i++) {
        const key = turnOrder[i];
        const site = getSite(key);
        const page = (key === A_KEY ? pageA : pageB);
        let inputToSubmit = current;

        if (r === 1) {
          if (i === 0) {
            inputToSubmit = `今から他のAIと対話してもらいます。後述の題材についてよく考えて意見をだしてください。初回出力後は、他のAIからの返信を貼っていくので、それに回答する形で議論を進めてください。\n\n議題: ${current}`;
          } else {
            inputToSubmit = `現在他のAIと後述の議題について話しています。回答を貼るので、それに答える形で議論を進めてください。\n\n議題: ${seedContent}\n\n相手の回答: ${current}`;
          }
        }

        console.log(`\n[${site.name}] Turn`);

        // Push initial log entry
        const turnLog = { ts: nowIso(), type: "turn", round: r, who: key, input: inputToSubmit, output: "(generating...)" };
        log.push(turnLog);
        fs.writeFileSync(OUT_FILE, JSON.stringify(log, null, 2));

        try {
          current = await askAndGet(page, site, inputToSubmit);
          turnLog.output = current; // Update output
        } catch (e) {
          turnLog.output = `(Error: ${e.message})`;
          turnLog.error = true;
          throw e; // Re-throw to handle screenshot/exit
        }

        // Update log with final result
        fs.writeFileSync(OUT_FILE, JSON.stringify(log, null, 2));
      }
    }
    console.log("\n=== Rally Complete ===");
  } catch (e) {
    console.error(`\nError: ${e.message}`);
    try {
      if (pageA) await pageA.screenshot({ path: "error_a.png" });
      if (pageB) await pageB.screenshot({ path: "error_b.png" });
      console.log("  Screenshots saved to error_a.png / error_b.png");
    } catch (ssErr) { }
    fs.writeFileSync(OUT_FILE, JSON.stringify(log, null, 2));
    process.exit(1);
  } finally {
    if (ctx && !CDP_URL) await ctx.close();
  }
}

main().catch(console.error);
