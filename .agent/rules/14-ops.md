---
trigger: model_decision
description: ビルド、テスト、デプロイ、運用に関する質問や作業を行う場合に適用する。
slug: ops
---
# 運用手順 (Operational Procedures)

プロジェクトに合わせてコマンドをカスタマイズしてください。

## 開発環境

### セットアップ
```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# .env を編集して必要な値を設定
```

### 開発サーバー
```bash
pnpm dev
```

## ビルド
```bash
# 開発ビルド
pnpm build

# プロダクションビルド
pnpm build:prod
```

## テスト
```bash
# 全テスト実行
pnpm test

# ウォッチモード
pnpm test:watch

# カバレッジ付き
pnpm test:coverage
```

## Lint & Format
```bash
# Lintチェック
pnpm lint

# Lint自動修正
pnpm lint:fix

# フォーマット
pnpm format
```

## 型チェック
```bash
pnpm typecheck
```

## デプロイ

### ステージング
```bash
# CI/CDで自動実行されることを推奨
pnpm deploy:staging
```

### プロダクション
```bash
# 必ず承認プロセスを経ること
pnpm deploy:production
```

## トラブルシューティング

### 依存関係の問題
```bash
# node_modules を削除して再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### キャッシュクリア
```bash
pnpm store prune
```
