/**
 * Selector Test Script for LLM Rally
 * Run with: node test-selectors.mjs --site chatgpt|claude|grok|gemini
 * Requires Chrome to be running with --cdp flag
 */
import { chromium } from "playwright";
import fs from "node:fs";

const CONFIG = JSON.parse(fs.readFileSync("sites.json", "utf-8"));

function argValue(flag, def = null) {
    const i = process.argv.indexOf(flag);
    return i === -1 ? def : process.argv[i + 1] ?? def;
}

const SITE_KEY = argValue("--site", "chatgpt");
const CDP_URL = argValue("--cdp", "http://127.0.0.1:9222");

async function testSelectors() {
    console.log(`=== Selector Test for ${SITE_KEY} ===\n`);

    const site = CONFIG[SITE_KEY];
    if (!site) {
        console.error(`Site "${SITE_KEY}" not found in sites.json`);
        process.exit(1);
    }

    console.log(`Connecting to CDP at ${CDP_URL}...`);
    let browser, ctx;
    try {
        browser = await chromium.connectOverCDP(CDP_URL);
        ctx = browser.contexts()[0];
        console.log("  Connected.\n");
    } catch (e) {
        console.error(`Failed to connect: ${e.message}`);
        process.exit(1);
    }

    // Find the page for this site
    const pages = ctx.pages();
    let page = null;
    for (const p of pages) {
        if (p.url().includes(site.url.replace("https://", "").replace("/", ""))) {
            page = p;
            break;
        }
    }

    if (!page) {
        console.error(`No tab found for ${site.name} (${site.url})`);
        console.log("Open tabs:", pages.map(p => p.url()).join("\n"));
        process.exit(1);
    }

    console.log(`Found page: ${page.url()}\n`);
    await page.bringToFront();

    const { input, sendButton, lastMessage, stopButton } = site.selectors;
    const results = [];

    // Test input selector
    console.log("--- Testing INPUT selector ---");
    console.log(`Selector: ${input}`);
    try {
        const inputLoc = page.locator(input).first();
        const count = await page.locator(input).count();
        const visible = await inputLoc.isVisible();
        const enabled = await inputLoc.isEnabled();
        console.log(`  Count: ${count}, Visible: ${visible}, Enabled: ${enabled}`);
        results.push({ name: "input", ok: visible && enabled, count });
    } catch (e) {
        console.log(`  ERROR: ${e.message}`);
        results.push({ name: "input", ok: false, error: e.message });
    }

    // Test sendButton selector (if exists)
    if (sendButton) {
        console.log("\n--- Testing SEND BUTTON selector ---");
        console.log(`Selector: ${sendButton}`);
        try {
            const count = await page.locator(sendButton).count();
            const loc = page.locator(sendButton).first();
            const visible = count > 0 ? await loc.isVisible() : false;
            console.log(`  Count: ${count}, Visible: ${visible}`);
            results.push({ name: "sendButton", ok: count > 0, count });
        } catch (e) {
            console.log(`  ERROR: ${e.message}`);
            results.push({ name: "sendButton", ok: false, error: e.message });
        }
    }

    // Test lastMessage selector
    console.log("\n--- Testing LAST MESSAGE selector ---");
    console.log(`Selector: ${lastMessage}`);
    try {
        const count = await page.locator(lastMessage).count();
        console.log(`  Count: ${count}`);
        if (count > 0) {
            const lastLoc = page.locator(lastMessage).last();
            const text = await lastLoc.innerText({ timeout: 3000 });
            console.log(`  Last message text (first 100 chars): ${text.substring(0, 100).replace(/\n/g, " ")}...`);
            results.push({ name: "lastMessage", ok: true, count });
        } else {
            console.log(`  No messages found. This is OK if conversation is empty.`);
            results.push({ name: "lastMessage", ok: true, count: 0, note: "empty" });
        }
    } catch (e) {
        console.log(`  ERROR: ${e.message}`);
        results.push({ name: "lastMessage", ok: false, error: e.message });
    }

    // Test stopButton selector
    if (stopButton) {
        console.log("\n--- Testing STOP BUTTON selector ---");
        console.log(`Selector: ${stopButton}`);
        try {
            const count = await page.locator(stopButton).count();
            console.log(`  Count: ${count} (0 is OK if not generating)`);
            results.push({ name: "stopButton", ok: true, count });
        } catch (e) {
            console.log(`  ERROR: ${e.message}`);
            results.push({ name: "stopButton", ok: false, error: e.message });
        }
    }

    // Try alternative selectors for debugging
    console.log("\n--- Exploring DOM for message containers ---");
    const exploratorySelectors = [
        "[data-message-author-role]",
        "[data-is-streaming]",
        ".font-claude-message",
        ".prose",
        "[role='article']",
        ".message",
        ".response",
        "[class*='message']",
        "[class*='response']",
        "[class*='assistant']",
    ];

    for (const sel of exploratorySelectors) {
        try {
            const count = await page.locator(sel).count();
            if (count > 0) {
                console.log(`  ${sel}: ${count} elements`);
            }
        } catch { }
    }

    // Summary
    console.log("\n=== SUMMARY ===");
    const failed = results.filter(r => !r.ok);
    if (failed.length === 0) {
        console.log("All selectors passed!");
    } else {
        console.log("Failed selectors:");
        failed.forEach(r => console.log(`  - ${r.name}: ${r.error || "not found"}`));
    }

    // Don't close browser in CDP mode
    console.log("\nTest complete. Browser session remains open.");
}

testSelectors().catch(console.error);
