---
trigger: manual
description: 新しいルールを作成する際のテンプレート集。@rule-templates で呼び出し可能。
slug: rule-templates
---
# ルールテンプレート集 (Rule Templates)

新しいルールを作成する際のテンプレート。コピーして使用すること。

---

## Template 1: 技術スタック (Tech Stack)

```markdown
---
trigger: always_on
slug: tech-stack
---
# 技術スタック (Technology Stack)

- **ランタイム**: Node.js (Latest LTS)
- **パッケージマネージャー**: pnpm
- **言語**: TypeScript
- **フレームワーク**: 
  - React 19
  - Next.js 15
- **テスト**: Vitest + Testing Library
- **Lint**: ESLint + Prettier
```

---

## Template 2: セキュリティ基準 (Security)

```markdown
---
trigger: always_on
slug: security-mandates
---
# セキュリティ義務 (Security Mandates)

## 禁止事項
- APIキー・パスワードのハードコード禁止。環境変数を使用すること
- `eval()` の使用禁止
- SQLの文字列結合禁止。パラメータ化クエリを使用すること

## 必須事項
- ユーザー入力は必ずサニタイズすること
- 認証が必要なエンドポイントには認証ミドルウェアを適用すること
- センシティブなデータはログに出力しないこと
```

---

## Template 3: 型安全性 (Type Safety)

```markdown
---
trigger: always_on
slug: type-safety
description: TypeScriptコードにおける型定義の厳格な基準を強制する。
---
# 型安全性基準 (Type Safety Standards)

1. **完全な型注釈**: すべての関数シグネチャに型を付与すること
2. **any禁止**: `any` 型は使用禁止。`unknown` + 型ガードを使用すること
3. **Strict Mode**: `tsconfig.json` の `strict: true` を維持すること
4. **Non-null Assertion禁止**: `!` 演算子の使用を避け、適切なnullチェックを行うこと
```

---

## Template 4: コーディングスタイル (Code Style)

```markdown
---
trigger: always_on
slug: code-style
---
# コーディングスタイル (Code Style)

## 命名規則
- **変数・関数**: camelCase (`getUserById`)
- **クラス・型**: PascalCase (`UserService`)
- **定数**: SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **ファイル**: kebab-case (`user-service.ts`)

## フォーマット
- インデント: スペース2つ
- 文字列: シングルクォート優先
- セミコロン: なし（Prettierで統一）

## 関数
- 1関数 = 1責務（50行以内を目安）
- 早期リターンを活用し、ネストを浅く保つ
- 純粋関数を優先する
```

---

## Template 5: 状況依存ルール (Model Decision)

```markdown
---
trigger: model_decision
description: パフォーマンス改善、最適化、高速化について言及された場合に適用する。
slug: performance-guidelines
---
# パフォーマンスガイドライン (Performance Guidelines)

## 優先順位
1. 計算量の削減（アルゴリズム改善）
2. I/O削減（キャッシュ、バッチ処理）
3. 並列処理の活用

## 禁止事項
- ループ内でのawait（Promise.allを使用）
- 同一データの重複取得
- 不要な再レンダリング（React）

## 計測の義務
- 最適化前後で必ずベンチマークを取ること
- 改善率を数値で報告すること
```

---

## Template 6: Globトリガールール

```markdown
---
trigger: glob
globs:
  - "**/*.tsx"
  - "**/*.jsx"
slug: react-components
---
# Reactコンポーネント規約

## コンポーネント構造
- 1ファイル = 1コンポーネント
- Props型は明示的に定義する
- デフォルトエクスポートを使用

## Hooks
- カスタムフックは `use` プレフィックスを付ける
- 副作用は `useEffect` に集約する
- 依存配列は正確に指定する

## スタイリング
- Tailwind CSSのユーティリティクラスを優先
- インラインスタイルは避ける
```

---

## Template 7: 手動呼び出しルール (Manual)

```markdown
---
trigger: manual
slug: database-migration
---
# データベースマイグレーション手順

**重要**: このルールは `@database-migration` で明示的に呼び出した場合のみ適用される。

## 事前確認
- [ ] バックアップが取得済みであること
- [ ] ステージング環境でテスト済みであること
- [ ] ロールバック手順が準備されていること

## 実行手順
1. マイグレーションファイルを作成
2. ローカルで動作確認
3. PRを作成してレビュー
4. マージ後、本番環境で実行

## 禁止事項
- 直接本番DBに接続してのDDL実行
- 大量データの一括更新（バッチ処理を使用）
```
