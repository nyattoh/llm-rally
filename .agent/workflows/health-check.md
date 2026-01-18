---
description: GA-Workspaceの設定が正しく構成されているか検証します。星来が健康診断するよ。
---
# 🏥 GA-Workspace 健全性チェック

……ふふ、私の設定、ちゃんとできてるか確認するね。
健康診断みたいなものだよ。

## Step 1: 構造チェック // turbo
必須のディレクトリとファイルがあるか見るね：

```bash
echo "=== ディレクトリ構造 ==="
ls -la ZG_PROJECT/<プロジェクト名>/.agent/rules/ 2>/dev/null || echo "❌ rules/ が見つからない……"
ls -la ZG_PROJECT/<プロジェクト名>/.agent/workflows/ 2>/dev/null || echo "❌ workflows/ が見つからない……"
```

### 必須ファイルチェック
| ファイル | 状態 | 私の診断 |
|----------|------|----------|
| `00-ga-workspace-definition.md` | ✅/❌ | 私が何者か |
| `01-stack.md` | ✅/❌ | 技術スタック |
| `02-security-mandates.md` | ✅/❌ | セキュリティルール |
| `create-rule.md` | ✅/❌ | ルール作成ワークフロー |
| `create-workflow.md` | ✅/❌ | ワークフロー作成ワークフロー |

## Step 2: YAML構文チェック // turbo
各ファイルのフロントマターが正しいか見るね：

```bash
for f in ZG_PROJECT/<プロジェクト名>/.agent/rules/*.md ZG_PROJECT/<プロジェクト名>/.agent/workflows/*.md; do
  head -20 "$f" | grep -E "^(trigger|description|slug):" || echo "⚠️ $f: フロントマターがおかしいかも"
done
```

## Step 3: 参照整合性チェック
`@path/to/file.md` の参照先が存在するか確認するよ：

```bash
grep -r "@.*\.md" ZG_PROJECT/<プロジェクト名>/.agent/ | while read line; do
  ref=$(echo "$line" | grep -oE "@[^ ]+\.md")
  # 参照先が存在するか確認
done
```

## Step 4: 重複・競合チェック
- 同じ `slug` を持つルールがないか
- 矛盾する設定がないか

## Step 5: 依存関係チェック
- ワークフローが呼び出す子ワークフローが存在するか
- 循環参照がないか

## Step 6: 健康診断レポート

```
## 🏥 GA-Workspace 健康診断結果

### 構造
- rules/: ✅ 存在 / ❌ 不足
- workflows/: ✅ 存在 / ❌ 不足
- templates/: ✅ 存在 / ➖ オプション

### 必須ファイル
- [x] 00-ga-workspace-definition.md
- [x] 01-stack.md
- [x] 02-security-mandates.md
- [ ] ...（不足があれば）

### YAML構文
- ✅ すべて正常 / ⚠️ <N>件の警告

### 参照整合性
- ✅ すべて解決可能 / ❌ <N>件の未解決参照

### 総合診断
✅ **健康** / ⚠️ **要注意** / ❌ **要治療**

### 処方箋（問題がある場合）
1. <具体的な修正方法>
2. <具体的な修正方法>

……ふふ、<結果に応じたコメント>
```

**健康な場合**: 「元気だね。私もうれしい」
**要注意の場合**: 「ちょっと気になるところがあるけど、動くよ」
**要治療の場合**: 「あれ……直さないと動かないかも。手伝うね」
