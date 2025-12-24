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
    try {
      const cur = (await locator.innerText()).trim();
      if (cur && cur === prev) {
        stable += 1;
      } else {
        stable = 0;
        prev = cur;
      }
      if (stable >= 3) {
        console.log("  Text stabilized.");
        return;
      }
    } catch (e) {
      // Element might not be ready yet
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.warn("  Warning: Text did not stabilize within timeout");
}

async function askAndGet(page, site, text) {
  const { input, sendButton, lastMessage, stopButton } = site.selectors;

  console.log(`  Waiting for input field: ${input}`);
  const inputLoc = page.locator(input).first();
  await inputLoc.waitFor({ state: "visible", timeout: 60000 });

  console.log("  Clicking input field...");
  await inputLoc.click();

  // Clear the input field and enter text
  console.log("  Clearing and entering text...");
  await inputLoc.fill("");
  await inputLoc.fill(text);

  // Small delay to ensure text is entered
  await page.waitForTimeout(500);

  console.log("  Sending message...");
  if (sendButton) {
    const sendLoc = page.locator(sendButton).first();
    await sendLoc.waitFor({ state: "visible", timeout: 10000 });
    await sendLoc.click();
  } else {
    await inputLoc.press("Enter");
  }

  console.log(`  Waiting for response: ${lastMessage}`);
  const lastLoc = page.locator(lastMessage).last();

  try {
    await lastLoc.waitFor({ state: "attached", timeout: 120000 });
  } catch (e) {
    console.error("  Error: Response message did not appear");
    throw new Error(`Response message not found: ${lastMessage}`);
  }

  console.log("  Waiting for generation to complete...");
  if (stopButton) {
    const stopLoc = page.locator(stopButton).first();
    try {
      // Wait for stop button to appear (generation started)
      await stopLoc.waitFor({ state: "visible", timeout: 10000 });
      console.log("  Generation started (stop button visible)");
      // Wait for stop button to disappear (generation finished)
      await stopLoc.waitFor({ state: "hidden", timeout: 180000 });
      console.log("  Generation completed (stop button hidden)");
    } catch (e) {
      console.warn("  Warning: Stop button detection failed, falling back to text stabilization");
      await waitForStableText(lastLoc, 180000);
    }
  } else {
    await waitForStableText(lastLoc, 180000);
  }

  // Wait a bit more to ensure the text is fully rendered
  await page.waitForTimeout(1000);

  const result = (await lastLoc.innerText()).trim();
  console.log(`  Response received (${result.length} chars)`);
  return result;
}

async function main() {
  console.log("=== LLM Rally Starting ===");
  console.log(`A: ${A_KEY}, B: ${B_KEY}`);
  console.log(`First: ${FIRST}, Rounds: ${ROUNDS}`);
  console.log(`Output: ${OUT_FILE}`);
  console.log();

  const siteA = getSite(A_KEY);
  const siteB = getSite(B_KEY);

  console.log("Launching browser...");
  const ctx = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    viewport: { width: 1400, height: 900 },
    channel: 'chrome' // Use system Chrome instead of Playwright's Chromium
  });

  const pages = ctx.pages();
  const pageA = pages.length > 0 ? pages[0] : await ctx.newPage();
  const pageB = await ctx.newPage();

  console.log(`Opening ${siteA.name} at ${siteA.url}...`);
  await pageA.goto(siteA.url, { waitUntil: "domcontentloaded", timeout: 60000 });

  console.log(`Opening ${siteB.name} at ${siteB.url}...`);
  await pageB.goto(siteB.url, { waitUntil: "domcontentloaded", timeout: 60000 });

  if (LOGIN_ONLY) {
    console.log();
    console.log("=== Login-only mode ===");
    console.log("Please login manually on both tabs and close the browser when done.");
    await new Promise(r => ctx.on("close", r));
    console.log("Browser closed. Session saved.");
    return;
  }

  const seedPath = path.resolve(SEED_FILE);
  if (!fs.existsSync(seedPath)) {
    throw new Error(`Seed file not found: ${SEED_FILE}`);
  }

  const seed = fs.readFileSync(seedPath, "utf-8").trim();
  if (!seed) {
    throw new Error(`Seed text is empty: ${SEED_FILE}`);
  }

  console.log(`Seed loaded: ${seed.substring(0, 50)}...`);
  console.log();

  let turnKey = FIRST;
  if (![A_KEY, B_KEY].includes(turnKey)) {
    throw new Error(`--first must be one of --a (${A_KEY}) or --b (${B_KEY})`);
  }

  const log = [];
  log.push({ ts: nowIso(), type: "meta", a: A_KEY, b: B_KEY, first: FIRST, rounds: ROUNDS });
  log.push({ ts: nowIso(), type: "seed", text: seed });

  let current = seed;

  try {
    for (let r = 1; r <= ROUNDS; r++) {
      console.log(`\n=== Round ${r}/${ROUNDS} ===`);

      const firstKey = turnKey;
      const secondKey = (firstKey === A_KEY) ? B_KEY : A_KEY;

      // First turn
      {
        const site = getSite(firstKey);
        const page = (firstKey === A_KEY) ? pageA : pageB;
        console.log(`\n[${site.name}] Turn 1/2`);
        console.log(`Input: ${current.substring(0, 100)}${current.length > 100 ? "..." : ""}`);
        const out = await askAndGet(page, site, current);
        log.push({ ts: nowIso(), type: "turn", round: r, who: firstKey, input: current, output: out });
        console.log(`Output: ${out.substring(0, 100)}${out.length > 100 ? "..." : ""}`);
        current = out;

        // Save log after each turn
        fs.writeFileSync(OUT_FILE, JSON.stringify(log, null, 2), "utf-8");
      }

      // Second turn
      {
        const site = getSite(secondKey);
        const page = (secondKey === A_KEY) ? pageA : pageB;
        console.log(`\n[${site.name}] Turn 2/2`);
        console.log(`Input: ${current.substring(0, 100)}${current.length > 100 ? "..." : ""}`);
        const out = await askAndGet(page, site, current);
        log.push({ ts: nowIso(), type: "turn", round: r, who: secondKey, input: current, output: out });
        console.log(`Output: ${out.substring(0, 100)}${out.length > 100 ? "..." : ""}`);
        current = out;

        // Save log after each turn
        fs.writeFileSync(OUT_FILE, JSON.stringify(log, null, 2), "utf-8");
      }
    }

    console.log(`\n=== Rally Complete ===`);
    console.log(`Total turns: ${ROUNDS * 2}`);
    console.log(`Log saved to: ${OUT_FILE}`);
  } catch (error) {
    console.error("\n=== Error occurred ===");
    console.error(error.message);
    // Save log even on error
    fs.writeFileSync(OUT_FILE, JSON.stringify(log, null, 2), "utf-8");
    console.log(`Partial log saved to: ${OUT_FILE}`);
    throw error;
  } finally {
    console.log("\nClosing browser...");
    await ctx.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
