---
description: 現在のプロジェクトに設定されているルールとワークフローの一覧を表示し、管理操作を行う。
---
# エージェント設定の管理 (Manage Agent Config)

## Step 1: 設定ディレクトリの確認 // turbo
`ZG_PROJECT/<プロジェクト名>/.agent` ディレクトリの存在と構造を確認せよ：

```bash
if [ -d "ZG_PROJECT/<プロジェクト名>/.agent" ]; then
  echo "=== Rules ==="
  ls -la ZG_PROJECT/<プロジェクト名>/.agent/rules/ 2>/dev/null || echo "No rules directory"
  echo ""
  echo "=== Workflows ==="
  ls -la ZG_PROJECT/<プロジェクト名>/.agent/workflows/ 2>/dev/null || echo "No workflows directory"
else
  echo "ZG_PROJECT/<プロジェクト名>/.agent directory not found"
fi
```

## Step 2: ルール一覧の表示
各ルールファイルのメタ情報を抽出して表示せよ：

| ファイル名 | トリガー | 説明 |
|------------|----------|------|
| `<name>.md` | `<trigger>` | `<description>` |

### トリガー別の分類
- **always_on**: 常に適用されるルール
- **model_decision**: 意図に基づいて適用されるルール
- **glob**: ファイルパターンで適用されるルール
- **manual**: 手動で呼び出すルール

## Step 3: ワークフロー一覧の表示
各ワークフローファイルのメタ情報を抽出して表示せよ：

| コマンド | 説明 |
|----------|------|
| `/<name>` | `<description>` |

## Step 4: 操作の選択
ユーザーに以下の操作を提示せよ：

1. **詳細表示**: 特定のルール/ワークフローの内容を表示
2. **新規作成**: `/create-rule` または `/create-workflow` を呼び出し
3. **編集**: 既存ファイルの修正
4. **削除**: 不要なファイルの削除
5. **検証**: 設定の整合性チェック
6. **終了**: 操作を終了

ユーザーの選択に応じて処理を分岐せよ。

## Step 5: 詳細表示（選択時）
指定されたファイルの全内容を表示せよ。

## Step 6: 編集（選択時）
ユーザーから編集内容を聞き取り、ファイルを更新せよ。
変更前と変更後のdiffを表示し、確認を求めること。

## Step 7: 削除（選択時）
削除対象のファイルを確認し、ユーザーの最終承認を得てから削除せよ。

```bash
rm ZG_PROJECT/<プロジェクト名>/.agent/rules/<target>.md
# または
rm ZG_PROJECT/<プロジェクト名>/.agent/workflows/<target>.md
```

## Step 8: 検証（選択時）
設定の整合性チェックを行え：

### チェック項目
1. **YAML構文**: フロントマターが正しくパースできるか
2. **必須フィールド**: trigger/description が存在するか
3. **参照の解決**: `@path/to/file.md` の参照先が存在するか
4. **重複チェック**: 同じslugが複数存在しないか
5. **矛盾チェック**: 相反するルールが存在しないか

問題がある場合は、ファイル名と問題点を報告せよ。
