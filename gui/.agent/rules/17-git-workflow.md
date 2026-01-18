---
trigger: model_decision
description: Git操作、コミット、ブランチ作成、マージについて言及された場合に適用する。
slug: git-workflow
---
# Gitワークフロー (Git Workflow)

## ブランチ命名規則
- **機能追加**: `feature/<issue-number>-<short-description>`
- **バグ修正**: `fix/<issue-number>-<short-description>`
- **緊急修正**: `hotfix/<issue-number>-<short-description>`
- **リファクタリング**: `refactor/<short-description>`

## コミットメッセージ (Conventional Commits)
```
<type>(<scope>): <subject>

<body>
```

### Type一覧
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマット等）
- `refactor`: バグ修正でも機能追加でもないコード変更
- `test`: テストの追加・修正
- `chore`: ビルドプロセスや補助ツールの変更

## コミットの粒度
- 1つのコミットには1つの論理的な変更のみを含める
- レビュー可能な小さな単位でコミットすること
