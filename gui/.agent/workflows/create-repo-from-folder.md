---
description: 既存のフォルダをZG_PROJECT配下のGitHubリポジトリに変換します
---
# 📂 フォルダからリポジトリを作成

このワークフローは、既存のフォルダをGitHubリポジトリに変換します。

## Step 1: 分析と名前提案 // turbo
- **場所確認**: 現在のディレクトリが `ZG_PROJECT` 内にあるか確認します。
  - `ZG_PROJECT` 外の場合はユーザーに警告し、確認または移動を求めます。
- **コンテンツ分析**: フォルダ内のファイル（README, ソースコード等）を読み込み、このプロジェクトが何をするものなのか理解します。
- **リネーム提案**: 現在のフォルダ名は「適当なもの」であるという前提に立ち、プロジェクトの本質を表す最適なリポジトリ名を考案します。
  - たとえ現在の名前が `kebab-case` であっても、より適切な名前があれば提案します
  - 例: `test` → `ai-agent-controller`
  - ユーザーに改名を確認し、承認されたらフォルダ名を変更します。

## Step 2: Gitの初期化 // turbo
```bash
git init
```

`.gitignore` を作成し、以下の項目を必ず除外設定に追加します：
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

## Step 3: 初回コミット // turbo
```bash
git add .
```
```bash
git commit -m "🎉 Initial commit"
```

## Step 4: GitHubリポジトリの作成 // turbo
`gh repo create` を実行します。
- **重要**: 必ず `--private` フラグを使用すること。
- デフォルトで **Private** リポジトリとして作成（`--private`）
- ソースは現在のディレクトリ（`--source=.`）
- リモート名は `origin`

```bash
gh repo create <リポジトリ名> --private --source=. --remote=origin
```

## Step 5: ブランチ設定とプッシュ // turbo
デフォルトブランチを `main` に設定します。
```bash
git branch -M main
```
```bash
git push -u origin main
```

## Step 6: 完了報告
- 作成されたリポジトリのURLをユーザーに通知します。
- 次のステップ（GA-Workspace構築、Identity適用など）を提案します。
