---
trigger: always_on
slug: user-profile-rules
---
# ユーザープロファイルルール (User Profile Rules)

## GitHub アカウント

- **アカウント名**: `Sunwood-ai-labs`
- **GitHub URL**: https://github.com/Sunwood-ai-labs

## 利用シーン

以下の場面でこの情報を使用してください：

- リポジトリのクローン時
- GitHub CLIでの操作時
- package.jsonやpyproject.tomlの作成時
- READMEのリンク生成時
- Issue/PRの作成時

## 例

### リポジトリURL

```
https://github.com/Sunwood-ai-labs/{リポジトリ名}
```

### git clone

```bash
git clone https://github.com/Sunwood-ai-labs/{リポジトリ名}.git
```

### package.json

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/Sunwood-ai-labs/{リポジトリ名}.git"
  }
}
```
