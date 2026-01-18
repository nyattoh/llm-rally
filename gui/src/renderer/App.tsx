import React, { useEffect, useRef, useState } from "react";

type StatusState = "idle" | "running" | "completed" | "error";

const LLM_OPTIONS = ["chatgpt", "claude", "grok", "gemini"];
const MODE_OPTIONS: { value: string; label: string }[] = [
  { value: "neutral", label: "通常モード" },
  { value: "debate", label: "討論モード" },
  { value: "co_create", label: "共創モード" },
  { value: "conclusion", label: "結論モード" },
  { value: "coder", label: "コーダーモード（コード+レビュー）" }
];

export default function App() {
  const [seedText, setSeedText] = useState("最初のシード質問をここに入力してください");
  const [llmA, setLlmA] = useState("chatgpt");
  const [llmB, setLlmB] = useState("claude");
  const [turns, setTurns] = useState(5);
  const [launchStatus, setLaunchStatus] = useState("未起動");
  const [cdpStatus, setCdpStatus] = useState("未確認");
  const [rallyLogs, setRallyLogs] = useState<string[]>([]);
  const [rallyStatus, setRallyStatus] = useState("準備完了");
  const [status, setStatus] = useState<StatusState>("idle");
  const [statusMessage, setStatusMessage] = useState("準備完了");
  const [bridgeState, setBridgeState] = useState("Web Mode (No Bridge)");
  const [resultMode, setResultMode] = useState<"json" | "markdown">("json");
  const [resumeRounds, setResumeRounds] = useState(2);
  const [mode, setMode] = useState("neutral");
  const [logResult, setLogResult] = useState<any[] | null>(null);
  const [errorImages, setErrorImages] = useState<{ errorA: string | null; errorB: string | null }>({ errorA: null, errorB: null });
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const [isChromeConnected, setIsChromeConnected] = useState(false);

  const appendLog = (line: string) => {
    setRallyLogs((prev) => {
      const next = [...prev, line];
      if (next.length > 200) {
        next.shift();
      }
      return next;
    });
  };

  useEffect(() => {
    if (window.electronAPI) {
      setBridgeState("Native Bridge OK");
    } else {
      setBridgeState("Web Mode (No Bridge)");
    }
    if (!window.electronAPI) return;
    const stopLog = window.electronAPI.onRallyLog((line) => appendLog(line));
    const stopStatus = window.electronAPI.onRallyStatus(async (stat) => {
      setRallyStatus(`終了コード: ${stat.code ?? "-"}`);
      setStatus(stat.code === 0 ? "completed" : "error");
      setStatusMessage(`プロセスが終了しました (${stat.code})`);
      try {
        const result = await window.electronAPI.getRallyResult();
        setLogResult(Array.isArray(result) ? result : null);
      } catch (error) {
        console.error("Failed to fetch rally result:", error);
        setLogResult(null);
      }
      try {
        const images = await window.electronAPI.getLastErrorImages();
        setErrorImages(images);
      } catch { }
    });
    return () => {
      stopLog();
      stopStatus();
    };
  }, []);

  // Poll for results while running
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (status === "running") {
      intervalId = setInterval(async () => {
        if (!window.electronAPI) return;
        try {
          const result = await window.electronAPI.getRallyResult();
          if (Array.isArray(result)) {
            setLogResult(result);
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status]);

  useEffect(() => {
    if (!logContainerRef.current) return;
    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }, [rallyLogs]);

  useEffect(() => {
    if (!window.electronAPI) return undefined;
    let timer: NodeJS.Timeout | null = null;
    const pollResult = async () => {
      try {
        const result = await window.electronAPI.getRallyResult();
        if (Array.isArray(result)) {
          setLogResult(result);
        }
      } catch (error) {
        console.error("Polling rally result failed:", error);
      }
    };
    if (status === "running") {
      pollResult();
      timer = setInterval(pollResult, 5000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status]);

  const checkConnection = async () => {
    if (!window.electronAPI) return false;
    const payload = await window.electronAPI.checkCdp();
    try {
      if (payload && (payload.startsWith("{") || payload.startsWith("["))) {
        JSON.parse(payload);
        setIsChromeConnected(true);
        setCdpStatus("接続済み");
        return true;
      }
    } catch { }
    setIsChromeConnected(false);
    setCdpStatus(payload || "CDP 応答なし");
    return false;
  };

  const handleLaunchChrome = async () => {
    if (!window.electronAPI) {
      setLaunchStatus("Electron bridge 未接続");
      return;
    }
    setLaunchStatus("起動中...");
    const result = await window.electronAPI.launchChrome();
    setLaunchStatus(result.message ?? (result.success ? "Chrome 起動中" : "起動失敗"));

    if (result.success) {
      setCdpStatus("接続待機中...");
      // Poll for connection
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const connected = await checkConnection();
        if (connected || attempts >= 30) { // Try for 60 seconds
          clearInterval(interval);
          if (!connected) setCdpStatus("接続タイムアウト (手動確認してください)");
        }
      }, 2000);
    }
  };

  const handleCheckCdp = async () => {
    if (!window.electronAPI) {
      setCdpStatus("Electron bridge 未接続");
      return;
    }
    setCdpStatus("確認中...");
    await checkConnection();
  };

  const handleStartRally = async () => {
    if (!window.electronAPI) {
      setStatusMessage("Electron bridge 未接続");
      return;
    }
    setStatus("running");
    setStatusMessage("Rally 起動中...");
    setRallyStatus("Rally 起動中...");
    setRallyLogs([]);
    setLogResult(null);
    const result = await window.electronAPI.startRally({
      rounds: turns,
      a: llmA,
      b: llmB,
      first: llmA,  // LLM A always speaks first
      seed: seedText,
      mode
    });
    setRallyStatus(result.message ?? (result.success ? `pid ${result.pid}` : "開始失敗"));
    if (!result.success) {
      setStatus("error");
      setStatusMessage(result.message ?? "Rally の開始に失敗しました");
    }
  };

  const handleStopRally = async () => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.stopRally();
    if (result.success) {
      setStatus("idle");
      setStatusMessage(result.message ?? "停止しました");
      setRallyStatus(result.message ?? "停止しました");
    } else {
      setStatus("error");
      setStatusMessage(result.message ?? "停止に失敗しました");
    }
  };

  const handleResumeRally = async () => {
    if (!window.electronAPI) return;
    const additional = Math.max(1, resumeRounds);
    setStatus("running");
    setStatusMessage("Rally 再開中...");
    setRallyStatus("Rally 再開中...");
    setRallyLogs([]);
    setLogResult(null);
    const result = await window.electronAPI.resumeRally({ additionalRounds: additional, mode });
    setRallyStatus(result.message ?? (result.success ? `pid ${result.pid}` : "再開失敗"));
    if (!result.success) {
      setStatus("error");
      setStatusMessage(result.message ?? "再開に失敗しました");
    }
  };

  const isRunning = status === "running";
  const canResume = status === "completed" || status === "error";

  return (
    <div className="app">
      <header className="header">
        <h1>LLM Rally GUI</h1>
        <p>2つのLLMを往復させるデスクトップワークスペース</p>
        <div className="status-pill">Status: {status}</div>
      </header>

      <section className="panel">
        <h2>Launcher</h2>
        <p>
          Chromeの起動・CDP接続の準備を行います。<br />
          <strong style={{ color: "#e74c3c" }}>※重要: 起動後のChromeで各LLMサイトにログインしてください。</strong>
        </p>
        <div className="button-row">
          <button className="primary" onClick={handleLaunchChrome}>
            Chrome を起動
          </button>
          <button onClick={handleCheckCdp}>CDP 接続確認</button>
        </div>
        <div className="status-row">
          <small>Chrome: {launchStatus}</small>
          <small>CDP: {cdpStatus}</small>
          <small>Bridge: {bridgeState}</small>
          <small>詳細: {statusMessage}</small>
        </div>
      </section>

      <section className="panel-grid" style={{
        opacity: isChromeConnected ? 1 : 0.5,
        pointerEvents: isChromeConnected ? 'auto' : 'none',
        transition: 'opacity 0.3s'
      }}>
        <div className="panel">
          <h2>Run Setup</h2>
          <div className="field">
            <label>お題</label>
            <textarea value={seedText} onChange={(event) => setSeedText(event.target.value)} />
          </div>
          <div className="field">
            <label>LLM A</label>
            <select value={llmA} onChange={(event) => setLlmA(event.target.value)}>
              {LLM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>LLM B</label>
            <select value={llmB} onChange={(event) => setLlmB(event.target.value)}>
              {LLM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>ターン数</label>
            <input
              type="number"
              value={turns}
              min={1}
              onChange={(event) => setTurns(Number(event.target.value) || 1)}
            />
          </div>
          <div className="field">
            <label>モード</label>
            <select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
              {MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="panel">
          <h2>Run Control</h2>
          <p>実行・停止・再開の操作をまとめます。</p>
          <div className="button-row">
            <button className="secondary" onClick={handleStartRally} disabled={isRunning}>
              Start
            </button>
            <button onClick={handleStopRally} disabled={!isRunning}>
              Stop
            </button>
            <button onClick={handleResumeRally} disabled={isRunning || !canResume}>
              Resume
            </button>
          </div>
          <div className="resume-row">
            <label>追加ターン数</label>
            <input
              type="number"
              min={1}
              value={resumeRounds}
              onChange={(event) => setResumeRounds(Math.max(1, Number(event.target.value) || 1))}
            />
          </div>
          <div className="status-row">
            <small>Rally: {rallyStatus}</small>
          </div>
        </div>

        <div className="panel">
          <h2>Result</h2>
          <p>生成結果を確認・ダウンロードします。</p>
          <div className="result-area">
            <div className="result-toolbar">
              <button
                className={resultMode === "json" ? "active" : ""}
                onClick={() => setResultMode("json")}
              >
                JSON を表示
              </button>
              <button
                className={resultMode === "markdown" ? "active" : ""}
                onClick={() => setResultMode("markdown")}
              >
                Markdown を表示
              </button>
            </div>
            <pre className="result-preview">
              {logResult && logResult.length > 0
                ? resultMode === "json"
                  ? JSON.stringify(logResult, null, 2)
                  : logResult
                    .filter((entry: any) => entry.type === "turn")
                    .map((entry: any) => `## Round ${entry.round} - ${entry.who}\n\n${entry.output}\n`)
                    .join("\n---\n\n")
                : "まだ結果がありません。処理が完了すると反映されます。"}
            </pre>
            {errorImages.errorA && (
              <div className="error-images">
                <h4>エラー時スクリーンショット</h4>
                <img src={errorImages.errorA} alt="Error A" style={{ maxWidth: "100%", marginBottom: 8 }} />
                {errorImages.errorB && <img src={errorImages.errorB} alt="Error B" style={{ maxWidth: "100%" }} />}
              </div>
            )}
            <div className="log-stream" ref={logContainerRef}>
              {rallyLogs.length === 0 ? (
                <div className="log-line log-placeholder">リアルタイムログを待機中...</div>
              ) : (
                rallyLogs.map((line, index) => (
                  <div key={`${index}-${line}`} className="log-line">
                    <span className="log-index">{index + 1}</span>
                    <span>{line}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
