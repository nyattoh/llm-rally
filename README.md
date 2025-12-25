# llm-rally

Playwrightを使って、2つのLLMチャットUIを自動で往復させるツールです。

## Setup
```bash
npm install
npx playwright install
```

## Login (初回のみ)
```bash
node rally.mjs --login-only
```
開いた2つのタブで手動ログインし、ブラウザを閉じます。

## Run
1. `seed.txt` にお題を書く
2. 実行
```bash
node rally.mjs --rounds 5 --a chatgpt --b grok --first chatgpt
```

## Browser
既定のブラウザを使う場合:
```bash
node rally.mjs --default-browser
```

Chrome DevTools (CDP) で起動済みのChromeに接続する場合:
```bash
node rally.mjs --cdp http://localhost:9222
```
※ Chrome DevTools MCPなどで既存Chromeを起動している場合も、CDPエンドポイントに接続できます。

任意のブラウザを指定する場合:
```bash
node rally.mjs --browser chromium
node rally.mjs --browser firefox
node rally.mjs --browser webkit
node rally.mjs --browser chromium --channel chrome   # インストール済みChrome
node rally.mjs --browser chromium --channel msedge   # インストール済みEdge
```

## Configure
`sites.json` のURLとセレクタは各自の環境に合わせて調整してください。
`lastMessage` は「最後のメッセージ」ではなく、アシスタントの全メッセージにマッチするセレクタを指定してください（過去設定の `>> nth=-1` も互換対応しています）。
