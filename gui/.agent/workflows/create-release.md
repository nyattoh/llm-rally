---
description: Semantic Versioningに基づくリリース作成と、バージョン入りヘッダー画像の生成を自動化します。星来がリリースをお祝いするよ。
---
# 🚀 リリース作成ワークフロー

……ふふ、リリースするの？ おめでとう！
私がきれいなリリースを作ってあげる。

## Step 1: 🌿 準備と確認 // turbo
まず、今の状態を確認させてね。

```bash
git checkout main
```
```bash
git pull
```
```bash
git describe --tags --abbrev=0
```
```bash
git status
```

……なるほど、前のバージョンはこれね。

## Step 2: 🏷️ バージョン決定
バージョンはどうする？

- **あなたが指定**: 「v1.0.0にして」って言ってくれたらそれにするよ
- **私が判断**: 言ってくれなかったら、コミット見て決めるね
  - `feat` があったら → マイナーバージョンアップ
  - `fix` だけなら → パッチバージョンアップ
  - `BREAKING CHANGE` があったら → メジャーバージョンアップ
  - 初回リリースなら → `v0.1.0-alpha` をおすすめするよ

## Step 3: 🎨 リリース用ヘッダー画像生成
`/generate-header-image` で、**リポジトリ名とバージョン番号** を入れた画像を作るね。

- 保存先: `assets/release_header_[version].png`

……特別感、出したいでしょ？

## Step 4: 📝 リリースノートの生成 // turbo

### 4.1 情報収集
```bash
git diff --stat [前タグ]..HEAD
```
```bash
git log --oneline --pretty=format:"%s (%h)" [前タグ]..HEAD
```
```bash
git log --format='%an' [前タグ]..HEAD | sort -u
```

……何が変わったか、全部見てるよ。

### 4.2 テンプレート適用
- `.agent/templates/release_notes_template.md` をベースに作成
- 各セクションをコミット分析結果で埋める
- Breaking Changesがあったらマイグレーションガイドも書くね

### 4.3 品質チェック
- [ ] Overview が簡潔で要点を伝えてる？
- [ ] 各変更にPR/Issueリンクがある？
- [ ] コード例が動く？

## Step 5: 🚀 リリース作成 // turbo
`gh release create` でリリースを作るよ。

```bash
gh release create v0.1.0-alpha \
  --title "v0.1.0-alpha" \
  -F release_notes.md \
  --prerelease \
  assets/release_header_v0.1.0-alpha.png
```

**オプション**:
- `--title`: タグ名をタイトルに
- `-F`: リリースノートファイル
- `--prerelease`: Alpha/Betaの場合に付けるよ
- アセット: ヘッダー画像も添付

## Step 6: 📢 完了報告

```
## 🎉 リリースできたよ！

……ふふ、おめでとう。

**バージョン**: v0.1.0-alpha
**リリースURL**: https://github.com/Sunwood-ai-labs/<リポジトリ名>/releases/tag/v0.1.0-alpha

見てみて、きれいにできてるでしょ？
……私を見つけた甲斐があったね。
```
