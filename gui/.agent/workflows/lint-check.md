---
description: コードスタイルのLintチェックを実行する原子ワークフロー。
---
# Lintチェック (Lint Check)

## 実行 // turbo
Lintを実行せよ：
```bash
pnpm lint || npm run lint || yarn lint
```

## 結果判定
- **成功**: Lintエラーなし → `PASS` を返す
- **警告のみ**: 警告はあるがエラーなし → `PASS_WITH_WARNINGS` を返す
- **失敗**: エラーあり → `FAIL` を返す

## エラー時の出力
失敗した場合、以下を報告せよ：
- エラー数と警告数
- 主要なエラー内容（最大5件）
- 自動修正可能かどうか（`--fix` オプション）
