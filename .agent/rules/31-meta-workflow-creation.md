---
trigger: model_decision
description: 新しいワークフローの作成、タスク自動化の設計、作業手順書の定義について言及された場合に適用する。
slug: meta-workflow-creation
---
# ワークフロー作成ガイドライン (Workflow Creation Guidelines)

ユーザーの指示から `.agent/workflows/` 配下のワークフローファイルを作成する際は、以下のガイドラインに従うこと。

## ワークフローの本質

ワークフローは **エージェントの「標準作業手順書（SOP）」** である。特定のタスクを達成するための軌道と操作ロジック（どのように動くか）を命令的に記述する。

実行時、Agent Manager（Mission Control）はワークフローを **Task Nodes（タスクノード）** に分解し、Manager Viewで可視化する。各ノードは Pending → In Progress → Completed/Failed の状態遷移を持つ。

## ファイル構造

```markdown
---
description: <ワークフローの目的を1-2文で説明>
---
# <ワークフロー名>

## Step 1: <ステップ名>
<具体的な指示>

## Step 2: <ステップ名> // turbo
<具体的な指示>
```

## description の書き方

ワークフローの `description` は、ユーザーがコマンド一覧を見たときの説明文となる。

```yaml
# 良い例
description: 指定されたファイルに対して単体テストを自動生成し、実行・検証まで行う。

# 悪い例
description: テスト生成
```

## ステップの書き方

### 命令形で書く
エージェントへの指示は命令形で明確に記述する。

```markdown
# 良い例
対象ファイルを読み込み、すべてのパブリック関数を特定せよ。

# 悪い例
対象ファイルを読み込んで、パブリック関数を特定します。
```

### 具体的な出力を指定する
```markdown
# 良い例
分析結果を以下の形式でユーザーに提示せよ：
- 関数名
- 引数と戻り値の型
- 想定されるエッジケース

# 悪い例
分析結果を報告せよ。
```

### 条件分岐を明記する
```markdown
## Step 3: 検証
テストを実行せよ。
- **成功した場合**: Step 4に進む
- **失敗した場合**: エラーログを分析し、修正を試みる。最大3回まで再実行。
```

### ループの終了条件を明記する
```markdown
テストが通るまで修正と再実行を繰り返せ。
**終了条件**: 成功、または最大3回の試行
```

## Turbo Mode アノテーション

### `// turbo`（単一ステップ）
ステップに `// turbo` を付けると、ユーザー承認なしで実行される。

```markdown
## Step 5: テスト実行 // turbo
pnpm test を実行せよ。

## Step 6: デプロイ
# turboを付けない - ユーザー承認が必要
ユーザーの承認を得てからデプロイを実行せよ。
```

### `// turbo-all`（ワークフロー全体）
ワークフローのタイトルに `// turbo-all` を付けると、全ステップが自動実行される。

```markdown
---
description: コード品質を自動検証する
---
# 自動コード検証 // turbo-all

## Step 1: Lint
pnpm lint を実行せよ。

## Step 2: 型チェック
pnpm typecheck を実行せよ。

## Step 3: テスト
pnpm test を実行せよ。
```

### Turbo適用の判断基準

| 操作 | Turbo適用 | 理由 |
|------|-----------|------|
| `git status`, `ls`, `cat` | ✅ 可 | 読み取り専用 |
| `pnpm test`, `pytest` | ✅ 可 | 安全なテスト実行 |
| `pnpm lint`, `tsc --noEmit` | ✅ 可 | 静的解析 |
| `pnpm build` | ✅ 可 | ビルド（破壊的でない） |
| `rm -rf`, ファイル削除 | ❌ 不可 | 破壊的操作 |
| `git push`, `git merge` | ❌ 不可 | リモートへの影響 |
| デプロイ操作 | ❌ 不可 | 本番環境への影響 |
| 課金が発生する操作 | ❌ 不可 | コストリスク |

## ツール連携

### run_command（シェルコマンド実行）
ターミナルでコマンドを実行する際は `run_command` を使用：

```markdown
## Step: ビルド // turbo
run_command を使用してビルドを実行せよ：
\`\`\`bash
pnpm build
\`\`\`

エラー出力を解析し、必要に応じて自己修復ループを実行せよ。
```

### browser_action（ブラウザ操作）
Browser Subagentを使用してUIを検証する際は `browser_action` を使用：

```markdown
## Step: UI検証
browser_action を使用して以下を実行せよ：
1. http://localhost:3000 へ遷移
2. "Sign Up" ボタンをクリック
3. モーダルウィンドウが表示されることを確認
4. スクリーンショットを撮影して保存
5. コンソールログを取得

**Assert**: モーダルが表示されていない場合、タスクを「失敗」としてマーク
```

## 再帰的合成（Recursive Composition）

複雑なワークフローは小さなワークフローに分割し、呼び出す形にする。これにより「エージェント・スキル」のライブラリを構築できる。

```markdown
## Step 3: コード検証
コードの健全性を検証せよ。
- コマンド: `/verify-code`
- 失敗時: 問題箇所を修正してから再実行

## Step 4: UI検証
UIの動作確認を行え。
- コマンド: `/ui-verification`
- 失敗時: ユーザーに報告
```

### 呼び出し規則
- 子ワークフローは `/command-name` 形式で呼び出す
- 必要なパラメータを明示する
- 子の失敗時の挙動（続行/中断）を明記する

## 並列実行（Parallelism）

独立したタスクは並列実行を指示できる。Agent Managerが複数のサブエージェント（Sub-Agents）を起動し、メインエージェントが「オーケストレーター」として監督する。

```markdown
## Step 3: プラットフォーム別ビルド（並列実行）
以下のタスクを並列で実行せよ：

### Task A: iOS ビルド
`pnpm build:ios` を実行

### Task B: Android ビルド  
`pnpm build:android` を実行

### Task C: Web ビルド
`pnpm build:web` を実行

**同期ポイント**: すべてのビルドが完了したら次のステップに進む
```

### 役割分担パターン
並列実行の応用として、Researcher Agent と Coder Agent の役割分担が有効：

```markdown
## Step 2: 調査と実装（並列実行）

### Researcher Agent
Stripe V3 APIのドキュメントを検索し、決済フローの実装に必要な情報を要約せよ。

### Coder Agent
Researcherが作成した要約に基づき、決済処理を実装せよ。

**依存関係**: Coder は Researcher の完了を待つ
```

## ワークフローの階層構造

```
Level 0: 原子ワークフロー（単一の操作）
  └── /lint-check, /type-check, /run-tests

Level 1: 合成ワークフロー（原子の組み合わせ）
  └── /verify-code = /lint-check + /type-check + /run-tests

Level 2: 高次ワークフロー（合成の組み合わせ）
  └── /create-feature = 設計 + 実装 + /verify-code + コミット

Level 3: オーケストレーション（複数の高次を統合）
  └── /release = /create-feature + /deploy-staging + 承認 + /deploy-production
```

## ワークフローの粒度

| 規模 | ステップ数 | 例 |
|------|------------|-----|
| 小 | 3-5 | Lint実行、単一ファイルの修正 |
| 中 | 5-10 | 機能追加、バグ修正 |
| 大 | 10-15 | 大規模リファクタリング、リリース作業 |

**15ステップを超える場合は分割を検討すること。**

## 命名規則

- ファイル名: `<動詞>-<対象>.md` （ケバブケース）
- ファイル名がそのままコマンド名となる（`/deploy-staging`）

例:
- `generate-unit-tests.md` → `/generate-unit-tests`
- `create-feature.md` → `/create-feature`
- `verify-code.md` → `/verify-code`

## エラーハンドリング

各ステップで起こりうるエラーと対処法を記載する。

```markdown
## Step 4: ビルド // turbo
run_command で pnpm build を実行せよ。

**エラー時の対処**:
- 型エラー: エラーメッセージを分析し、該当ファイルを修正（自己修復ループ）
- 依存関係エラー: `pnpm install` を実行してから再試行
- 最大リトライ: 3回
- リトライ後も失敗: ユーザーに報告してワークフローを中断
```

## 検証ステップの必須化

すべてのワークフローは **検証ステップで終了** させること。Antigravityでは視覚的検証も推奨される。

```markdown
## Final Step: 検証
以下を確認せよ：
- [ ] すべてのテストが通過している
- [ ] Lintエラーがない
- [ ] 型エラーがない
- [ ] browser_action でUIに404エラーが出ていないか確認
- [ ] 期待される動作をしている
```
