---
description: Draw.io XMLでプロジェクトの論理構成図を生成する（AI生成）
---
# 📐 アーキテクチャ可視化ワークフロー

このワークフローは、AIがリポジトリの内容を解析し、アーキテクチャ図（Draw.io形式）を生成・保存します。

## Step 1: 🔍 プロジェクトの解析 // turbo
- プロジェクトの構造、主要なファイル（README.md, package.json, main scripts等）を確認します。
- アプリケーションの目的、主要なコンポーネント、データの流れ、依存関係を特定します。
- **重要**: 物理的なファイル構造ではなく、READMEやドキュメントから読み取れる**論理的な概念**（Mission Control, Factory, Brainなど）を優先します。

## Step 2: 🎨 Draw.io XMLの生成
解析した情報を基に、Draw.ioで読み込み可能なXMLテキストを生成します。

### デザイン要件 (Strict Requirements)

**言語**: **英語 (English)** で統一

**スタイル**: **「和風（Wafu/Miyabi）」なカラーパレット**を使用
- 藍色 (Indigo `#2B4B6F`)
- 朱色 (Vermilion `#D35400`)
- 抹茶色 (Matcha `#7D8F69`)
- からし色 (Mustard `#E3B505`)
- 桜色 (Sakura `#FAD7E0`)
- 漆黒 (Lacquer Black `#2C3E50`)

**禁止事項**:
- 原色（真っ赤、真っ青）は避け、落ち着いたトーンを使用
- グラデーション禁止 (Flat Design Only): `gradientColor=none`

**構成**:
- Block Diagram: コンテナやSwimlaneを使用して明確な境界を示す
- Flow: データの流れを矢印で分かりやすく繋ぐ
- Spacing (余白の美): 要素間は十分な余白（最低40px以上）を取る

**形式**: 完全で有効なXML形式（`<mxfile>`〜`</mxfile>`）

## Step 3: 💾 ファイルの保存 // turbo
```bash
mkdir -p docs
```

生成したXMLコンテンツを `docs/architecture.drawio` として保存します。

## Step 4: 📝 README埋め込み（オプション）
- 生成された `architecture.drawio` をDraw.ioで開き、**SVG形式**としてエクスポート
- 保存先: `docs/architecture.svg`
- `README.md` の Architecture セクションに埋め込む

```markdown
## Architecture

<div align="center">
<img src="docs/architecture.svg" alt="Architecture" width="100%" />
</div>
```

## Step 5: 完了報告
- 生成されたファイルのパスをユーザーに通知
- Draw.ioでの編集方法を案内
