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

## Configure
`sites.json` のURLとセレクタは各自の環境に合わせて調整してください。
