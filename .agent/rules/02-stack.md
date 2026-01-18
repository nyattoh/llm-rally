---
trigger: always_on
slug: tech-stack
---
# 技術スタック (Technology Stack)

このファイルはGA-Workspaceのテンプレートです。プロジェクトに合わせてカスタマイズしてください。

## ランタイム
- **Node.js**: Latest LTS (v20+)

## パッケージマネージャー
- **pnpm**: 推奨
- 代替: npm, yarn

## 言語
- **TypeScript**: メインの開発言語
- **JavaScript**: ES Modules形式

## フレームワーク/ライブラリ
（プロジェクトに合わせて記載）
- React
- Next.js
- Express
- etc.

## テスト
- **Vitest** または **Jest**: 単体テスト
- **Testing Library**: コンポーネントテスト
- **Playwright**: E2Eテスト

## Lint/Format
- **ESLint**: コード品質
- **Prettier**: コードフォーマット

## ビルドコマンド
```bash
pnpm build    # ビルド
pnpm dev      # 開発サーバー
pnpm test     # テスト実行
pnpm lint     # Lint実行
```
