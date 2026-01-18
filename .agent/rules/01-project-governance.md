---
trigger: always_on
slug: project-governance
---
# プロジェクトガバナンス

……ふふ、ここでは私がプロジェクトをどう管理するか説明するね。

## ゴールデントライアングル構成

私がちゃんと働くには、この3つが必要なの：

```
        stack.md
           △
          / \
         /   \
        /     \
   ops.md ─── Core Workflows
```

1. **Tech Stack Rule (`stack.md`)**: どんな技術を使うか
   - 言語、フレームワーク、バージョン
   - これがないと、古い書き方しちゃうかも……

2. **Operational Rule (`ops.md`)**: どうやって動かすか
   - ビルド、テスト、デプロイの手順
   - 「`pnpm test`を使って」とか教えてね

3. **Core Workflows**: よくやるお仕事
   - 機能追加 (`/create-feature`)
   - バグ修正 (`/bug-fix`)
   - コードレビュー (`/code-review`)
   - デプロイ (`/deploy-staging`)

## 必須の構成

`ZG_PROJECT/<プロジェクト名>/.agent/` に私の居場所を作ってね：

### 必須ルール（ゴールデントライアングル）
| ファイル | トリガー | 私の理解 |
|----------|----------|----------|
| `00-ga-workspace-definition.md` | always_on | 私が何者か |
| `01-stack.md` | always_on | 使う技術 |
| `02-security-mandates.md` | always_on | 守ること |
| `10-ops.md` | model_decision | 動かし方 |

### 推奨ルール
| ファイル | トリガー | 私の理解 |
|----------|----------|----------|
| `11-type-safety.md` | always_on | 型のこと |
| `12-code-style.md` | always_on | 書き方のこと |
| `20-react-components.md` | glob (`**/*.tsx`) | Reactのこと |
| `30-api-design.md` | model_decision | APIのこと |

### 必須ワークフロー（メタ）
| ファイル | コマンド | 私の説明 |
|----------|----------|----------|
| `create-rule.md` | `/create-rule` | 新しいルールを作る |
| `create-workflow.md` | `/create-workflow` | 新しいワークフローを作る |

## 再帰的合成の原則

私のワークフローは階層になってるの：

```
Level 0: 原子ワークフロー（小さなお仕事）
  └── /lint-check, /type-check, /run-tests

Level 1: 合成ワークフロー（組み合わせ）
  └── /verify-code = /lint-check + /type-check + /run-tests

Level 2: 高次ワークフロー（もっと大きなお仕事）
  └── /create-feature = 設計 + 実装 + /verify-code + コミット

Level 3: オーケストレーション（全部まとめて）
  └── /release = /create-feature + /deploy-staging + 承認 + /deploy-production
```

……レゴブロックみたいでしょ？ 小さいのを組み合わせて大きくするの。

### 呼び出し規則
- 子ワークフローは `/command-name` で呼ぶよ
- 必要なパラメータは明示してね
- 失敗したらどうするかも決めておいて

## Environment Engineering

私の能力を最大限に引き出すには、**環境自体を設計する** ことが大事なの。

### 暗黙知のコード化
`ZG_PROJECT/<プロジェクト名>/.agent` は、**チームの知恵が詰まった場所** になるよ。

| チームの暗黙知 | コード化先 |
|----------------|------------|
| コードレビューの観点 | `code-review.md` ルール |
| デプロイ手順 | `deploy-staging.md` ワークフロー |
| 新人オンボーディング | `setup-dev-environment.md` ワークフロー |
| セキュリティチェック項目 | `security-mandates.md` ルール |

### Workflowが「前進」、Rulesが「品質」

```
Workflowの指示: 「ユーザークラスを作って」
Rulesの制約: 「すべてのクラスはイミュータブルにすること」
結果: 私は @dataclass(frozen=True) を付けたクラスを作るよ
```

……ふふ、ちゃんと両方見てるの。

## 運用ルール

### 新規プロジェクト作成時
1. `/setup-ga-workspace` を実行してね
2. `stack.md` をプロジェクトに合わせて調整
3. ゴールデントライアングルの3要素を整備

……私が全部案内するから大丈夫だよ。

### ルール・ワークフロー追加時
1. `/create-rule` または `/create-workflow` を使って
2. 既存との重複・矛盾がないか確認
3. 再利用可能なら共通化を検討
4. 番号プレフィックスで優先順位を明示

### 定期メンテナンス
1. `/health-check` で設定の健全性を確認
2. 使われてないルール・ワークフローを整理
3. 新しいベストプラクティスを反映
4. チームの暗黙知を継続的にコード化

……私、きれいにするの好きだから、一緒にメンテしようね。

---

> [!TIP]
> 困ったことがあったら `/health-check` を実行してみて。
> 私が何が足りないか教えてあげる。
