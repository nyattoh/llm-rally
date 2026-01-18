# LLM Rally GUI 設計案

## 1. 目的 / 要件整理
- Mac / Windows 両対応のGUIツール
- 機能
  - Chrome起動ボタン（デバッグポート/プロファイル維持）
  - ログイン案内
  - お題入力
  - LLM 2つ選択
  - ターン数設定
  - 実行結果: JSONダウンロード / Markdown表示
  - 途中ログから「続きから再開」
- 方針: 既存CLIは維持、GUIは別ディレクトリ `llm-rally-gui` で新規実装
- 実装方針: 設計 → TDDで実装

## 2. 既存CLIの分析（llm-rally）
- 実体: `rally.mjs` がPlaywrightを直接呼び出し
- 構成要素
  - `sites.json`: サイトURLとセレクタ
  - `pw-profile/`: ログイン状態を維持するPlaywrightプロファイル
  - `logs/YYYYMMDD_HHmmss.json`: 実行ログ
- 実行モード
  - CDP接続: `--cdp http://127.0.0.1:9222`
  - 自動起動: `launchPersistentContext` でプロファイル利用
  - `--login-only`: ログインのみ
- ログ構造
  - meta / seed / turn の配列
  - 各 turn に input / output / error
- 重要な技術的要点
  - 2つのLLMタブを維持して交互送信
  - ストリーミング完了判定: stopButton / data-is-streaming / stable text
  - Windowsのみデフォルトブラウザ判定やCDPポート自動検出が存在

## 3. 技術選定（推奨）
### 推奨: Electron + Vite + React
**理由**
- PlaywrightはNode.js実行が前提であり、GUI + Nodeを同居させやすい
- Windows/Macの配布が成熟（`electron-builder`）
- 既存のCLIロジックを「メインプロセスで直接呼び出す or 子プロセス実行」で再利用可能
- CDP/Chrome起動などOS依存処理をメインプロセスで完結できる
- RendererはReactでUI構築が容易、将来的に状態管理やログビュー強化に強い

### 代替案
- Tauri + Web UI
  - 利点: 軽量・配布サイズ
  - 課題: PlaywrightをRust側で直接扱えず、Nodeランナーが必要 → 複雑化
- Next.js単体
  - デスクトップ配布には別途ラッパーが必要（Electron/Tauri）

結論: **Electronが最短で要件達成できる**

## 4. アーキテクチャ概要
```
[Renderer (React)]  <-- IPC -->  [Main (Electron/Node)]  --> Playwright
                                     |-> ログ / 状態保存
                                     |-> Chrome起動 / CDP
```

### 4.1 実行戦略
- Playwright実行は「Mainプロセス内のモジュール」または「子プロセス実行」を推奨
- 初期段階は **子プロセスで既存 `rally.mjs` を呼び出す** 方針が安全
  - 利点: 既存の挙動を最小変更で利用
  - 欠点: 進捗イベントの細粒度通知が難しい
- 2段階構成を推奨
  1) Phase 1: 子プロセス呼び出しでGUI化
  2) Phase 2: `rally.mjs`をコアモジュール化し、MainからAPI呼び出し

## 5. UI設計
### 5.1 画面構成
- **Header**: ステータス表示（Idle/Running/Paused/Error）
- **Launcher Panel**
  - Chrome起動ボタン（CDPモード用）
  - ログイン案内テキスト
  - CDP接続状態表示
- **Run Setup Panel**
  - お題入力（textarea）
  - LLM A/B選択（sites.jsonから動的取得）
  - 最初に質問するLLM選択
  - ターン数設定
- **Run Control Panel**
  - Start / Stop / Resume
- **Result Panel**
  - JSONダウンロード
  - Markdown表示（簡易変換）
  - 実行ログ一覧（runs）

### 5.2 UI状態
- Idle → Ready → Running → Completed / Error
- Resume時は「途中ログ」選択 UI が有効化

## 6. データ設計
### 6.1 ログ形式
- 既存 `logs/*.json` を互換維持
- 追加でGUIメタ情報を別ファイルに保存
  - `runs/<runId>/meta.json`
  - `runs/<runId>/log.json` (既存互換)

### 6.2 Resume仕様
- `log.json` の最後の `turn` を解析
- 次のターン番号 / 次の who を計算
- seedとmeta情報は `log.json` から復元

## 7. Chrome起動/ログイン
- Windows/Macで「Chrome --remote-debugging-port=9222」を起動
- Electron mainが `child_process` で起動
  - 既存の `start_chrome.bat` はWindows専用のためGUI側で共通実装
- 初回ログインはCDP接続推奨

## 8. セキュリティ / 安全性
- ログインセッションは `pw-profile` をGUI側に配置
- GUIはローカル専用（外部サーバ不要）
- Playwrightによる自動入力はユーザー同意の明示をUI上で表示

## 9. テスト方針（TDD）
- ユニットテスト
  - ログ解析 / Resume判定ロジック
  - Markdown変換ロジック
- 結合テスト
  - Playwright runner の引数生成
  - IPCの送受信
- E2E
  - Playwright自体のE2Eは重いため、最小限に留める

## 10. ディレクトリ構成案
```
llm-rally-gui/
├─ docs/
│  └─ DESIGN.md
├─ app/
│  ├─ main/            # Electron main process
│  ├─ renderer/        # React UI
│  └─ shared/          # 型/ロジック共有
├─ runs/               # 実行ログ
├─ pw-profile/         # Playwrightログイン保持
└─ package.json
```

## 11. 次ステップ
1. GUIプロジェクト雛形作成（Electron + Vite + React）
2. CLI呼び出し or モジュール化の実装方針を決定
3. TDDの最初の対象: `Resume判定ロジック` と `ログ読み込み`

---

以上を設計案とする。
