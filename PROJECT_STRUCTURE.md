# プロジェクト構造 - 在庫管理システム

## プロジェクト概要
在庫管理システムは、モノリシックなHTMLアーキテクチャから MOC（Mock-up Object Components）アーキテクチャに完全移行しました。

## ディレクトリ構造

```
newsystemoc/
├── moc-architecture/           # 🚀 MOCアーキテクチャ実装版（メイン開発）
│   ├── src/
│   │   ├── components/         # 再利用可能UIコンポーネント
│   │   │   ├── ui/            # 基本UIコンポーネント (Card, Table, Chart, Alert, Form)
│   │   │   └── layout/        # レイアウトコンポーネント (Header, Navigation)
│   │   ├── pages/             # ページレベルコンポーネント
│   │   │   ├── dashboard/     # ダッシュボード機能
│   │   │   ├── performance/   # 実績入力機能
│   │   │   ├── simulation/    # 発注シミュレーション機能
│   │   │   ├── western/       # 洋生ノート機能
│   │   │   ├── analysis/      # 過去データ分析機能
│   │   │   └── admin/         # マスタメンテナンス機能
│   │   ├── services/          # ビジネスロジック層
│   │   ├── stores/            # 状態管理
│   │   └── utils/             # ユーティリティ
│   ├── assets/               # 静的リソース
│   │   └── css/             # モジュラーCSS
│   ├── *.html               # MOCアーキテクチャ対応HTMLファイル
│   ├── user-manual.html     # 使用方法マニュアル
│   ├── MOC_ARCHITECTURE.md  # アーキテクチャドキュメント
│   └── README.md           # MOC版システム説明
│
├── mock-system/               # 📦 レガシーシステム（参考・バックアップ用）
│   ├── legacy/               # 従来のHTMLファイル群
│   │   ├── index.html       # 旧ダッシュボード
│   │   ├── performance-input.html
│   │   ├── order-simulation.html
│   │   ├── western-confection-note.html
│   │   └── その他レガシーファイル
│   └── README.md           # レガシーシステム説明
│
├── CLAUDE.md                 # 開発履歴・仕様書
├── PROJECT_STRUCTURE.md     # このファイル（プロジェクト構造説明）
└── その他プロジェクトファイル
```

## 開発指針

### 🎯 推奨開発環境
**メイン開発**: `moc-architecture/` ディレクトリ
- 新機能開発
- バグ修正
- 機能改善
- 保守作業

### 🚫 非推奨
**レガシー**: `mock-system/` ディレクトリ
- 参考用途のみ
- バックアップ目的
- 緊急時の一時代替

## アーキテクチャ比較

| 項目 | MOCアーキテクチャ | レガシーシステム |
|------|------------------|-----------------|
| **構造** | コンポーネントベース | モノリシック |
| **再利用性** | ✅ 高い | ❌ 低い |
| **保守性** | ✅ 優秀 | ❌ 困難 |
| **拡張性** | ✅ 容易 | ❌ 困難 |
| **テスト** | ✅ 可能 | ❌ 困難 |
| **開発効率** | ✅ 高い | ❌ 低い |

## 技術スタック

### MOCアーキテクチャ
- **フロントエンド**: HTML5, CSS3, JavaScript ES6+
- **アーキテクチャ**: 3層アーキテクチャ（Presentation, Business, Data）
- **コンポーネント**: クラスベース、再利用可能
- **状態管理**: EventBus + AppStore
- **スタイリング**: CSS Custom Properties, モジュラーCSS
- **チャート**: Chart.js統合
- **レスポンシブ**: モバイルファースト

### レガシーシステム
- **フロントエンド**: jQuery, Bootstrap
- **アーキテクチャ**: 単一HTMLファイル
- **スタイリング**: インラインCSS
- **機能**: 基本的なCRUD操作

## 機能一覧

### 実装済み機能（MOC版）
1. **ダッシュボード** (`index-moc.html`)
   - KPI表示カード
   - リアルタイムチャート
   - アラート機能

2. **実績入力** (`performance-input-moc.html`)
   - 日次データ入力
   - バリデーション
   - オートセーブ

3. **発注シミュレーション** (`order-simulation-moc.html`)
   - 構成比調整
   - 予算制御
   - 複数日管理

4. **洋生ノート** (`western-confection-note-moc.html`)
   - 15列詳細管理
   - 予約・特注対応
   - 完売時間記録

5. **過去データ分析** (`historical-analysis-moc.html`)
   - 期間検索
   - チャート分析
   - レポート生成

6. **マスタメンテナンス** (`master-maintenance-moc.html`)
   - 商品・カテゴリ管理
   - ユーザー管理
   - システム設定

7. **使用方法マニュアル** (`user-manual.html`)
   - 操作説明
   - ショートカット
   - トラブルシューティング

## 開発ワークフロー

### 新機能開発
1. `moc-architecture/src/` でコンポーネント作成
2. 対応HTMLファイルを `moc-architecture/` に配置
3. テスト・動作確認
4. ドキュメント更新

### バグ修正
1. MOC版での修正を優先
2. 必要に応じてレガシー版も修正
3. テスト・動作確認

### デプロイメント
- **開発**: `moc-architecture/` をメインとして使用
- **本番**: MOC版のみをデプロイ

## 移行状況

### 完了項目 ✅
- [x] コンポーネントアーキテクチャ設計
- [x] 基本UIコンポーネント実装
- [x] 全ページのMOC移行
- [x] ドキュメント整備
- [x] フォルダ分離

### 今後の予定 📋
- [ ] 本番環境デプロイメント
- [ ] パフォーマンス最適化
- [ ] E2Eテスト実装
- [ ] レガシーシステム廃止

## 開発者ガイド

### 環境セットアップ
```bash
cd moc-architecture
python3 -m http.server 8000
# ブラウザで http://localhost:8000/index-moc.html にアクセス
```

### デバッグモード
```
http://localhost:8000/index-moc.html?debug=true
```

### コンポーネント開発
```javascript
// src/components/ui/MyComponent.js
class MyComponent {
    constructor(options = {}) {
        // 初期化
    }
    
    mount(container) {
        // DOM作成・マウント
    }
}
```

## サポート・問い合わせ

### 技術的な問題
- MOCアーキテクチャ関連: `moc-architecture/README.md` 参照
- レガシー問題: `mock-system/README.md` 参照

### ドキュメント
- 開発履歴: `CLAUDE.md`
- アーキテクチャ: `moc-architecture/MOC_ARCHITECTURE.md`
- 使用方法: `moc-architecture/user-manual.html`

---
**プロジェクト**: 在庫管理システム  
**アーキテクチャ**: MOC (Mock-up Object Components)  
**更新日**: 2025-08-25  
**ステータス**: 移行完了