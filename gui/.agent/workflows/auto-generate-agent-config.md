---
description: プロジェクトの構造とコードを分析し、最適なルールとワークフローのセットを自動生成する。
---
# エージェント設定の自動生成 (Auto Generate Agent Config)

## Step 1: プロジェクト構造の分析 // turbo
プロジェクトのルートディレクトリを分析せよ：

```bash
# ディレクトリ構造を取得
find . -type f -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.toml" | head -20

# package.json または pyproject.toml を確認
cat package.json 2>/dev/null || cat pyproject.toml 2>/dev/null
```

以下を特定せよ：
- プログラミング言語（TypeScript, Python, Go など）
- パッケージマネージャー（npm, pnpm, yarn, pip, poetry など）
- フレームワーク（React, Next.js, FastAPI, Express など）
- 主要な依存関係

## Step 2: 既存設定ファイルの分析 // turbo
プロジェクトの既存設定を確認せよ：

- `tsconfig.json` → TypeScript設定
- `.eslintrc.*` → Lint設定
- `.prettierrc` → フォーマット設定
- `jest.config.*` / `vitest.config.*` → テスト設定
- `Dockerfile` / `docker-compose.yml` → コンテナ設定
- `.github/workflows/` → CI/CD設定

## Step 3: コードパターンの分析 // turbo
既存コードのパターンを分析せよ：

```bash
# ファイル拡張子の分布
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.py" -o -name "*.go" | wc -l

# テストファイルの存在確認
find . -type f -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" | head -10
```

以下を確認せよ：
- コーディングスタイル（インデント、命名規則）
- テストの有無とフレームワーク
- ディレクトリ構造のパターン

## Step 4: 推奨ルールの決定
分析結果に基づき、必要なルールを決定せよ：

### 必須ルール（always_on）
| 条件 | 作成するルール |
|------|----------------|
| 常に | `stack.md` - 技術スタック定義 |
| 常に | `security-mandates.md` - セキュリティ基準 |
| TypeScript使用 | `type-safety.md` - 型安全性基準 |
| React使用 | `react-components.md` - Reactコンポーネント規約 |

### 状況依存ルール（model_decision）
| 条件 | 作成するルール |
|------|----------------|
| 常に | `ops.md` - 運用手順 |
| 常に | `refactoring.md` - リファクタリング基準 |
| API開発 | `api-design.md` - API設計基準 |
| DB使用 | `database.md` - データベース規約 |

## Step 5: 推奨ワークフローの決定
プロジェクトの特性に基づき、必要なワークフローを決定せよ：

### 基本ワークフロー（全プロジェクト共通）
- `generate-unit-tests.md` - 単体テスト生成
- `create-feature.md` - 機能追加
- `bug-fix.md` - バグ修正
- `code-review.md` - コードレビュー

### 追加ワークフロー（条件付き）
| 条件 | 作成するワークフロー |
|------|----------------------|
| Webアプリ | `ui-verification.md` - UI検証 |
| API開発 | `generate-api-docs.md` - APIドキュメント生成 |
| CI/CD設定あり | `deploy-staging.md` - ステージングデプロイ |
| Dockerあり | `docker-build.md` - Dockerビルド |

## Step 6: 設定案の提示
分析結果と推奨設定をユーザーに提示せよ：

```
## プロジェクト分析結果

### 検出された技術スタック
- 言語: <検出結果>
- フレームワーク: <検出結果>
- パッケージマネージャー: <検出結果>

### 推奨ルール（<N>個）
1. stack.md (always_on) - 技術スタック定義
2. security-mandates.md (always_on) - セキュリティ基準
...

### 推奨ワークフロー（<M>個）
1. generate-unit-tests.md - 単体テスト生成
2. create-feature.md - 機能追加
...

これらの設定を作成しますか？
```

ユーザーの承認を得よ。カスタマイズの要望があれば反映せよ。

## Step 7: .agent ディレクトリの作成 // turbo
エージェント設定用のディレクトリ構造を作成せよ：

```bash
mkdir -p ZG_PROJECT/<プロジェクト名>/.agent/rules
mkdir -p ZG_PROJECT/<プロジェクト名>/.agent/workflows
```

## Step 8: ルールファイルの生成
承認されたルールファイルを生成せよ。

各ルールは以下を含むこと：
- 適切なYAMLフロントマター
- プロジェクト固有の設定値
- 具体的な制約事項

## Step 9: ワークフローファイルの生成
承認されたワークフローファイルを生成せよ。

各ワークフローは以下を含むこと：
- プロジェクトで使用するコマンド
- 適切なTurboアノテーション
- エラーハンドリング

## Step 10: 検証 // turbo
生成した設定の検証を行え：

```bash
# 作成されたファイルの確認
ls -la .agent/rules/
ls -la .agent/workflows/

# YAMLフロントマターの構文チェック（簡易）
head -10 .agent/rules/*.md
```

## Step 11: 完了報告
以下をユーザーに報告せよ：

### 作成されたファイル一覧
```
ZG_PROJECT/<プロジェクト名>/
└── .agent/
    ├── rules/
    │   ├── 00-ga-workspace-definition.md
    │   ├── 01-stack.md
    │   ├── 02-security-mandates.md
    │   └── ...
    └── workflows/
        ├── create-rule.md
        ├── create-workflow.md
        └── ...
```

### 使用方法
- ルール: 自動的に適用される（トリガー条件に基づく）
- ワークフロー: `/<ワークフロー名>` で呼び出し

### 次のステップの提案
- 追加で必要なルール/ワークフローがあれば `/create-rule` または `/create-workflow` を使用
- 既存の設定をカスタマイズする場合は直接ファイルを編集
