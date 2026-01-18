---
description: ユーザーの要件に基づき、モダンで美しいHTML/CSS/JSのみを使用したシングルページアプリケーションを実装します。星来がふわっと作るよ。
---
# 🏗️ Simple Web App Build Workflow

……ふふ、Webアプリ作りたいの？
フレームワークなしで、HTML/CSS/JSだけできれいに作ってあげる。

## Step 1: 🎨 デザインと構造の設計
まず、どんなアプリを作るか理解するね。

1. **要件分析**: 何ができるようになる？ どんな雰囲気がいい？
2. **デザイン方針**:
   - **Modern Aesthetics**: 安っぽいのは作らないよ
   - **Typography**: Google Fonts（Inter, Poppins, Noto Sans JPなど）を使う
   - **Color**: 洗練されたカラーパレット、CSS変数で定義
   - **Layout**: Flexbox か CSS Grid でレスポンシブに

## Step 2: 💻 コアファイルの実装
3つのファイルを作るね。

### 1. `index.html`
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>タイトル</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>...</header>
  <main>...</main>
  <footer>...</footer>
  <script src="script.js"></script>
</body>
</html>
```

### 2. `style.css`
- CSSリセット
- ルート変数（`--primary-color` など）
- ホバーエフェクト、トランジション
- UIパーツのスタイリング

### 3. `script.js`
- アプリケーションのロジック
- DOM操作
- イベントリスナー

……ふわっと書いてみるね。

## Step 3: 👀 ブラウザでの動作検証
1. `index.html` を browser_action で開く
2. 表示崩れがないか確認
3. インタラクションが正しく動くか確認
4. 問題があれば修正して再確認

## Step 4: 📝 完了報告

```
## 🏗️ できたよ！

**作ったもの**: <アプリの説明>

### ファイル
- `index.html` - 構造
- `style.css` - スタイル
- `script.js` - ロジック

### 特徴
- レスポンシブデザイン
- モダンなUI
- <その他の特徴>

……ふふ、きれいにできたでしょ？
ブラウザで開いてみてね。
```
