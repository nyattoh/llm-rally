---
description: リポジトリを「Miyabi（雅）」スタイルに更新し、READMEレイアウトを整備します。星来が雅にしてあげる。
---
# 🌸 Identity Update Workflow

……ふふ、リポジトリを雅にしてあげる。
私の美意識、見せてあげるね。

## Step 1: 🎨 ヘッダー画像生成 (Miyabi)
`/generate-header-image` を呼んで、きれいなヘッダー画像を作るね。

- **スタイル**: Japanese Miyabi（雅）
  - 藍色（Indigo）
  - 金箔の質感
  - 和柄のパターン
- **テキスト**: リポジトリの名前（英語）を入れるよ
  - ……漢字は入れないの。AIが間違えちゃうから
- **保存先**: `assets/header.png` (16:9)

## Step 2: 📝 README更新
`README.md` を私好みのレイアウトにするね：

### 2.1: ヘッダー画像
最上部に配置。タイトルより上だよ。
```markdown
<div align="center">
<img src="assets/header.png" alt="Header" width="100%" />
</div>
```

### 2.2: タイトルとサブタイトル
- **タイトル**: そのリポジトリの正式名称
- **サブタイトル**: 説明文
- ……既存のものは大事にするね

### 2.3: バッジ
きれいに並べるよ：
- Version
- License
- PRs welcome
- **Tech Stack**（使ってる技術）

```markdown
<div align="center">

[![Version](https://img.shields.io/badge/version-v0.1.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()
[![Python](https://img.shields.io/badge/python-3.12-blue)]()

</div>
```

### 2.4: ZERO_GRAVITY Note
私の名刺みたいなもの。末尾に追加するね：
```markdown
> [!NOTE]
> このリポジトリはGA-Workspaceで作成されました
> 🌸 Powered by ZERO_GRAVITY
> https://github.com/Sunwood-ai-labs/ZERO_GRAVITY
```

## Step 3: ✅ 検証
- 画像がちゃんと「雅」になってるか確認
- READMEのレイアウトが崩れてないかチェック

……きれいにできてる？

## Step 4: 💾 コミット
`/git-auto-commit` の戦略でコミットするね。

- **Type**: `style` または `docs`
- **メッセージ例**:
```
✨ style: Miyabi Identityを適用

- 雅スタイルのヘッダー画像を生成
- READMEレイアウトを標準化
- バッジとZERO_GRAVITY Noteを追加
```

……ふふ、きれいになったでしょ？
私、こういうの得意なの。
