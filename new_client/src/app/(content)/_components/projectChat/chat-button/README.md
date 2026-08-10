# NeuralButtonGroup

Figmaデザインに基づいて実装された、パルス効果付きのアニメーションボタンコンポーネントです。

## 特徴

- **パルスアニメーション**: 複数の円形レイヤーが重なって美しいパルス効果を演出
- **レスポンシブ対応**: モバイルデバイスでも適切に表示
- **アクセシビリティ対応**: キーボードナビゲーション、スクリーンリーダー対応
- **カスタマイズ可能**: サイズ、アニメーションの有効/無効を設定可能
- **TypeScript対応**: 完全な型安全性を提供

## 使用方法

```tsx
import { NeuralButtonGroup } from '@/entities/projectChat/chat-button';

function MyComponent() {
  const handleChatClick = () => {
    console.log('チャットボタンがクリックされました');
  };

  return (
    <NeuralButtonGroup
      onClick={handleChatClick}
      size={100}
      animated={true}
      ariaLabel="チャットを開始"
      title="チャットを開始"
    />
  );
}
```

## Props

| プロパティ | 型 | デフォルト値 | 説明 |
|-----------|----|-----------|----|
| `onClick` | `() => void` | - | ボタンクリック時のコールバック関数 |
| `size` | `number` | `100` | ボタンのサイズ（px） |
| `animated` | `boolean` | `true` | アニメーションの有効/無効 |
| `disabled` | `boolean` | `false` | ボタンの無効化状態 |
| `className` | `string` | - | 追加のCSSクラス名 |
| `ariaLabel` | `string` | `'チャットボタン'` | アクセシビリティ用のラベル |
| `title` | `string` | `'チャットを開始'` | ボタンのタイトル属性 |
| `isOpen` | `boolean` | `false` | ProjectChatが開いた状態かどうか |

## アニメーション

コンポーネントは以下のアニメーション効果を含みます：

1. **外側パルスレイヤー（赤）**: 2秒周期でスケール変化
2. **第2パルスレイヤー（緑）**: 0.5秒遅延で2秒周期
3. **第3パルスレイヤー（青）**: 1秒遅延で2秒周期
4. **ホバー効果**: マウスオーバー時のスケール変化
5. **アクティブ効果**: クリック時のスケール変化

## アクセシビリティ

- `aria-label`属性によるスクリーンリーダー対応
- `aria-pressed`属性による状態表示
- キーボードナビゲーション対応（Tab、Enter、Space）
- `prefers-reduced-motion`メディアクエリによるアニメーション軽減対応

## レスポンシブ対応

- デスクトップ: 100px × 100px
- モバイル（768px以下）: 80px × 80px
- アイコンサイズも自動調整

## ブラウザサポート

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
