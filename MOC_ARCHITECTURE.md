# MOC (Mock-up Object Components) アーキテクチャ設計書

## 概要
在庫管理システムの新しいアーキテクチャ設計書。コンポーネントベースの設計パターンを採用し、保守性・拡張性・再利用性を向上させる。

## アーキテクチャ構成

### レイヤー構造

```
┌─────────────────────────────────────────┐
│          Presentation Layer             │
│    (UI Components / View Templates)     │
├─────────────────────────────────────────┤
│           Business Layer                │
│      (Domain Logic / Services)          │
├─────────────────────────────────────────┤
│            Data Layer                   │
│    (Models / Repository / Storage)      │
└─────────────────────────────────────────┘
```

### ディレクトリ構造案

```
newsystemoc/
├── index.html                    # エントリーポイント
├── src/
│   ├── components/               # 再利用可能コンポーネント
│   │   ├── ui/                   # UI基本コンポーネント
│   │   │   ├── Card.js
│   │   │   ├── Table.js
│   │   │   ├── Chart.js
│   │   │   ├── Form.js
│   │   │   └── Alert.js
│   │   ├── business/             # ビジネスロジックコンポーネント
│   │   │   ├── Dashboard.js
│   │   │   ├── PerformanceInput.js
│   │   │   ├── OrderSimulation.js
│   │   │   ├── WesternConfectionNote.js
│   │   │   └── HistoricalAnalysis.js
│   │   └── layout/               # レイアウトコンポーネント
│   │       ├── Header.js
│   │       ├── Navigation.js
│   │       └── Footer.js
│   ├── services/                 # ビジネスロジック・API
│   │   ├── InventoryService.js
│   │   ├── OrderService.js
│   │   ├── CalculationService.js
│   │   ├── ValidationService.js
│   │   └── ChartService.js
│   ├── models/                   # データモデル
│   │   ├── Product.js
│   │   ├── Inventory.js
│   │   ├── Order.js
│   │   ├── Performance.js
│   │   └── Budget.js
│   ├── stores/                   # 状態管理
│   │   ├── AppStore.js
│   │   ├── InventoryStore.js
│   │   ├── OrderStore.js
│   │   └── PerformanceStore.js
│   ├── utils/                    # ユーティリティ
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   ├── calculators.js
│   │   └── constants.js
│   └── pages/                    # ページ固有ロジック
│       ├── dashboard/
│       ├── performance/
│       ├── simulation/
│       ├── notes/
│       └── history/
├── assets/                       # 静的リソース
│   ├── css/
│   │   ├── base.css             # 基本スタイル
│   │   ├── components.css       # コンポーネントスタイル
│   │   ├── themes.css           # テーマ・色彩設計
│   │   └── responsive.css       # レスポンシブ対応
│   ├── js/
│   │   ├── vendor/              # 外部ライブラリ
│   │   └── polyfills/           # ポリフィル
│   └── images/                  # 画像リソース
├── config/                       # 設定ファイル
│   ├── app.config.js
│   ├── validation.config.js
│   └── chart.config.js
└── docs/                         # ドキュメント
    ├── API.md
    ├── COMPONENTS.md
    └── DEPLOYMENT.md
```

## コンポーネント設計方針

### 1. UI基本コンポーネント

#### Card Component
```javascript
// components/ui/Card.js
class Card {
    constructor(options) {
        this.title = options.title;
        this.content = options.content;
        this.className = options.className || '';
    }
    
    render() {
        return `
            <div class="card ${this.className}">
                <h3 class="card-title">${this.title}</h3>
                <div class="card-content">${this.content}</div>
            </div>
        `;
    }
}
```

#### Table Component
```javascript
// components/ui/Table.js
class Table {
    constructor(options) {
        this.columns = options.columns;
        this.data = options.data;
        this.editable = options.editable || false;
        this.sortable = options.sortable || false;
    }
    
    render() {
        // テーブル描画ロジック
    }
    
    addRow(data) {
        // 行追加ロジック
    }
    
    updateRow(index, data) {
        // 行更新ロジック
    }
}
```

### 2. ビジネスロジックサービス

#### InventoryService
```javascript
// services/InventoryService.js
class InventoryService {
    static calculateCurrentStock(prevStock, delivery, movement, sales, waste) {
        return prevStock + delivery + movement - sales - waste;
    }
    
    static validateStockLevels(stock, threshold) {
        return stock >= threshold;
    }
    
    static predictStockNeeds(salesForecast, currentStock) {
        return Math.max(0, salesForecast - currentStock);
    }
}
```

#### OrderService
```javascript
// services/OrderService.js
class OrderService {
    static calculateOrderQuantities(budget, products, composition) {
        return products.map(product => {
            const allocatedAmount = (budget * composition[product.code]) / 100;
            const quantity = Math.floor(allocatedAmount / product.price);
            return {
                ...product,
                quantity,
                amount: quantity * product.price
            };
        });
    }
    
    static validateBudgetConstraints(orders, budget) {
        const total = orders.reduce((sum, order) => sum + order.amount, 0);
        return total <= budget;
    }
}
```

### 3. データモデル

#### Product Model
```javascript
// models/Product.js
class Product {
    constructor(data) {
        this.code = data.code;
        this.name = data.name;
        this.price = data.price;
        this.category = data.category;
        this.minOrder = data.minOrder || 1;
        this.orderMultiple = data.orderMultiple || 1;
    }
    
    validate() {
        return this.code && this.name && this.price > 0;
    }
}
```

#### Order Model
```javascript
// models/Order.js
class Order {
    constructor(data) {
        this.date = data.date;
        this.products = data.products || [];
        this.budget = data.budget;
        this.status = data.status || 'draft';
    }
    
    getTotalAmount() {
        return this.products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    }
    
    getComposition() {
        const total = this.getTotalAmount();
        return this.products.map(p => ({
            ...p,
            composition: (p.quantity * p.price / total) * 100
        }));
    }
}
```

### 4. 状態管理

#### AppStore
```javascript
// stores/AppStore.js
class AppStore {
    constructor() {
        this.state = {
            currentUser: null,
            currentDate: new Date(),
            settings: {}
        };
        this.listeners = [];
    }
    
    subscribe(listener) {
        this.listeners.push(listener);
    }
    
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
    
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }
}
```

### 5. イベント駆動アーキテクチャ

```javascript
// utils/EventBus.js
class EventBus {
    constructor() {
        this.events = {};
    }
    
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }
    
    emit(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback(data));
        }
    }
}
```

## データフロー設計

### 1. 単方向データフロー
```
User Action → Service → Store Update → Component Re-render
```

### 2. ページ間データ連携
```javascript
// 実績入力 → 発注シミュレーション
EventBus.emit('performance.updated', performanceData);

// 発注シミュレーション側で受信
EventBus.on('performance.updated', (data) => {
    OrderStore.syncFromPerformance(data);
});
```

### 3. LocalStorage データ永続化
```javascript
// stores/BaseStore.js
class BaseStore {
    save(key) {
        localStorage.setItem(key, JSON.stringify(this.state));
    }
    
    load(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }
}
```

## パフォーマンス最適化

### 1. 遅延読み込み (Lazy Loading)
```javascript
// Dynamic import for heavy components
const loadChart = () => import('./components/ui/Chart.js');
```

### 2. 仮想スクロール (Virtual Scrolling)
```javascript
// For large data tables
class VirtualTable extends Table {
    render() {
        // Only render visible rows
    }
}
```

### 3. キャッシュ戦略
```javascript
// services/CacheService.js
class CacheService {
    static cache = new Map();
    
    static get(key, fetcher, ttl = 300000) { // 5分TTL
        if (this.cache.has(key)) {
            const { data, timestamp } = this.cache.get(key);
            if (Date.now() - timestamp < ttl) {
                return Promise.resolve(data);
            }
        }
        
        return fetcher().then(data => {
            this.cache.set(key, { data, timestamp: Date.now() });
            return data;
        });
    }
}
```

## 拡張性設計

### 1. プラグインシステム
```javascript
// Plugin architecture for features
class PluginManager {
    constructor() {
        this.plugins = [];
    }
    
    register(plugin) {
        this.plugins.push(plugin);
        plugin.init();
    }
    
    execute(hook, data) {
        return this.plugins.reduce((result, plugin) => {
            return plugin[hook] ? plugin[hook](result) : result;
        }, data);
    }
}
```

### 2. テーマシステム
```javascript
// Configurable themes
const themes = {
    light: { primary: '#2c3e50', background: '#f5f5f5' },
    dark: { primary: '#3498db', background: '#2c3e50' }
};
```

### 3. i18n 国際化対応
```javascript
// Multi-language support
const i18n = {
    ja: { 'inventory': '在庫', 'order': '発注' },
    en: { 'inventory': 'Inventory', 'order': 'Order' }
};
```

## 開発フェーズ

### Phase 1: 基盤構築 (4週)
1. プロジェクト構造セットアップ
2. 基本コンポーネント開発 (Card, Table, Form)
3. ストア・サービス層実装
4. イベントバス構築

### Phase 2: コア機能移行 (6週)
1. Dashboard コンポーネント化
2. Performance Input 分離・リファクタリング
3. Order Simulation 改良
4. データモデル統一

### Phase 3: 高度機能実装 (4週)
1. Western Confection Note 最適化
2. Historical Analysis 強化
3. チャート・グラフ統合
4. パフォーマンス最適化

### Phase 4: 品質向上・デプロイ準備 (2週)
1. テスト実装
2. ドキュメント整備
3. セキュリティ対策
4. プロダクションビルド

## 技術的考慮事項

### ブラウザ対応
- IE11+ (必要に応じてポリフィル)
- Chrome, Firefox, Safari, Edge

### パフォーマンス目標
- 初期読み込み: 3秒以下
- ページ遷移: 1秒以下
- 大量データテーブル: 10,000行対応

### セキュリティ
- XSS対策: HTMLエスケープ
- CSRF対策: トークン検証
- データ検証: 入力値サニタイズ

## 移行戦略

### 段階的移行アプローチ
1. **新旧並行運用**: 既存システムを維持しながら新システム開発
2. **ページ別移行**: 影響範囲を限定した段階的移行
3. **データ連携**: 既存データとの互換性保持
4. **フィードバック収集**: ユーザビリティテストと改善

この設計により、保守性・拡張性・パフォーマンスが大幅に向上し、開発効率も向上します。