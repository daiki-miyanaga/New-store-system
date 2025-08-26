/**
 * OrderSimulation Page - 発注シミュレーションページコンポーネント
 * MOCアーキテクチャのページレベルコンポーネント
 */
class OrderSimulation {
    constructor(options = {}) {
        this.container = options.container || 'body';
        this.header = null;
        this.budgetCards = [];
        this.productTable = null;
        this.compositionChart = null;
        this.summaryCards = [];
        
        // 設定
        this.autoCalculate = options.autoCalculate !== false;
        this.maxBudget = options.maxBudget || 180000; // 3日間の予算合計
        
        // データ
        this.budgetData = {
            today: 60000,
            tomorrow: 60000,
            dayAfter: 60000
        };
        this.orderData = null;
        this.compositionData = null;
        this.inventoryData = null;
        
        // サービス
        this.orderService = null;
    }

    /**
     * 発注シミュレーションを初期化
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // サービスの初期化
            this.orderService = new OrderSimulationService();
            
            // レイアウトの構築
            this.buildLayout();
            
            // ヘッダーの初期化
            this.initHeader();
            
            // データの初期読み込み
            await this.loadInitialData();
            
            // 予算カードの構築
            this.buildBudgetCards();
            
            // 商品テーブルの構築
            this.buildProductTable();
            
            // 構成比チャートの構築
            this.buildCompositionChart();
            
            // サマリーカードの構築
            this.buildSummaryCards();
            
            // イベントリスナーの設定
            this.attachEventListeners();
            
            // ページ読み込み完了イベント
            if (window.eventBus) {
                window.eventBus.emit('orderSimulation.loaded');
            }
            
        } catch (error) {
            console.error('OrderSimulation initialization failed:', error);
            Alert.error('発注シミュレーションの初期化に失敗しました').mount();
        }
    }

    /**
     * レイアウトの基本構造を構築
     */
    buildLayout() {
        const container = typeof this.container === 'string' ? 
            document.querySelector(this.container) : this.container;
            
        container.innerHTML = `
            <div class="order-simulation-layout">
                <div id="order-header"></div>
                
                <main class="order-main">
                    <div class="order-content">
                        <!-- Budget Control Section -->
                        <section class="budget-control">
                            <div class="container">
                                <h2 class="section-title">💰 予算管理（3日間）</h2>
                                <div id="budget-cards-container" class="budget-cards-grid"></div>
                            </div>
                        </section>
                        
                        <!-- Performance Data Sync -->
                        <section class="data-sync">
                            <div class="container">
                                <div class="sync-panel">
                                    <h3>📊 実績データ連動</h3>
                                    <p>実績入力システムから在庫データを取得して発注数を最適化します</p>
                                    <button id="sync-performance-btn" class="btn btn-primary">
                                        🔄 実績入力データと同期
                                    </button>
                                </div>
                            </div>
                        </section>
                        
                        <!-- Order Table Section -->
                        <section class="order-products">
                            <div class="container">
                                <h2 class="section-title">🛒 商品別発注管理</h2>
                                <div class="order-controls">
                                    <div class="control-item">
                                        <label>表示モード</label>
                                        <select id="display-mode" class="form-input">
                                            <option value="composition">構成比ベース</option>
                                            <option value="quantity">数量ベース</option>
                                        </select>
                                    </div>
                                    <div class="control-item">
                                        <label>対象日</label>
                                        <select id="target-day" class="form-input">
                                            <option value="today">本日</option>
                                            <option value="tomorrow">翌日</option>
                                            <option value="dayAfter">翌々日</option>
                                        </select>
                                    </div>
                                </div>
                                <div id="order-table-container"></div>
                            </div>
                        </section>
                        
                        <!-- Composition Chart Section -->
                        <section class="composition-analysis">
                            <div class="container">
                                <h2 class="section-title">📊 発注構成比分析</h2>
                                <div class="chart-container">
                                    <div id="composition-chart"></div>
                                </div>
                            </div>
                        </section>
                        
                        <!-- Summary Cards -->
                        <section class="order-summary">
                            <div class="container">
                                <h2 class="section-title">📈 発注サマリー</h2>
                                <div id="summary-cards-container" class="summary-cards-grid"></div>
                            </div>
                        </section>
                        
                        <!-- Inventory Forecast Section -->
                        <section class="inventory-forecast">
                            <div class="container">
                                <h2 class="section-title">📦 在庫推移予測</h2>
                                <div id="forecast-details" class="forecast-panel">
                                    <div class="forecast-item">
                                        <h4>当日残在庫入力</h4>
                                        <input type="number" id="current-stock" class="form-input" placeholder="当日終了時在庫数">
                                    </div>
                                    <div class="forecast-results">
                                        <div id="forecast-calculation"></div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        <!-- Actions -->
                        <section class="order-actions">
                            <div class="container">
                                <div class="actions-bar">
                                    <button id="calculate-btn" class="btn btn-primary">🧮 発注数計算</button>
                                    <button id="optimize-btn" class="btn btn-secondary">⚡ 最適化実行</button>
                                    <button id="save-order-btn" class="btn btn-primary">💾 発注データ保存</button>
                                    <button id="export-order-btn" class="btn btn-secondary">📤 発注書出力</button>
                                    <button id="reset-order-btn" class="btn btn-warning">🔄 リセット</button>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        `;
    }

    /**
     * ヘッダーを初期化
     */
    initHeader() {
        this.header = Header.createDefault({
            title: '在庫管理システム',
            subtitle: '発注シミュレーション',
            menuItems: [
                { label: 'ダッシュボード', icon: '📊', href: 'index.html' },
                { label: '実績入力', icon: '📝', href: 'performance-input.html' },
                { label: '発注シミュレーション', icon: '🔄', href: 'order-simulation.html', active: true },
                { label: '洋生ノート', icon: '🧁', href: 'western-confection-note.html' },
                { label: '過去データ', icon: '📈', href: 'historical-performance.html' }
            ]
        });
        
        this.header.mount('#order-header');
    }

    /**
     * 初期データを読み込み
     * @returns {Promise<void>}
     */
    async loadInitialData() {
        try {
            const [orderData, compositionData] = await Promise.all([
                this.orderService.getOrderData(),
                this.orderService.getCompositionData()
            ]);
            
            this.orderData = orderData;
            this.compositionData = compositionData;
            
        } catch (error) {
            console.error('Initial data load failed:', error);
            throw error;
        }
    }

    /**
     * 予算カードを構築
     */
    buildBudgetCards() {
        const container = document.getElementById('budget-cards-container');
        if (!container) return;
        
        const budgetItems = [
            {
                key: 'today',
                icon: '📅',
                label: '本日予算',
                value: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(this.budgetData.today),
                trend: 0,
                editable: true
            },
            {
                key: 'tomorrow',
                icon: '📅',
                label: '翌日予算',
                value: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(this.budgetData.tomorrow),
                trend: 0,
                editable: true
            },
            {
                key: 'dayAfter',
                icon: '📅',
                label: '翌々日予算',
                value: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(this.budgetData.dayAfter),
                trend: 0,
                editable: true
            }
        ];
        
        this.budgetCards = budgetItems.map(item => {
            const card = Card.createKPICard(item);
            
            // 編集可能な予算カードの場合、入力フィールドを追加
            if (item.editable) {
                const cardElement = card.mount(container);
                const valueElement = cardElement.querySelector('.kpi-value');
                
                valueElement.addEventListener('click', () => {
                    this.editBudget(item.key, valueElement);
                });
            } else {
                card.mount(container);
            }
            
            return card;
        });
    }

    /**
     * 商品テーブルを構築
     */
    buildProductTable() {
        const columns = [
            { key: 'code', label: '商品コード', type: 'text', width: '100px' },
            { key: 'name', label: '商品名', type: 'text', width: '120px' },
            { key: 'price', label: '単価', type: 'currency', width: '80px' },
            { key: 'currentStock', label: '現在在庫', type: 'number', width: '80px' },
            { key: 'composition', label: '構成比(%)', type: 'range', min: 0, max: 50, step: 0.5, editable: true, width: '120px' },
            { key: 'quantity', label: '発注数', type: 'number', width: '80px' },
            { key: 'amount', label: '金額', type: 'currency', width: '100px' },
            { key: 'constraints', label: '制約', type: 'text', width: '80px' },
            { key: 'memo', label: 'メモ', type: 'text', editable: true, width: '100px' }
        ];
        
        this.productTable = new Table({
            columns: columns,
            data: this.orderData,
            editable: true,
            sortable: true,
            onRowUpdate: this.handleProductUpdate.bind(this),
            onCellRender: this.renderProductCell.bind(this),
            className: 'order-table'
        });
        
        this.productTable.mount('#order-table-container');
    }

    /**
     * 構成比チャートを構築
     */
    buildCompositionChart() {
        if (!this.compositionData) return;
        
        this.compositionChart = MOCChart.compositionChart(this.compositionData);
        this.compositionChart.mount('#composition-chart');
    }

    /**
     * サマリーカードを構築
     */
    buildSummaryCards() {
        const container = document.getElementById('summary-cards-container');
        if (!container) return;
        
        const summary = this.calculateOrderSummary();
        
        const summaryItems = [
            {
                key: 'totalQuantity',
                icon: '📦',
                label: '発注総数',
                value: `${summary.totalQuantity}個`,
                trend: 0
            },
            {
                key: 'totalAmount',
                icon: '💰',
                label: '発注金額',
                value: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(summary.totalAmount),
                trend: 0
            },
            {
                key: 'budgetUsage',
                icon: '📊',
                label: '予算使用率',
                value: `${summary.budgetUsage.toFixed(1)}%`,
                trend: summary.budgetUsage > 100 ? -1 : summary.budgetUsage > 95 ? 0 : 1
            },
            {
                key: 'compositionTotal',
                icon: '⚖️',
                label: '構成比合計',
                value: `${summary.compositionTotal.toFixed(1)}%`,
                trend: Math.abs(summary.compositionTotal - 100) > 5 ? -1 : 0
            }
        ];
        
        this.summaryCards = summaryItems.map(item => {
            const card = Card.createKPICard(item);
            card.mount(container);
            return card;
        });
    }

    /**
     * 商品更新ハンドラー
     * @param {Object} row - 更新された行データ
     * @param {string} column - 更新されたカラム
     * @param {any} value - 新しい値
     */
    handleProductUpdate(row, column, value) {
        if (column === 'composition') {
            // 構成比から発注数を計算
            const budget = this.getBudgetForDay(document.getElementById('target-day').value);
            const allocatedAmount = (budget * value) / 100;
            row.quantity = Math.floor(allocatedAmount / row.price);
            row.amount = row.quantity * row.price;
        } else if (column === 'quantity') {
            // 発注数から金額を計算
            row.amount = value * row.price;
            // 構成比を更新
            const budget = this.getBudgetForDay(document.getElementById('target-day').value);
            row.composition = budget > 0 ? (row.amount / budget) * 100 : 0;
        }
        
        // テーブルを更新
        this.productTable.updateData(this.orderData);
        
        // サマリーとチャートを更新
        this.updateSummaryCards();
        this.updateCompositionChart();
        
        // イベント発火
        if (window.eventBus) {
            window.eventBus.emit('order.productUpdated', { row, column, value });
        }
    }

    /**
     * 商品セルレンダラー
     * @param {any} value - セルの値
     * @param {string} column - カラム名
     * @param {Object} row - 行データ
     * @returns {string} レンダリング結果
     */
    renderProductCell(value, column, row) {
        if (column === 'constraints') {
            const constraints = [];
            if (row.minOrder && row.quantity < row.minOrder) {
                constraints.push('<span class="constraint-error">最小発注</span>');
            }
            if (row.orderUnit && row.quantity % row.orderUnit !== 0) {
                constraints.push('<span class="constraint-warning">発注倍数</span>');
            }
            if (constraints.length === 0) {
                constraints.push('<span class="constraint-ok">OK</span>');
            }
            return constraints.join('<br>');
        }
        
        if (column === 'composition' && typeof value === 'number') {
            return `
                <input type="range" 
                       min="0" max="50" step="0.5" 
                       value="${value}" 
                       class="composition-slider"
                       onchange="handleCompositionChange('${row.code}', this.value)">
                <span class="composition-value">${value.toFixed(1)}%</span>
            `;
        }
        
        return value;
    }

    /**
     * 予算編集
     * @param {string} budgetKey - 予算キー
     * @param {HTMLElement} valueElement - 値要素
     */
    editBudget(budgetKey, valueElement) {
        const currentValue = this.budgetData[budgetKey];
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentValue;
        input.className = 'budget-edit-input';
        input.style.cssText = 'width: 100%; font-size: inherit; text-align: center; border: 1px solid #ccc; border-radius: 4px;';
        
        valueElement.replaceWith(input);
        input.focus();
        input.select();
        
        const saveBudget = () => {
            const newValue = parseInt(input.value) || currentValue;
            this.budgetData[budgetKey] = newValue;
            
            const newValueElement = document.createElement('div');
            newValueElement.className = 'kpi-value';
            newValueElement.textContent = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(newValue);
            
            input.replaceWith(newValueElement);
            newValueElement.addEventListener('click', () => {
                this.editBudget(budgetKey, newValueElement);
            });
            
            // サマリー更新
            this.updateSummaryCards();
            
            // イベント発火
            if (window.eventBus) {
                window.eventBus.emit('order.budgetUpdated', { budgetKey, value: newValue });
            }
        };
        
        input.addEventListener('blur', saveBudget);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveBudget();
            }
        });
    }

    /**
     * 対象日の予算を取得
     * @param {string} day - 対象日
     * @returns {number} 予算
     */
    getBudgetForDay(day) {
        return this.budgetData[day] || 60000;
    }

    /**
     * 発注サマリー計算
     * @returns {Object} サマリーデータ
     */
    calculateOrderSummary() {
        const totalQuantity = this.orderData.reduce((sum, row) => sum + (row.quantity || 0), 0);
        const totalAmount = this.orderData.reduce((sum, row) => sum + (row.amount || 0), 0);
        const currentBudget = this.getBudgetForDay(document.getElementById('target-day')?.value || 'today');
        const budgetUsage = currentBudget > 0 ? (totalAmount / currentBudget) * 100 : 0;
        const compositionTotal = this.orderData.reduce((sum, row) => sum + (row.composition || 0), 0);
        
        return {
            totalQuantity,
            totalAmount,
            budgetUsage,
            compositionTotal
        };
    }

    /**
     * サマリーカードの更新
     */
    updateSummaryCards() {
        const summary = this.calculateOrderSummary();
        
        const updates = [
            { value: `${summary.totalQuantity}個` },
            { value: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(summary.totalAmount) },
            { value: `${summary.budgetUsage.toFixed(1)}%` },
            { value: `${summary.compositionTotal.toFixed(1)}%` }
        ];
        
        this.summaryCards.forEach((card, index) => {
            if (updates[index]) {
                card.update({
                    content: `
                        <div class="kpi-value">${updates[index].value}</div>
                        <div class="kpi-trend neutral">
                            → 最新
                        </div>
                    `
                });
            }
        });
    }

    /**
     * 構成比チャートの更新
     */
    updateCompositionChart() {
        const chartData = this.orderData.map(row => ({
            category: row.name,
            percentage: row.composition || 0
        })).filter(item => item.percentage > 0);
        
        if (this.compositionChart) {
            this.compositionChart.updateData({
                labels: chartData.map(item => item.category),
                datasets: [{
                    data: chartData.map(item => item.percentage),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            });
        }
    }

    /**
     * イベントリスナーの設定
     */
    attachEventListeners() {
        // 実績データ同期
        document.getElementById('sync-performance-btn')?.addEventListener('click', () => {
            this.syncPerformanceData();
        });
        
        // アクションボタン
        document.getElementById('calculate-btn')?.addEventListener('click', () => {
            this.calculateOrders();
        });
        
        document.getElementById('optimize-btn')?.addEventListener('click', () => {
            this.optimizeOrders();
        });
        
        document.getElementById('save-order-btn')?.addEventListener('click', () => {
            this.saveOrderData();
        });
        
        document.getElementById('export-order-btn')?.addEventListener('click', () => {
            this.exportOrderData();
        });
        
        document.getElementById('reset-order-btn')?.addEventListener('click', () => {
            this.resetOrders();
        });
        
        // 在庫入力
        document.getElementById('current-stock')?.addEventListener('change', (e) => {
            this.calculateInventoryForecast(parseInt(e.target.value) || 0);
        });
        
        // 表示モード変更
        document.getElementById('display-mode')?.addEventListener('change', (e) => {
            this.changeDisplayMode(e.target.value);
        });
        
        // 対象日変更
        document.getElementById('target-day')?.addEventListener('change', (e) => {
            this.changeTargetDay(e.target.value);
        });
    }

    /**
     * 実績データ同期
     */
    async syncPerformanceData() {
        try {
            // イベントバスで実績データを要求
            if (window.eventBus) {
                window.eventBus.emit('order.requestPerformanceData');
            }
            
            Alert.success('実績データと同期しました').mount();
            
        } catch (error) {
            console.error('Performance data sync failed:', error);
            Alert.error('実績データとの同期に失敗しました').mount();
        }
    }

    /**
     * 発注計算実行
     */
    calculateOrders() {
        this.orderData.forEach(row => {
            const budget = this.getBudgetForDay(document.getElementById('target-day').value);
            const allocatedAmount = (budget * (row.composition || 0)) / 100;
            row.quantity = Math.floor(allocatedAmount / row.price);
            row.amount = row.quantity * row.price;
        });
        
        this.productTable.updateData(this.orderData);
        this.updateSummaryCards();
        this.updateCompositionChart();
        
        Alert.success('発注数を再計算しました').mount();
    }

    /**
     * 発注最適化
     */
    optimizeOrders() {
        // AI的最適化ロジックのモック
        Alert.info('発注最適化機能は今後実装予定です').mount();
    }

    /**
     * 発注データ保存
     */
    async saveOrderData() {
        try {
            await this.orderService.saveOrderData(this.orderData, this.budgetData);
            Alert.success('発注データを保存しました').mount();
            
        } catch (error) {
            console.error('Save order data failed:', error);
            Alert.error('発注データの保存に失敗しました').mount();
        }
    }

    /**
     * 発注書出力
     */
    exportOrderData() {
        try {
            const csvData = this.orderService.exportOrderToCSV(this.orderData);
            
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `order_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            Alert.success('発注書をダウンロードしました').mount();
            
        } catch (error) {
            console.error('Export failed:', error);
            Alert.error('発注書の出力に失敗しました').mount();
        }
    }

    /**
     * オーダーリセット
     */
    resetOrders() {
        Alert.confirm('すべての発注データをリセットしますか？', {
            onConfirm: async () => {
                try {
                    await this.loadInitialData();
                    this.productTable.updateData(this.orderData);
                    this.updateSummaryCards();
                    this.updateCompositionChart();
                    
                    Alert.success('発注データをリセットしました').mount();
                } catch (error) {
                    Alert.error('リセットに失敗しました').mount();
                }
            }
        }).mount();
    }

    /**
     * 在庫推移計算
     * @param {number} currentStock - 現在在庫
     */
    calculateInventoryForecast(currentStock) {
        const forecastElement = document.getElementById('forecast-calculation');
        if (!forecastElement) return;
        
        // モック計算
        const tomorrowSales = 20; // 予想売上
        const dayAfterSales = 25;
        
        const tomorrowOrder = Math.max(0, tomorrowSales - currentStock);
        const tomorrowEndStock = Math.max(0, currentStock + tomorrowOrder - tomorrowSales);
        const dayAfterOrder = Math.max(0, dayAfterSales - tomorrowEndStock);
        
        forecastElement.innerHTML = `
            <div class="forecast-result">
                <h5>📈 在庫推移予測</h5>
                <div class="forecast-step">
                    <span>翌日必要発注数:</span>
                    <strong>${tomorrowOrder}個</strong>
                </div>
                <div class="forecast-step">
                    <span>翌日終了在庫:</span>
                    <strong>${tomorrowEndStock}個</strong>
                </div>
                <div class="forecast-step">
                    <span>翌々日必要発注数:</span>
                    <strong>${dayAfterOrder}個</strong>
                </div>
            </div>
        `;
    }

    /**
     * 表示モード変更
     * @param {string} mode - 表示モード
     */
    changeDisplayMode(mode) {
        // 表示モードに応じてテーブルの表示を変更
        console.log('Display mode changed to:', mode);
        
        if (mode === 'composition') {
            // 構成比ベース表示
            this.productTable.showColumn('composition');
            this.productTable.hideColumn('quantity');
        } else {
            // 数量ベース表示
            this.productTable.hideColumn('composition');
            this.productTable.showColumn('quantity');
        }
    }

    /**
     * 対象日変更
     * @param {string} day - 対象日
     */
    changeTargetDay(day) {
        console.log('Target day changed to:', day);
        
        // 対象日に応じて予算と計算を更新
        this.updateSummaryCards();
        this.updateCompositionChart();
    }

    /**
     * システム破棄
     */
    destroy() {
        // ヘッダー破棄
        if (this.header) {
            this.header.destroy();
        }
        
        // テーブル破棄
        if (this.productTable) {
            this.productTable.destroy();
        }
        
        // チャート破棄
        if (this.compositionChart) {
            this.compositionChart.destroy();
        }
        
        // カード破棄
        this.budgetCards.forEach(card => card.destroy());
        this.summaryCards.forEach(card => card.destroy());
    }
}

/**
 * OrderSimulationService - 発注シミュレーション用データサービス
 */
class OrderSimulationService {
    async getOrderData() {
        // モックデータ
        return [
            { code: '2408', name: 'デンマークCC', price: 1200, currentStock: 5, composition: 15.0, quantity: 8, amount: 9600, minOrder: 5, orderUnit: 1, memo: '' },
            { code: '1001', name: 'レアチーズC', price: 1000, currentStock: 3, composition: 12.0, quantity: 7, amount: 7000, minOrder: 3, orderUnit: 1, memo: '' },
            { code: '3201', name: 'カスタードプリン', price: 480, currentStock: 8, composition: 25.0, quantity: 31, amount: 14880, minOrder: 10, orderUnit: 2, memo: '' },
            { code: '3202', name: 'とろ生カスタード', price: 520, currentStock: 6, composition: 20.0, quantity: 23, amount: 11960, minOrder: 8, orderUnit: 1, memo: '' },
            { code: '4101', name: 'マンゴー&オレンジ', price: 270, currentStock: 12, composition: 18.0, quantity: 40, amount: 10800, minOrder: 15, orderUnit: 5, memo: '' },
            { code: '4102', name: 'メロン&白桃', price: 270, currentStock: 10, composition: 10.0, quantity: 22, amount: 5940, minOrder: 15, orderUnit: 5, memo: '' }
        ];
    }
    
    async getCompositionData() {
        return [
            { category: 'デンマーク関連', percentage: 27 },
            { category: '洋菓子限定', percentage: 45 },
            { category: 'ゼリー', percentage: 28 }
        ];
    }
    
    async saveOrderData(orderData, budgetData) {
        // API呼び出しのモック
        return new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    exportOrderToCSV(orderData) {
        const headers = ['商品コード', '商品名', '単価', '現在在庫', '構成比(%)', '発注数', '金額', 'メモ'];
        const csvContent = [
            headers.join(','),
            ...orderData.map(row => [
                row.code,
                `"${row.name}"`,
                row.price,
                row.currentStock,
                row.composition,
                row.quantity,
                row.amount,
                `"${row.memo || ''}"`
            ].join(','))
        ].join('\n');
        
        return csvContent;
    }
}

// グローバル関数（HTMLから呼び出されるため）
function handleCompositionChange(code, value) {
    // 構成比変更のハンドリング
    console.log('Composition changed:', code, value);
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OrderSimulation, OrderSimulationService };
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.OrderSimulation = OrderSimulation;
    window.OrderSimulationService = OrderSimulationService;
}