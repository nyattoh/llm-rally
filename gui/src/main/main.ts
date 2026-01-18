import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { computeResumeState } from "../shared/log";

type RallyOptions = {
  rounds?: number;
  a?: string;
  b?: string;
  first?: string;
  seed?: string;
  mode?: string;
};

type ResumeOptions = {
  additionalRounds: number;
};

type StatusPayload = { code: number | null; signal: NodeJS.Signals | null };

declare const __dirname: string;

let mainWindow: BrowserWindow | null = null;
let rallyProcess: ChildProcessWithoutNullStreams | null = null;
let currentLogPath: string | null = null;

const llmRallyDir = path.resolve(__dirname, "../../../");
const preloadPath = path.join(__dirname, "preload.cjs");
const LOGS_DIR = path.join(llmRallyDir, "logs");
const DEFAULT_LLM_A = "chatgpt";
const DEFAULT_LLM_B = "grok";

const ensureLogDir = () => {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
};

const generateLogPath = () => {
  ensureLogDir();
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return path.join(LOGS_DIR, `${timestamp}.json`);
};

const sendLog = (message: string) => {
  if (!mainWindow) return;
  const payload = message.trim();
  if (!payload) return;
  mainWindow.webContents.send("rally-log", payload);
};

const sendStatus = (payload: StatusPayload) => {
  if (!mainWindow) return;
  mainWindow.webContents.send("rally-status", payload);
};

const getCurrentLog = () => {
  console.log("DEBUG: getCurrentLog path:", currentLogPath);
  if (!currentLogPath) {
    console.log("DEBUG: no current log path");
    return null;
  }
  if (!fs.existsSync(currentLogPath)) {
    console.log("DEBUG: log file missing");
    return null;
  }
  try {
    const raw = fs.readFileSync(currentLogPath, "utf-8");
    const parsed = JSON.parse(raw);
    console.log("DEBUG: parsed log entries:", Array.isArray(parsed) ? parsed.length : "not array");
    return parsed;
  } catch (error) {
    console.log("DEBUG: failed to read log file", (error as Error).message);
    return null;
  }
};

const getErrorImage = (filename: string) => {
  const filePath = path.join(llmRallyDir, filename);
  if (!fs.existsSync(filePath)) return null;
  const data = fs.readFileSync(filePath);
  const ext = path.extname(filename).substring(1);
  return `data:image/${ext};base64,${data.toString("base64")}`;
};

const buildRallyArgs = (
  options: RallyOptions = {},
  seedFile?: string,
  outFile?: string,
  resumeFrom?: string
) => {
  const rounds = options.rounds ?? 3;
  const a = options.a ?? DEFAULT_LLM_A;
  const b = options.b ?? DEFAULT_LLM_B;
  const first = options.first ?? a;
  const args = [
    "--cdp",
    "http://127.0.0.1:9222",
    "--rounds",
    String(rounds),
    "--a",
    a,
    "--b",
    b,
    "--first",
    first
  ];
  if (seedFile) args.push("--seed-file", seedFile);
  if (options.mode) args.push("--mode", options.mode);
  if (outFile) args.push("--out", outFile);
  if (resumeFrom) args.push("--resume-from", resumeFrom);
  return args;
};

const launchChromeProcess = () => {
  try {
    if (process.platform === "win32") {
      const scriptPath = path.join(llmRallyDir, "start_chrome.bat");
      spawn(scriptPath, { cwd: llmRallyDir, shell: true, windowsHide: true, detached: true });
    } else if (process.platform === "darwin") {
      spawn("open", ["-a", "Google Chrome", "--args", "--remote-debugging-port=9222"], {
        cwd: llmRallyDir,
        detached: true
      });
    } else {
      const linuxBrowsers = ["google-chrome-stable", "google-chrome", "chromium-browser", "chromium"];
      let launched = false;
      for (const browser of linuxBrowsers) {
        try {
          spawn(browser, ["--remote-debugging-port=9222"], { cwd: llmRallyDir, detached: true });
          launched = true;
          break;
        } catch {
          continue;
        }
      }
      if (!launched) {
        throw new Error("対応ブラウザが見つかりません");
      }
    }
    return { success: true, message: "Chrome 起動コマンドを送信しました" };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};

const checkCdpEndpoint = () =>
  new Promise<string>((resolve) => {
    const request = http.get("http://127.0.0.1:9222/json/version", (res) => {
      let payload = "";
      res.on("data", (chunk) => {
        payload += chunk;
      });
      res.on("end", () => resolve(payload));
    });

    request.on("error", () => resolve("CDP インスタンスに接続できません"));
    request.setTimeout(2000, () => {
      request.destroy();
      resolve("CDP 接続タイムアウト");
    });
  });

const handleStartRally = (options: RallyOptions = {}, outPathOverride?: string, resumeFrom?: string) => {
  if (rallyProcess) return { success: false, message: "既に Rally が実行中です" };

  const entrypoint = path.join(llmRallyDir, "rally.mjs");
  let seedFilePath: string | undefined;
  if (options.seed) {
    seedFilePath = path.join(llmRallyDir, "seed_temp.txt");
    fs.writeFileSync(seedFilePath, options.seed, "utf-8");
  }
  const outPath = outPathOverride ?? generateLogPath();
  currentLogPath = outPath;
  const args = buildRallyArgs(options, seedFilePath, outPath, resumeFrom);
  console.log("DEBUG: Starting Rally", { a: options.a, b: options.b, args });
  console.log("DEBUG: Rally options:", JSON.stringify(options));
  console.log("DEBUG: Rally args:", args);
  rallyProcess = spawn("node", [entrypoint, ...args], {
    cwd: llmRallyDir,
    env: process.env
  });

  rallyProcess.stdout.on("data", (chunk) => sendLog(chunk.toString()));
  rallyProcess.stderr.on("data", (chunk) => sendLog(chunk.toString()));
  rallyProcess.on("error", (err) => {
    sendLog(`Error: Failed to spawn process: ${err.message}`);
  });

  rallyProcess.on("exit", (code, signal) => {
    sendStatus({ code, signal });
    rallyProcess = null;
  });

  return { success: true, pid: rallyProcess.pid, message: "Rally を開始しました" };
};

const stopRally = () => {
  if (!rallyProcess) return { success: false, message: "Rally が実行されていません" };
  rallyProcess.kill();
  return { success: true, message: "Rally を停止しました" };
};

const resumeRally = (options: ResumeOptions & Partial<RallyOptions>) => {
  if (rallyProcess) return { success: false, message: "既に Rally が実行中です" };
  if (!currentLogPath || !fs.existsSync(currentLogPath)) {
    return { success: false, message: "ログファイルが見つかりません" };
  }

  try {
    const raw = fs.readFileSync(currentLogPath, "utf-8");
    const entries = JSON.parse(raw);
    const state = computeResumeState(entries);
    const updatedRounds = (state.meta.rounds || 0) + options.additionalRounds;
    const resumeOptions: RallyOptions = {
      rounds: updatedRounds,
      a: state.meta.a,
      b: state.meta.b,
      first: state.meta.first,
      seed: state.seed.text,
      mode: options.mode ?? state.meta.mode ?? undefined
    };
    return handleStartRally(resumeOptions, currentLogPath, currentLogPath);
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};

function createWindow() {
  console.log("DEBUG: __dirname:", __dirname);
  console.log("DEBUG: Preload path:", preloadPath);
  console.log("DEBUG: Preload exists:", fs.existsSync(preloadPath));
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || (!app.isPackaged ? "http://localhost:5173" : undefined);
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist/renderer/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle("launch-chrome", () => launchChromeProcess());
  ipcMain.handle("check-cdp", () => checkCdpEndpoint());
  ipcMain.handle("start-rally", (_, options: RallyOptions) => handleStartRally(options));
  ipcMain.handle("stop-rally", () => stopRally());
  ipcMain.handle("resume-rally", (_, options: ResumeOptions & Partial<RallyOptions>) => resumeRally(options));
  ipcMain.handle("get-rally-result", () => getCurrentLog());
  ipcMain.handle("get-last-error-image", () => ({
    errorA: getErrorImage("error_a.png"),
    errorB: getErrorImage("error_b.png")
  }));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (rallyProcess) rallyProcess.kill();
});

ipcMain.handle("save-file", async (_, { content, filterName, extensions }) => {
  const { filePath } = await dialog.showSaveDialog({
    filters: [{ name: filterName, extensions }],
  });
  if (filePath) {
    await fs.promises.writeFile(filePath, content, "utf-8");
    return { success: true, filePath };
  }
  return { success: false, message: "Cancelled" };
});
