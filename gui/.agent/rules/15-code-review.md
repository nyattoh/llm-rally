---
trigger: model_decision
description: コードレビュー、PRレビュー、コードの品質チェックを求められた場合に適用する。
slug: code-review
---
# コードレビュー基準 (Code Review Standards)

レビュー時は以下の観点で確認すること：

## 可読性 (Readability)
- 変数名・関数名が意図を明確に表しているか
- 過度に複雑なロジックがないか（Cyclomatic Complexity ≤ 10を目安）
- 適切なコメントやドキュメントが付与されているか

## 保守性 (Maintainability)
- DRY原則（Don't Repeat Yourself）に従っているか
- 単一責任の原則（SRP）を満たしているか
- マジックナンバーが定数化されているか

## パフォーマンス (Performance)
- 不必要なループや再計算がないか
- N+1問題などの非効率なデータアクセスがないか

## エラーハンドリング (Error Handling)
- 適切な例外処理が実装されているか
- エッジケースが考慮されているか
