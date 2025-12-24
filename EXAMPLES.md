# 使用例

## 基本的な使い方

### 1. ChatGPT vs Grok (デフォルト)
```bash
# 5往復でChatGPTから開始
node rally.mjs --rounds 5 --a chatgpt --b grok --first chatgpt
```

### 2. Claude vs ChatGPT
```bash
# 3往復でClaudeから開始
node rally.mjs --rounds 3 --a claude --b chatgpt --first claude
```

### 3. Gemini vs Grok
```bash
# 10往復でGeminiから開始
node rally.mjs --rounds 10 --a gemini --b grok --first gemini
```

## カスタマイズ例

### 出力ファイル名を指定
```bash
node rally.mjs --rounds 5 --out chatgpt-vs-grok-2025.json
```

### シードファイルを指定
```bash
node rally.mjs --rounds 5 --seed-file custom-question.txt
```

### 複数パラメータを組み合わせ
```bash
node rally.mjs \
  --rounds 7 \
  --a chatgpt \
  --b claude \
  --first claude \
  --out claude-chatgpt-debate.json \
  --seed-file debate-topic.txt
```

## npmスクリプトを使用

package.jsonに定義されたスクリプトを使用できます。

### ログインのみ実行
```bash
npm run login
```

### 構文チェック
```bash
npm test
```

### デフォルト設定で実行
```bash
npm start -- --rounds 5 --a chatgpt --b grok --first chatgpt
```

## シードファイルの例

### シンプルな質問
```bash
echo "人工知能の未来について教えてください。" > seed.txt
```

### 複雑なトピック
```bash
cat > seed.txt << 'EOF'
AIの登場で、日本の義務教育以後の教育はどうなるだろうか。
高校無償化も視野に入れると、AIネイティブの世代までの期間は
どのような制度が最適解だろうか。中学を出たての社会人が
高校へ行く人の費用を負担することになることに対する不満なども
鑑みて、現実的で建設的な議論を交わして欲しい。
EOF
```

### 技術的な質問
```bash
cat > seed.txt << 'EOF'
Reactの状態管理において、Context API、Redux、Zustandの
それぞれの長所と短所を比較してください。
どのような場合にどれを選ぶべきでしょうか。
EOF
```

## 実行結果の確認

### ログファイルの確認
```bash
# JSON形式で表示
cat log.json

# jqを使って整形表示（jqがインストールされている場合）
cat log.json | jq '.'

# 特定のターンのみ表示
cat log.json | jq '.[] | select(.type == "turn")'

# 特定のラウンドのみ表示
cat log.json | jq '.[] | select(.round == 1)'
```

### 出力の統計
```bash
# ターン数をカウント
cat log.json | jq '[.[] | select(.type == "turn")] | length'

# 各ターンの文字数を表示
cat log.json | jq '.[] | select(.type == "turn") | {who: .who, length: (.output | length)}'
```

## トラブルシューティング例

### デバッグモードで実行
Node.jsのデバッグ機能を使用する場合：
```bash
NODE_DEBUG=* node rally.mjs --rounds 1 --a chatgpt --b grok
```

### タイムアウトを延長する場合
rally.mjsを編集して、タイムアウト値を調整します：
```javascript
// 例: 入力フィールド待機を120秒に延長
await inputLoc.waitFor({ state: "visible", timeout: 120000 });
```

### セレクタのテスト
ブラウザの開発者ツールで直接テスト：
```javascript
// コンソールで実行
document.querySelector("textarea#prompt-textarea");
document.querySelectorAll("[data-message-author-role='assistant']");
```

## 高度な使用例

### 複数の比較を連続実行
```bash
#!/bin/bash
# compare.sh

# ChatGPT vs Grok
node rally.mjs --rounds 5 --a chatgpt --b grok --out chatgpt-grok.json

# Claude vs ChatGPT
node rally.mjs --rounds 5 --a claude --b chatgpt --out claude-chatgpt.json

# Gemini vs Claude
node rally.mjs --rounds 5 --a gemini --b claude --out gemini-claude.json

echo "All comparisons complete!"
```

### 結果の自動分析
```bash
#!/bin/bash
# analyze.sh

# 実行
node rally.mjs --rounds 5 --out result.json

# 統計情報を出力
echo "=== Statistics ==="
echo "Total turns: $(cat result.json | jq '[.[] | select(.type == "turn")] | length')"
echo "Average response length:"
cat result.json | jq '[.[] | select(.type == "turn") | .output | length] | add / length'
```

## CI/CD での使用

GitHub Actionsの例：
```yaml
name: LLM Rally Test

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npx playwright install chromium
      - run: npm test
```
