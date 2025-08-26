# MOC Architecture - 在庫管理システム

## 概要
このディレクトリには、MOC（Mock-up Object Components）アーキテクチャで実装された在庫管理システムの完全版が含まれています。

## アーキテクチャ概要
- **3層アーキテクチャ**: Presentation層、Business層、Data層
- **コンポーネントベース設計**: 再利用可能なUIコンポーネント
- **イベント駆動通信**: EventBusによるコンポーネント間通信
- **状態管理**: AppStoreによる一元的な状態管理
- **レスポンシブデザイン**: モバイルファーストなUI

## ディレクトリ構造
```
moc-architecture/
├── src/
│   ├── components/          # UIコンポーネント
│   │   ├── ui/             # 基本UIコンポーネント
│   │   └── layout/         # レイアウトコンポーネント
│   ├── pages/              # ページレベルコンポーネント
│   │   ├── dashboard/      # ダッシュボード
│   │   ├── performance/    # 実績入力
│   │   ├── simulation/     # 発注シミュレーション
│   │   ├── western/        # 洋生ノート
│   │   ├── analysis/       # 過去データ分析
│   │   └── admin/          # マスタメンテナンス
│   ├── services/           # ビジネスロジック
│   ├── stores/             # 状態管理
│   └── utils/              # ユーティリティ
├── assets/                 # 静的リソース
│   └── css/               # スタイルシート
├── *.html                 # ページHTML (-moc.html)
├── user-manual.html       # 使用方法マニュアル
└── MOC_ARCHITECTURE.md    # アーキテクチャドキュメント
```

## 実装済み機能

### 1. ダッシュボード (index-moc.html)
- KPI表示カード
- リアルタイムチャート
- アラート機能
- ナビゲーション

### 2. 実績入力 (performance-input-moc.html)
- 日次実績データ入力
- バリデーション機能
- 自動計算
- オートセーブ

### 3. 発注シミュレーション (order-simulation-moc.html)
- 構成比スライダー調整
- 予算制御
- リアルタイム計算
- 複数日予算管理

### 4. 洋生ノート (western-confection-note-moc.html)
- 15列の詳細管理表
- 商品カテゴリ別グループ化
- 予約・特注管理
- 完売時間記録

### 5. 過去データ分析 (historical-analysis-moc.html)
- 期間指定検索
- チャート分析
- CSV出力
- レポート生成

### 6. マスタメンテナンス (master-maintenance-moc.html)
- 商品・カテゴリ・仕入先管理
- ユーザー管理
- システム設定
- CSV入出力

### 7. 使用方法マニュアル (user-manual.html)
- 詳細操作説明
- キーボードショートカット
- トラブルシューティング
- システム概要

## 技術仕様

### フロントエンド技術
- **HTML5/CSS3**: セマンティックなマークアップとモダンCSS
- **JavaScript ES6+**: モジュラーなコンポーネント設計
- **Chart.js**: データ可視化
- **カスタムCSS**: CSS Custom Propertiesとユーティリティファーストデザイン

### アーキテクチャパターン
- **コンポーネントベース**: 再利用可能なUIコンポーネント
- **イベント駆動**: EventBusによる疎結合通信
- **サービス層**: ビジネスロジックの分離
- **ストア/ステート管理**: 一元的な状態管理

### デザインシステム
- **デザイントークン**: CSS Custom Propertiesによる一貫性
- **レスポンシブデザイン**: モバイル、タブレット、デスクトップ対応
- **アクセシビリティ**: WCAG準拠
- **テーマサポート**: ダークモード、高コントラスト対応

## 使用方法

### 1. 開発環境での起動
```bash
# 簡易HTTPサーバーを起動
python3 -m http.server 8000
# または
npx serve .
```

### 2. ブラウザでアクセス
```
http://localhost:8000/index-moc.html
```

### 3. デバッグモード
```
http://localhost:8000/index-moc.html?debug=true
```

## 開発者向け情報

### コンポーネント作成パターン
```javascript
class MyComponent {
    constructor(options = {}) {
        this.options = options;
        this.element = null;
    }
    
    mount(container) {
        // DOM作成とマウント
    }
    
    destroy() {
        // クリーンアップ
    }
}
```

### イベント通信
```javascript
// イベント発火
window.eventBus.emit('component.action', data);

// イベント受信
window.eventBus.on('component.action', (data) => {
    // 処理
});
```

### 状態管理
```javascript
// 状態更新
window.appStore.setState('key', value);

// 状態取得
const value = window.appStore.getState('key');
```

## デプロイメント

### 本番環境
- 静的ホスティング（Netlify、Vercel、GitHub Pages等）
- CDNキャッシュ最適化
- Service Worker対応（オフライン機能）

### パフォーマンス最適化
- CSS/JSの最小化
- 画像最適化
- 遅延読み込み
- キャッシュ戦略

## ライセンス
このプロジェクトは社内用途のため、外部配布は制限されています。

## サポート
技術的な問題や機能要望については、開発チームまでお問い合わせください。

---
**更新日**: 2025-08-25  
**バージョン**: v1.0.0  
**開発者**: Claude Code Assistant