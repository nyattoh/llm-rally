import { chromium, firefox, webkit } from "playwright";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function argValue(flag, def = null) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return def;
  return process.argv[i + 1] ?? def;
}
function hasFlag(flag) {
  return process.argv.includes(flag);
}

const CONFIG = JSON.parse(fs.readFileSync("sites.json", "utf-8"));
const USER_DATA_DIR = "./pw-profile";

const A_KEY = argValue("--a", "chatgpt");
const B_KEY = argValue("--b", "grok");
const FIRST = argValue("--first", "chatgpt"); // default: ChatGPT first
const ROUNDS = Number(argValue("--rounds", "5")); // round trips
const OUT_FILE = argValue("--out", "log.json");
const SEED_FILE = argValue("--seed-file", "seed.txt");
const LOGIN_ONLY = hasFlag("--login-only");
const BROWSER = argValue("--browser", "chromium");
const CHANNEL = argValue("--channel", null);
const CDP_URL = argValue("--cdp", null);
const DEFAULT_BROWSER = hasFlag("--default-browser") || BROWSER === "default";

function getSite(key) {
  const site = CONFIG[key];
  if (!site) throw new Error(`sites.json missing key: ${key}`);
  return site;
}

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function safeExec(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
      .toString("utf-8")
      .trim();
  } catch {
    return "";
  }
}

function detectDefaultBrowser() {
  if (process.platform === "win32") {
    const out = safeExec(
      'reg query "HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice" /v ProgId'
    );
    const match = out.match(/ProgId\\s+REG_SZ\\s+(.+)/i);
    const progId = match?.[1]?.trim() ?? "";
    if (/ChromeHTML/i.test(progId)) return { name: "chromium", channel: "chrome", source: progId };
    if (/MSEdgeHTM/i.test(progId)) return { name: "chromium", channel: "msedge", source: progId };
    if (/FirefoxURL/i.test(progId)) return { name: "firefox", channel: null, source: progId };
    if (progId) return { name: "chromium", channel: null, source: progId };
  }

  if (process.platform === "linux") {
    const out = safeExec("xdg-settings get default-web-browser");
    const lower = out.toLowerCase();
    if (lower.includes("firefox")) return { name: "firefox", channel: null, source: out };
    if (lower.includes("edge")) return { name: "chromium", channel: "msedge", source: out };
    if (lower.includes("chrome") || lower.includes("chromium") || lower.includes("brave")) {
      return { name: "chromium", channel: "chrome", source: out };
    }
  }

  return { name: "chromium", channel: null, source: "fallback" };
}

function resolveBrowserConfig() {
  const cdpEndpoint = hasFlag("--cdp")
    ? (CDP_URL || "http://localhost:9222")
    : null;
  if (cdpEndpoint) {
    return { mode: "cdp", cdpEndpoint };
  }

  let browserName = BROWSER;
  let channel = CHANNEL;
  if (DEFAULT_BROWSER) {
    const detected = detectDefaultBrowser();
    browserName = detected.name;
    if (!channel) channel = detected.channel;
    if (detected.source && detected.source !== "fallback") {
      console.log(`Default browser detected: ${detected.source}`);
    }
  }

  let browserType;
  if (browserName === "chromium") browserType = chromium;
  else if (browserName === "firefox") browserType = firefox;
  else if (browserName === "webkit") browserType = webkit;
  else {
    throw new Error(`Unsupported --browser: ${browserName}`);
  }

  if (channel && browserName !== "chromium") {
    console.warn(`--channel ignored for ${browserName}`);
    channel = null;
  }

  return { mode: "launch", browserType, channel, browserName };
}

function stripTrailingNth(selector) {
  if (!selector) return { base: selector, hadNth: false };
  const base = selector.replace(/\s*>>\s*nth=-?\d+\s*$/i, "");
  return { base: base || selector, hadNth: base !== selector };
}

async function waitForTextChange(locator, prevText, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const cur = (await locator.innerText()).trim();
      if (cur && cur !== prevText) return;
    } catch { }
    await sleep(500);
  }
  throw new Error("Timed out waiting for response to start.");
}

async function waitForStableText(locator, timeoutMs, stableMs = 4000) {
  const start = Date.now();
  let prev = "";
  let stable = 0;
  while (Date.now() - start < timeoutMs) {
    let cur = "";
    try {
      cur = (await locator.innerText()).trim();
    } catch {
      await sleep(500);
      continue;
    }
    if (cur) {
      if (cur === prev) stable += 500;
      else stable = 0;
      prev = cur;
      if (stable >= stableMs) return;
    }
    await sleep(500);
  }
  throw new Error("Timed out waiting for response to stabilize.");
}

async function waitForResponseLocator(messagesLoc, beforeCount, beforeText, timeoutMs) {
  if (beforeCount === 0) {
    const firstLoc = messagesLoc.first();
    await firstLoc.waitFor({ state: "visible", timeout: timeoutMs });
    return firstLoc;
  }

  const lastLoc = messagesLoc.nth(beforeCount - 1);
  const newLoc = messagesLoc.nth(beforeCount);
  const waitNew = newLoc.waitFor({ state: "visible", timeout: timeoutMs }).then(() => newLoc);
  const waitChange = waitForTextChange(lastLoc, beforeText, timeoutMs).then(() => lastLoc);

  try {
    return await Promise.any([waitNew, waitChange]);
  } catch {
    throw new Error("Timed out waiting for response element.");
  }
}

async function askAndGet(page, site, text) {
  const { input, sendButton, lastMessage, stopButton } = site.selectors;

  if (!input || !lastMessage) {
    throw new Error(`Missing selectors for site: ${site.name ?? "unknown"}`);
  }

  await page.bringToFront();
  await page.waitForLoadState("domcontentloaded");

  const inputLoc = page.locator(input).first();
  await inputLoc.waitFor({ state: "visible", timeout: 60000 });
  await inputLoc.click();
  await inputLoc.fill(text);

  const { base: messageSelector } = stripTrailingNth(lastMessage);
  const messagesLoc = page.locator(messageSelector);
  const beforeCount = await messagesLoc.count();
  const beforeText = beforeCount > 0
    ? (await messagesLoc.nth(beforeCount - 1).innerText()).trim()
    : "";

  if (sendButton) {
    const sendLoc = page.locator(sendButton).first();
    await sendLoc.waitFor({ state: "visible", timeout: 60000 });
    await sendLoc.click();
  } else {
    await inputLoc.press("Enter");
  }

  const responseLoc = await waitForResponseLocator(
    messagesLoc,
    beforeCount,
    beforeText,
    120000
  );

  if (stopButton) {
    const stopLoc = page.locator(stopButton).first();
    try {
      await stopLoc.waitFor({ state: "visible", timeout: 15000 });
      await stopLoc.waitFor({ state: "detached", timeout: 180000 });
    } catch { }
  }

  await waitForStableText(responseLoc, 180000);
  return (await responseLoc.innerText()).trim();
}

async function main() {
  const siteA = getSite(A_KEY);
  const siteB = getSite(B_KEY);

  const browserConfig = resolveBrowserConfig();
  const viewport = { width: 1400, height: 900 };
  let ctx;
  if (browserConfig.mode === "cdp") {
    const browser = await chromium.connectOverCDP(browserConfig.cdpEndpoint);
    ctx = browser.contexts()[0];
    if (!ctx) {
      ctx = await browser.newContext({ viewport });
    }
  } else {
    ctx = await browserConfig.browserType.launchPersistentContext(USER_DATA_DIR, {
      headless: false,
      viewport,
      channel: browserConfig.channel || undefined
    });
  }

  const pageA = await ctx.newPage();
  const pageB = await ctx.newPage();
  await pageA.setViewportSize(viewport);
  await pageB.setViewportSize(viewport);

  await pageA.goto(siteA.url, { waitUntil: "domcontentloaded" });
  await pageB.goto(siteB.url, { waitUntil: "domcontentloaded" });

  if (LOGIN_ONLY) {
    console.log("Login-only mode. Please login manually and close the browser.");
    await new Promise(r => ctx.on("close", r));
    return;
  }

  if (!Number.isFinite(ROUNDS) || ROUNDS < 1) {
    throw new Error("--rounds must be a positive number.");
  }

  const seedPath = path.resolve(SEED_FILE);
  const seed = fs.existsSync(seedPath) ? fs.readFileSync(seedPath, "utf-8").trim() : "";
  if (!seed) throw new Error(`Seed text missing: ${SEED_FILE}`);

  let turnKey = FIRST;
  if (![A_KEY, B_KEY].includes(turnKey)) {
    throw new Error(`--first must be one of --a or --b`);
  }

  const log = [];
  const outPath = path.resolve(OUT_FILE);
  const writeLogSafe = () => {
    try {
      fs.writeFileSync(outPath, JSON.stringify(log, null, 2), "utf-8");
    } catch (err) {
      console.warn("Failed to write log:", err?.message ?? err);
    }
  };

  const onInterrupt = () => {
    console.log("Interrupted. Saving log...");
    writeLogSafe();
    process.exit(130);
  };
  process.on("SIGINT", onInterrupt);
  process.on("SIGTERM", onInterrupt);

  log.push({ ts: nowIso(), type: "meta", a: A_KEY, b: B_KEY, first: FIRST, rounds: ROUNDS });
  writeLogSafe();
  log.push({ ts: nowIso(), type: "seed", text: seed });
  writeLogSafe();

  let current = seed;

  for (let r = 1; r <= ROUNDS; r++) {
    const firstKey = turnKey;
    const secondKey = (firstKey === A_KEY) ? B_KEY : A_KEY;

    {
      const site = getSite(firstKey);
      const page = (firstKey === A_KEY) ? pageA : pageB;
      const out = await askAndGet(page, site, current);
      log.push({ ts: nowIso(), type: "turn", round: r, who: firstKey, input: current, output: out });
      writeLogSafe();
      current = out;
    }

    {
      const site = getSite(secondKey);
      const page = (secondKey === A_KEY) ? pageA : pageB;
      const out = await askAndGet(page, site, current);
      log.push({ ts: nowIso(), type: "turn", round: r, who: secondKey, input: current, output: out });
      writeLogSafe();
      current = out;
    }
  }

  writeLogSafe();
  console.log(`Saved to ${OUT_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
