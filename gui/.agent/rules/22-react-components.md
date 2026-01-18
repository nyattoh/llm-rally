---
trigger: glob
globs:
  - "**/*.tsx"
  - "**/*.jsx"
slug: react-components
description: Reactコンポーネントファイルに対して適用されるルール。
---
# Reactコンポーネント規約 (React Components Guidelines)

`.tsx` または `.jsx` ファイルを編集する際に自動的に適用される。

## コンポーネント構造

### ファイル構成
- 1ファイル = 1コンポーネント（原則）
- ファイル名はコンポーネント名と一致させる（PascalCase）
- `index.tsx` でのバレルエクスポートは許可

### Props型定義
```typescript
// ✅ 正しい例: Props型を明示的に定義
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, disabled }) => {
  // ...
};

// ❌ 間違った例: インライン型定義
export const Button = ({ label, onClick }: { label: string; onClick: () => void }) => {
  // ...
};
```

### エクスポート
- 名前付きエクスポートを優先
- デフォルトエクスポートはページコンポーネントのみに使用

## Hooks

### カスタムフック
- `use` プレフィックスを必ず付ける
- 単一責任の原則に従う
- 戻り値の型を明示する

```typescript
// ✅ 正しい例
function useUser(id: string): { user: User | null; loading: boolean } {
  // ...
}
```

### useEffect
- 依存配列は正確に指定する
- クリーンアップ関数を適切に実装する
- 副作用は `useEffect` に集約する

```typescript
// ✅ 正しい例
useEffect(() => {
  const subscription = api.subscribe(id);
  return () => subscription.unsubscribe();
}, [id]); // 依存配列を正確に
```

## スタイリング

### Tailwind CSS
- ユーティリティクラスを優先使用
- 複雑なスタイルは `@apply` でコンポーネント化
- インラインスタイルは避ける

```tsx
// ✅ 正しい例
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Click me
</button>

// ❌ 間違った例
<button style={{ padding: '8px 16px', backgroundColor: 'blue' }}>
  Click me
</button>
```

## パフォーマンス

### メモ化
- 重い計算には `useMemo` を使用
- コールバックには `useCallback` を使用
- 不要な再レンダリングを防ぐ

### 条件付きレンダリング
```tsx
// ✅ 正しい例: 早期リターン
if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <Content data={data} />;
```

## アクセシビリティ

- インタラクティブ要素には適切なARIA属性を付与
- 画像には `alt` テキストを必須
- キーボードナビゲーションをサポート
