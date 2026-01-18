---
description: セキュリティ脆弱性のスキャンを実行する原子ワークフロー。
---
# セキュリティスキャン (Security Scan)

## Step 1: 依存関係の脆弱性チェック // turbo
```bash
pnpm audit || npm audit || yarn audit || pip-audit
```

## Step 2: シークレット検出 // turbo
コード内にハードコードされたシークレットがないか検出せよ：
- APIキーのパターン
- パスワードのパターン
- プライベートキーのパターン

## Step 3: セキュリティルール違反チェック
`security-mandates.md` に定義された禁止事項を検証せよ：
- `eval()` の使用
- SQLの文字列結合
- サニタイズなしのユーザー入力

## 結果判定
- **成功**: 問題なし → `PASS` を返す
- **警告**: 低リスクの問題あり → `PASS_WITH_WARNINGS` を返す
- **失敗**: 高リスクの問題あり → `FAIL` を返す

## 出力内容
以下を報告せよ：
- 検出された脆弱性の数（Critical/High/Medium/Low）
- 各問題の概要と対処法
