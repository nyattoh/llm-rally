import { chromium } from "playwright";
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

function getSite(key) {
  const site = CONFIG[key];
  if (!site) throw new Error(`sites.json missing key: ${key}`);
  return site;
}

function nowIso() {
  return new Date().toISOString();
}

async function waitForStableText(locator, timeoutMs) {
  const start = Date.now();
  let prev = "";
  let stable = 0;
  while (Date.now() - start < timeoutMs) {
    const cur = (await locator.innerText()).trim();
    if (cur && cur === prev) stable += 1;
    else { stable = 0; prev = cur; }
    if (stable >= 3) return;
    await new Promise(r => setTimeout(r, 1000));
  }
}

async function askAndGet(page, site, text) {
  const { input, sendButton, lastMessage, stopButton } = site.selectors;

  const inputLoc = page.locator(input).first();
  await inputLoc.waitFor({ state: "visible", timeout: 60000 });
  await inputLoc.click();
  await inputLoc.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await inputLoc.type(text, { delay: 2 });

  if (sendButton) await page.locator(sendButton).click();
  else await inputLoc.press("Enter");

  const lastLoc = page.locator(lastMessage).first();
  await lastLoc.waitFor({ state: "visible", timeout: 120000 });

  if (stopButton) {
    const stopLoc = page.locator(stopButton);
    try {
      await stopLoc.waitFor({ state: "visible", timeout: 10000 });
      await stopLoc.waitFor({ state: "detached", timeout: 180000 });
    } catch { }
  } else {
    await waitForStableText(lastLoc, 180000);
  }

  return (await lastLoc.innerText()).trim();
}

async function main() {
  const siteA = getSite(A_KEY);
  const siteB = getSite(B_KEY);

  const ctx = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    viewport: { width: 1400, height: 900 }
  });

  const pages = ctx.pages();
  const pageA = pages.length > 0 ? pages[0] : await ctx.newPage();
  const pageB = await ctx.newPage();

  await pageA.goto(siteA.url, { waitUntil: "domcontentloaded" });
  await pageB.goto(siteB.url, { waitUntil: "domcontentloaded" });

  if (LOGIN_ONLY) {
    console.log("Login-only mode. Please login manually and close the browser.");
    await new Promise(r => ctx.on("close", r));
    return;
  }

  const seedPath = path.resolve(SEED_FILE);
  const seed = fs.existsSync(seedPath) ? fs.readFileSync(seedPath, "utf-8").trim() : "";
  if (!seed) throw new Error(`Seed text missing: ${SEED_FILE}`);

  let turnKey = FIRST;
  if (![A_KEY, B_KEY].includes(turnKey)) {
    throw new Error(`--first must be one of --a or --b`);
  }

  const log = [];
  log.push({ ts: nowIso(), type: "meta", a: A_KEY, b: B_KEY, first: FIRST, rounds: ROUNDS });
  log.push({ ts: nowIso(), type: "seed", text: seed });

  let current = seed;

  for (let r = 1; r <= ROUNDS; r++) {
    const firstKey = turnKey;
    const secondKey = (firstKey === A_KEY) ? B_KEY : A_KEY;

    {
      const site = getSite(firstKey);
      const page = (firstKey === A_KEY) ? pageA : pageB;
      const out = await askAndGet(page, site, current);
      log.push({ ts: nowIso(), type: "turn", round: r, who: firstKey, input: current, output: out });
      current = out;
    }

    {
      const site = getSite(secondKey);
      const page = (secondKey === A_KEY) ? pageA : pageB;
      const out = await askAndGet(page, site, current);
      log.push({ ts: nowIso(), type: "turn", round: r, who: secondKey, input: current, output: out });
      current = out;
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(log, null, 2), "utf-8");
  console.log(`Saved to ${OUT_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
