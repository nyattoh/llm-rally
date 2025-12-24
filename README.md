# llm-rally

Playwrightを使って、2つのLLMチャットUIを自動で往復させるツールです。

## 機能

- 2つのLLMチャットUI間で自動的に質問と回答を往復
- 各ターンの入出力をJSONファイルに記録
- セッション保存によるログイン状態の維持
- 詳細なログ出力でデバッグしやすい
- 複数のLLMサイトに対応（ChatGPT、Grok、Claude、Gemini）

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

注意: このツールはシステムにインストールされているGoogle Chromeを使用します。
Chromeがインストールされていない場合は、事前にインストールしてください。

### 2. 初回ログイン
```bash
node rally.mjs --login-only
```
開いた2つのタブで手動ログインし、完了したらブラウザを閉じます。
ログイン情報は `pw-profile` ディレクトリに保存されます。

## 使い方

### 1. シードファイルの準備
`seed.txt` に最初の質問を書きます。
```bash
echo "AIの登場で、日本の義務教育以後の教育はどうなるだろうか。" > seed.txt
```

### 2. 実行
```bash
node rally.mjs --rounds 5 --a chatgpt --b grok --first chatgpt
```

### オプション
- `--a <サイト名>`: サイトA（デフォルト: chatgpt）
- `--b <サイト名>`: サイトB（デフォルト: grok）
- `--first <サイト名>`: 最初に質問するサイト（デフォルト: chatgpt）
- `--rounds <数>`: 往復回数（デフォルト: 5）
- `--out <ファイル名>`: 出力ファイル（デフォルト: log.json）
- `--seed-file <ファイル名>`: シードファイル（デフォルト: seed.txt）
- `--login-only`: ログインのみ実行

### 対応サイト
- `chatgpt`: ChatGPT (https://chatgpt.com/)
- `grok`: Grok (https://grok.com/)
- `claude`: Claude (https://claude.ai/)
- `gemini`: Gemini (https://gemini.google.com/)

## 出力

実行結果は `log.json` に保存されます。
```json
[
  {
    "ts": "2025-01-01T00:00:00.000Z",
    "type": "meta",
    "a": "chatgpt",
    "b": "grok",
    "first": "chatgpt",
    "rounds": 5
  },
  {
    "ts": "2025-01-01T00:00:00.000Z",
    "type": "seed",
    "text": "質問内容..."
  },
  {
    "ts": "2025-01-01T00:00:00.000Z",
    "type": "turn",
    "round": 1,
    "who": "chatgpt",
    "input": "質問内容...",
    "output": "回答内容..."
  }
]
```

## トラブルシューティング

### セレクタが見つからない
サイトのUIが変更された可能性があります。`sites.json` のセレクタを更新してください。

ブラウザの開発者ツールで要素を確認して、適切なセレクタを見つけます。

### タイムアウトエラー
ネットワークが遅い場合や、LLMの応答が遅い場合に発生します。
`rally.mjs` 内のタイムアウト値を調整してください。

### ログインが保持されない
`pw-profile` ディレクトリが削除されている可能性があります。
再度 `--login-only` でログインしてください。

## カスタマイズ

### 新しいサイトの追加
`sites.json` に新しいエントリを追加します。
```json
{
  "mysite": {
    "name": "My LLM Site",
    "url": "https://example.com/",
    "selectors": {
      "input": "textarea.input",
      "sendButton": "button.send",
      "lastMessage": ".message:last-of-type",
      "stopButton": "button.stop"
    }
  }
}
```

セレクタの見つけ方:
1. サイトを開く
2. 開発者ツール（F12）を開く
3. 要素を選択して、適切なセレクタをコピー

### タイムアウトの調整
`rally.mjs` 内の以下の値を調整できます。
- 入力フィールド待機: 60秒（60000ms）
- 応答待機: 120秒（120000ms）
- 生成完了待機: 180秒（180000ms）

## ライセンス
MIT
