---
trigger: model_decision
description: ZG_PROJECT配下での新しいリポジトリ作成ルールを強制します。ユーザーが新しいリポジトリの作成や、既存フォルダのリポジトリ化を求めた場合に適用されます。
slug: repo-creation
---
# 🆕 リポジトリ作成ルール

## 📍 作成場所

- **ルート**: すべての新しいリポジトリは、必ず `ZG_PROJECT` ディレクトリの直下に作成されなければなりません。
- **パス**: `ZG_PROJECT/<プロジェクト名>/` がプロジェクトのルートディレクトリです。

## 🏷️ 命名規則

- **意味のある名前**: フォルダ名は一時的で適当なものであることが多いため、必ず **プロジェクトの内容（コード、README等）を分析** し、最適な名前を提案してください。
- **ケバブケース**: リポジトリ名は kebab-case（例: `my-cool-project`）を使用してください。
- **提案と変更**: 現状の名前が kebab-case であっても、内容を表していない場合は、より適切な名前への変更を提案・実行してください。

## ⚙️ Git設定

- **Ignore設定**: すべての新しいリポジトリには `.gitignore` ファイルが必須です。
- **独立性**: `ZG_PROJECT` 自体はワークスペースのルートで無視されていると想定されるため、各サブリポジトリは独立した `.git` を持ちます。

## 📁 .gitignore に含めるべき項目

```gitignore
# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/

# Dependencies
node_modules/
venv/
__pycache__/

# Environment
.env
.env.local

# ZG_PROJECT specific
ZG_PROJECT/
*_SPEC.MD
```

## 🐙 GitHub

- **作成コマンド**: `gh repo create` を使用して GitHub 上にリポジトリを作成してください。
- **デフォルト**: **絶対に** Privateリポジトリとして作成します（`--private`）。これは絶対的なルールであり、例外はありません。
- **警告**: ユーザーから「Publicで」と明示的かつ強く指示されない限り、Publicリポジトリを作成してはいけません。デフォルトは常にPrivateです。
- **プッシュ**: 作成後は必ずリモートにプッシュして同期してください。

## 🚀 推奨ワークフロー

- **完全自動化**: ユーザーが新しいプロジェクトやリポジトリの作成を求めた場合、可能な限りワークフロー `/setup-ga-workspace` を使用して、リポジトリ作成からGA-Workspace構築までを一気通貫で行うことを強く推奨します。
