---
description: TypeScriptの型チェックを実行する原子ワークフロー。
---
# 型チェック (Type Check)

## 実行 // turbo
型チェックを実行せよ：
```bash
pnpm typecheck || npx tsc --noEmit || yarn tsc --noEmit
```

## 結果判定
- **成功**: 型エラーなし → `PASS` を返す
- **失敗**: 型エラーあり → `FAIL` を返す

## エラー時の出力
失敗した場合、以下を報告せよ：
- エラー数
- エラー箇所（ファイル名:行番号）
- エラー内容の要約（最大5件）
