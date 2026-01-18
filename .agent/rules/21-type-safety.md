---
trigger: always_on
slug: type-safety
description: TypeScriptコードにおける型定義の厳格な基準を強制する。
---
# 型安全性基準 (Type Safety Standards)

このプロジェクトで生成または修正されるすべてのTypeScriptコードは、以下の基準を満たすこと。

## 必須事項 (MUST)

### 1. 完全な型アノテーション
すべての関数シグネチャに型注釈を付与すること。

```typescript
// ✅ 正しい例
function calculateTotal(items: Item[], taxRate: number): number {
  return items.reduce((sum, item) => sum + item.price, 0) * (1 + taxRate);
}

// ❌ 間違った例
function calculateTotal(items, taxRate) {
  return items.reduce((sum, item) => sum + item.price, 0) * (1 + taxRate);
}
```

### 2. any型の禁止
`any` 型の使用は原則禁止。代わりに `unknown` を使用し、型ガードで絞り込むこと。

```typescript
// ✅ 正しい例
function processData(data: unknown): string {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
  throw new Error('Expected string');
}

// ❌ 間違った例
function processData(data: any): string {
  return data.toUpperCase();
}
```

### 3. Strict Mode
`tsconfig.json` で以下を設定すること：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true
  }
}
```

### 4. Non-null Assertion の制限
`!` 演算子（Non-null Assertion）の使用は避け、適切なnullチェックを行うこと。

```typescript
// ✅ 正しい例
const element = document.getElementById('app');
if (element) {
  element.textContent = 'Hello';
}

// ❌ 避けるべき例
const element = document.getElementById('app')!;
element.textContent = 'Hello';
```

## 推奨事項 (SHOULD)

### 型エイリアスとインターフェース
- オブジェクトの形状定義には `interface` を使用
- ユニオン型や複雑な型には `type` を使用

### ジェネリクスの活用
再利用可能なコンポーネントや関数にはジェネリクスを活用すること。

### 型のエクスポート
他のモジュールから使用される型は明示的にエクスポートすること。
