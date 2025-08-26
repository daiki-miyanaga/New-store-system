/**
 * PerformanceInput Page - 実績入力ページコンポーネント  
 * MOCアーキテクチャのページレベルコンポーネント
 */
class PerformanceInput {
    constructor(options = {}) {
        this.container = options.container || 'body';
        this.header = null;
        this.mainTable = null;
        this.hourlySalesTable = null;
        this.summaryCards = [];
        
        // 設定
        this.autoSave = options.autoSave !== false;
        this.saveInterval = options.saveInterval || 30000; // 30秒
        this.saveTimer = null;
        
        // データ
        this.performanceData = null;
        this.hourlySalesData = null;
        this.validationErrors = {};
        
        // サービス
        this.performanceService = null;
        this.validationService = null;
    }

    /**
     * 実績入力システムを初期化
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // サービスの初期化
            this.performanceService = new PerformanceInputService();
            this.validationService = null; // ValidationService は未実装のため null に設定
            
            // レイアウトの構築
            this.buildLayout();
            
            // ヘッダーの初期化
            this.initHeader();
            
            // データの初期読み込み
            await this.loadInitialData();
            
            // テーブルの構築
            this.buildMainTable();
            this.buildHourlySalesTable();
            
            // サマリーカードの構築
            this.buildSummaryCards();
            
            // イベントリスナーの設定
            this.attachEventListeners();
            
            // 自動保存の開始
            if (this.autoSave) {
                this.startAutoSave();
            }
            
            // ページ読み込み完了イベント
            if (window.eventBus) {
                window.eventBus.emit('performance.loaded');
            }
            
        } catch (error) {
            console.error('PerformanceInput initialization failed:', error);
            Alert.error('実績入力システムの初期化に失敗しました').mount();
        }
    }

    /**
     * レイアウトの基本構造を構築
     */
    buildLayout() {
        const container = typeof this.container === 'string' ? 
            document.querySelector(this.container) : this.container;
            
        container.innerHTML = `
            <div class="performance-layout">
                <div id="performance-header"></div>
                
                <main class="performance-main">
                    <div class="performance-content">
                        <!-- Header Info -->
                        <section class="performance-info">
                            <div class="container">
                                <div class="info-grid">
                                    <div class="info-item">
                                        <label>対象日</label>
                                        <input type="date" id="target-date" class="form-input" value="${new Date().toISOString().slice(0, 10)}">
                                    </div>
                                    <div class="info-item">
                                        <label>天気</label>
                                        <select id="weather" class="form-input">
                                            <option value="晴れ">☀️ 晴れ</option>
                                            <option value="曇り">☁️ 曇り</option>
                                            <option value="雨">🌧️ 雨</option>
                                            <option value="雪">❄️ 雪</option>
                                        </select>
                                    </div>
                                    <div class="info-item">
                                        <label>気温 (℃)</label>
                                        <input type="number" id="temperature" class="form-input" min="-10" max="40" value="25">
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        <!-- Summary Cards -->
                        <section class="performance-summary">
                            <div class="container">
                                <div id="summary-cards-container" class="summary-cards-grid"></div>
                            </div>
                        </section>
                        
                        <!-- Main Data Table -->
                        <section class="performance-data">
                            <div class="container">
                                <h2 class="section-title">📊 商品別実績入力</h2>
                                <div id="main-table-container"></div>
                            </div>
                        </section>
                        
                        <!-- Hourly Sales Table -->
                        <section class="hourly-sales">
                            <div class="container">
                                <h2 class="section-title">⏰ 時間帯別売上</h2>
                                <div id="hourly-table-container"></div>
                            </div>
                        </section>
                        
                        <!-- Actions -->
                        <section class="performance-actions">
                            <div class="container">
                                <div class="actions-bar">
                                    <button id="save-btn" class="btn btn-primary">💾 データ保存</button>
                                    <button id="sync-btn" class="btn btn-secondary">🔄 発注システムと同期</button>
                                    <button id="export-btn" class="btn btn-secondary">📤 CSV出力</button>
                                    <button id="reset-btn" class="btn btn-warning">🔄 リセット</button>
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
            subtitle: '実績入力',
            menuItems: [
                { label: 'ダッシュボード', icon: '📊', href: 'index-moc.html' },
                { label: '実績入力', icon: '📝', href: 'performance-input-moc.html', active: true },
                { label: '発注シミュレーション', icon: '🔄', href: 'order-simulation-moc.html' },
                { label: '洋生ノート', icon: '🧁', href: 'western-confection-note-moc.html' },
                { label: '過去データ分析', icon: '📈', href: 'historical-analysis-moc.html' },
                { label: 'マスタメンテナンス', icon: '🔧', href: 'master-maintenance-moc.html' }
            ]
        });
        
        this.header.mount('#performance-header');
    }

    /**
     * 初期データを読み込み
     * @returns {Promise<void>}
     */
    async loadInitialData() {
        try {
            const [performanceData, hourlySalesData] = await Promise.all([
                this.performanceService.getTodayPerformance(),
                this.performanceService.getHourlySales()
            ]);
            
            this.performanceData = performanceData;
            this.hourlySalesData = hourlySalesData;
            
        } catch (error) {
            console.error('Initial data load failed:', error);
            throw error;
        }
    }

    /**
     * メインテーブルを構築
     */
    buildMainTable() {
        try {
            const columns = [
                { key: 'code', label: '商品コード', type: 'text', required: true },
                { key: 'name', label: '商品名', type: 'text', required: true },
                { key: 'price', label: '単価', type: 'currency' },
                { key: 'prevStock', label: '前日残', type: 'number', editable: true },
                { key: 'delivery', label: '入荷', type: 'number', editable: true },
                { key: 'movement', label: '移動', type: 'number', editable: true },
                { key: 'sales', label: '販売数', type: 'number', editable: true, required: true },
                { key: 'waste', label: 'ロス数', type: 'number', editable: true },
                { key: 'currentStock', label: '当日在庫', type: 'number', footer: 'sum' },
                { key: 'soldoutTime', label: '完売時間', type: 'time', editable: true },
                { key: 'memo', label: 'メモ', type: 'text', editable: true }
            ];
            
            this.mainTable = new Table({
                columns: columns,
                data: this.performanceData || [],
                editable: true,
                sortable: true,
                validators: this.getPerformanceValidators(),
                onRowUpdate: this.handleRowUpdate.bind(this),
                className: 'performance-table'
            });
            
            const container = document.getElementById('main-table-container');
            if (container) {
                this.mainTable.mount('#main-table-container');
            }
        } catch (error) {
            console.error('Main table build failed:', error);
            const container = document.getElementById('main-table-container');
            if (container) {
                container.innerHTML = '<div class="table-error">テーブルの作成に失敗しました</div>';
            }
        }
    }

    /**
     * 時間帯別売上テーブルを構築
     */
    buildHourlySalesTable() {
        try {
            const columns = [
                { key: 'hour', label: '時間帯', type: 'text' },
                { key: 'amount', label: '売上金額', type: 'currency', editable: true },
                { key: 'customers', label: '客数', type: 'number', editable: true },
                { key: 'composition', label: '構成比', type: 'text' },
                { key: 'cumulative', label: '累計', type: 'currency' }
            ];
            
            this.hourlySalesTable = new Table({
                columns: columns,
                data: this.hourlySalesData || [],
                editable: true,
                onRowUpdate: this.handleHourlySalesUpdate.bind(this),
                className: 'hourly-sales-table'
            });
            
            const container = document.getElementById('hourly-table-container');
            if (container) {
                this.hourlySalesTable.mount('#hourly-table-container');
            }
        } catch (error) {
            console.error('Hourly sales table build failed:', error);
            const container = document.getElementById('hourly-table-container');
            if (container) {
                container.innerHTML = '<div class="table-error">時間帯別売上テーブルの作成に失敗しました</div>';
            }
        }
    }

    /**
     * サマリーカードを構築
     */
    buildSummaryCards() {
        try {
            const container = document.getElementById('summary-cards-container');
            if (!container) return;
            
            const summary = this.calculateSummary();
            
            const summaryItems = [
                {
                    key: 'totalSales',
                    icon: '💰',
                    label: '総売上',
                    value: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(summary.totalSales),
                    trend: summary.salesTrend
                },
                {
                    key: 'totalCustomers',
                    icon: '👥',
                    label: '総客数',
                    value: summary.totalCustomers.toString(),
                    trend: summary.customerTrend
                },
                {
                    key: 'wasteRate',
                    icon: '⚠️',
                    label: 'ロス率',
                    value: `${summary.wasteRate.toFixed(1)}%`,
                    trend: -summary.wasteRate
                },
                {
                    key: 'soldoutCount',
                    icon: '🔥',
                    label: '完売商品',
                    value: `${summary.soldoutCount}品`,
                    trend: summary.soldoutTrend
                }
            ];
            
            this.summaryCards = summaryItems.map(item => {
                const card = Card.createKPICard(item);
                card.mount(container);
                return card;
            });
        } catch (error) {
            console.error('Summary cards build failed:', error);
            const container = document.getElementById('summary-cards-container');
            if (container) {
                container.innerHTML = '<div class="summary-error">サマリーカードの作成に失敗しました</div>';
            }
        }
    }

    /**
     * パフォーマンス用バリデーターを取得
     * @returns {Object} バリデーター
     */
    getPerformanceValidators() {
        return {
            sales: (value, row) => {
                const sales = parseInt(value) || 0;
                if (sales < 0) {
                    return { valid: false, message: '販売数は0以上で入力してください' };
                }
                return { valid: true };
            },
            
            waste: (value, row) => {
                const waste = parseInt(value) || 0;
                const sales = parseInt(row.sales) || 0;
                const wasteRate = sales > 0 ? (waste / sales) * 100 : 0;
                
                if (wasteRate > 15) {
                    return { valid: false, message: 'ロス率が異常に高いです（15%超）' };
                } else if (wasteRate > 5) {
                    return { valid: false, message: 'ロス率が基準値を超えています（5%超）' };
                }
                
                return { valid: true };
            },
            
            soldoutTime: (value) => {
                if (!value) return { valid: true };
                
                const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timePattern.test(value)) {
                    return { valid: false, message: 'HH:MM形式で入力してください' };
                }
                
                return { valid: true };
            }
        };
    }

    /**
     * 行更新ハンドラー
     * @param {Object} row - 更新された行データ
     * @param {string} column - 更新されたカラム
     * @param {any} value - 新しい値
     */
    handleRowUpdate(row, column, value) {
        try {
            // 数値フィールドの処理
            if (['prevStock', 'delivery', 'movement', 'sales', 'waste'].includes(column)) {
                // 数値に変換（空文字列や無効な値は0に）
                const numValue = parseFloat(value) || 0;
                row[column] = numValue;
                
                // 自動計算の実行
                if (window.InventoryService && typeof window.InventoryService.calculateCurrentStock === 'function') {
                    row.currentStock = window.InventoryService.calculateCurrentStock(
                        parseFloat(row.prevStock) || 0,
                        parseFloat(row.delivery) || 0,
                        parseFloat(row.movement) || 0,
                        parseFloat(row.sales) || 0,
                        parseFloat(row.waste) || 0
                    );
                } else {
                    // フォールバック計算
                    const prevStock = parseFloat(row.prevStock) || 0;
                    const delivery = parseFloat(row.delivery) || 0;
                    const movement = parseFloat(row.movement) || 0;
                    const sales = parseFloat(row.sales) || 0;
                    const waste = parseFloat(row.waste) || 0;
                    row.currentStock = Math.max(0, prevStock + delivery + movement - sales - waste);
                }
            } else {
                row[column] = value;
            }
            
            // バリデーション実行
            this.validateRow(row);
            
            // サマリー更新
            this.updateSummaryCards();
            
            // データ変更イベント発火
            if (window.eventBus) {
                window.eventBus.emit('performance.rowUpdated', { row, column, value });
            }
            
            // 自動保存フラグ設定
            this.markDirty();
        } catch (error) {
            console.error('Row update failed:', error, { row, column, value });
            Alert.error('データの更新に失敗しました').mount();
        }
    }

    /**
     * 時間帯別売上更新ハンドラー
     * @param {Object} row - 更新された行データ
     * @param {string} column - 更新されたカラム
     * @param {any} value - 新しい値
     */
    handleHourlySalesUpdate(row, column, value) {
        try {
            // 数値フィールドの処理
            if (column === 'amount' || column === 'customers') {
                const numValue = parseFloat(value) || 0;
                row[column] = numValue;
            } else {
                row[column] = value;
            }
            
            // 構成比と累計の再計算
            this.recalculateHourlySales();
            
            // サマリー更新
            this.updateSummaryCards();
            
            // イベント発火
            if (window.eventBus) {
                window.eventBus.emit('performance.hourlySalesUpdated', { row, column, value });
            }
            
            this.markDirty();
        } catch (error) {
            console.error('Hourly sales update failed:', error, { row, column, value });
            Alert.error('時間帯別売上の更新に失敗しました').mount();
        }
    }

    /**
     * 時間帯別売上の再計算
     */
    recalculateHourlySales() {
        try {
            if (!this.hourlySalesData || !Array.isArray(this.hourlySalesData)) {
                return;
            }
            
            let totalAmount = 0;
            let cumulative = 0;
            
            // 総売上計算
            this.hourlySalesData.forEach(row => {
                totalAmount += row.amount || 0;
            });
            
            // 構成比と累計の計算
            this.hourlySalesData.forEach(row => {
                cumulative += row.amount || 0;
                row.composition = totalAmount > 0 ? `${((row.amount / totalAmount) * 100).toFixed(1)}%` : '0%';
                row.cumulative = cumulative;
            });
            
            // テーブルの更新
            if (this.hourlySalesTable && this.hourlySalesTable.updateData) {
                this.hourlySalesTable.updateData(this.hourlySalesData);
            }
        } catch (error) {
            console.error('Hourly sales recalculation failed:', error);
        }
    }

    /**
     * 行のバリデーション
     * @param {Object} row - 行データ
     * @returns {boolean} バリデーション結果
     */
    validateRow(row) {
        const validators = this.getPerformanceValidators();
        let isValid = true;
        
        for (const [field, validator] of Object.entries(validators)) {
            const result = validator(row[field], row);
            if (!result.valid) {
                this.validationErrors[`${row.code}_${field}`] = result.message;
                isValid = false;
            } else {
                delete this.validationErrors[`${row.code}_${field}`];
            }
        }
        
        return isValid;
    }

    /**
     * サマリー計算
     * @returns {Object} サマリーデータ
     */
    calculateSummary() {
        try {
            const hourlySalesData = this.hourlySalesData || [];
            const performanceData = this.performanceData || [];
            
            const totalSales = hourlySalesData.reduce((sum, row) => sum + (row.amount || 0), 0);
            const totalCustomers = hourlySalesData.reduce((sum, row) => sum + (row.customers || 0), 0);
            
            const totalWaste = performanceData.reduce((sum, row) => sum + (row.waste || 0), 0);
            const totalProduct = performanceData.reduce((sum, row) => sum + (row.sales || 0), 0);
            const wasteRate = totalProduct > 0 ? (totalWaste / totalProduct) * 100 : 0;
            
            const soldoutCount = performanceData.filter(row => row.soldoutTime && row.soldoutTime.trim()).length;
            
            return {
                totalSales: totalSales || 0,
                totalCustomers: totalCustomers || 0,
                wasteRate: isNaN(wasteRate) ? 0 : wasteRate,
                soldoutCount: soldoutCount || 0,
                salesTrend: 0, // 前日比などから計算
                customerTrend: 0,
                soldoutTrend: 0
            };
        } catch (error) {
            console.error('Summary calculation failed:', error);
            return {
                totalSales: 0,
                totalCustomers: 0,
                wasteRate: 0,
                soldoutCount: 0,
                salesTrend: 0,
                customerTrend: 0,
                soldoutTrend: 0
            };
        }
    }

    /**
     * サマリーカードの更新
     */
    updateSummaryCards() {
        try {
            const summary = this.calculateSummary();
            
            const updates = [
                {
                    value: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(summary.totalSales)
                },
                {
                    value: summary.totalCustomers.toString()
                },
                {
                    value: `${summary.wasteRate.toFixed(1)}%`
                },
                {
                    value: `${summary.soldoutCount}品`
                }
            ];
            
            if (this.summaryCards && Array.isArray(this.summaryCards)) {
                this.summaryCards.forEach((card, index) => {
                    if (updates[index] && card && typeof card.update === 'function') {
                        try {
                            card.update({
                                content: `
                                    <div class="kpi-value">${updates[index].value}</div>
                                    <div class="kpi-trend neutral">
                                        → 0%
                                    </div>
                                `
                            });
                        } catch (cardError) {
                            console.error('Card update failed:', cardError);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Summary cards update failed:', error);
        }
    }

    /**
     * イベントリスナーの設定
     */
    attachEventListeners() {
        // アクションボタン
        document.getElementById('save-btn')?.addEventListener('click', () => {
            this.saveData();
        });
        
        document.getElementById('sync-btn')?.addEventListener('click', () => {
            this.syncToOrderSystem();
        });
        
        document.getElementById('export-btn')?.addEventListener('click', () => {
            this.exportToCSV();
        });
        
        document.getElementById('reset-btn')?.addEventListener('click', () => {
            this.resetData();
        });
        
        // 基本情報の変更監視
        ['target-date', 'weather', 'temperature'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.markDirty();
                });
            }
        });
    }

    /**
     * データ保存
     * @returns {Promise<void>}
     */
    async saveData() {
        try {
            const saveBtn = document.getElementById('save-btn');
            saveBtn.disabled = true;
            saveBtn.textContent = '💾 保存中...';
            
            const allData = this.getAllData();
            await this.performanceService.savePerformanceData(allData);
            
            Alert.success('データを保存しました').mount();
            this.clearDirty();
            
            // イベント発火
            if (window.eventBus) {
                window.eventBus.emit('performance.saved', allData);
            }
            
        } catch (error) {
            console.error('Save failed:', error);
            Alert.error('データの保存に失敗しました').mount();
        } finally {
            const saveBtn = document.getElementById('save-btn');
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 データ保存';
        }
    }

    /**
     * 発注システムとの同期
     * @returns {Promise<void>}
     */
    async syncToOrderSystem() {
        try {
            const allData = this.getAllData();
            
            // イベントバスで他システムに通知
            if (window.eventBus) {
                window.eventBus.emit('performance.syncToOrder', allData);
            }
            
            Alert.success('発注システムと同期しました').mount();
            
        } catch (error) {
            console.error('Sync failed:', error);
            Alert.error('同期に失敗しました').mount();
        }
    }

    /**
     * CSV出力
     */
    exportToCSV() {
        try {
            let csvData = '';
            
            // InventoryServiceが利用できる場合
            if (window.InventoryService && typeof window.InventoryService.exportToCSV === 'function') {
                csvData = window.InventoryService.exportToCSV(this.performanceData || []);
            } else {
                // フォールバック：独自実装
                csvData = this.generateCSVData();
            }
            
            // BOM（Byte Order Mark）を追加して文字化けを防止
            const bom = '\uFEFF';
            const csvWithBom = bom + csvData;
            
            const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `performance_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // URLを解放してメモリリークを防ぐ
            URL.revokeObjectURL(url);
            
            Alert.success('CSVファイルをダウンロードしました').mount();
            
        } catch (error) {
            console.error('Export failed:', error);
            Alert.error('CSV出力に失敗しました').mount();
        }
    }
    
    /**
     * CSV データを生成（フォールバック用）
     * @returns {string} CSV文字列
     */
    generateCSVData() {
        const headers = [
            '商品コード', '商品名', '単価', '前日残', '入荷', '移動', 
            '販売数', 'ロス数', '当日在庫', '完売時間', 'メモ'
        ];
        
        const performanceData = this.performanceData || [];
        
        // ヘッダー行
        let csvData = headers.join(',') + '\n';
        
        // データ行
        performanceData.forEach(row => {
            const csvRow = [
                this.escapeCsvValue(row.code || ''),
                this.escapeCsvValue(row.name || ''),
                row.price || 0,
                row.prevStock || 0,
                row.delivery || 0,
                row.movement || 0,
                row.sales || 0,
                row.waste || 0,
                row.currentStock || 0,
                this.escapeCsvValue(row.soldoutTime || ''),
                this.escapeCsvValue(row.memo || '')
            ];
            csvData += csvRow.join(',') + '\n';
        });
        
        // 時間帯別売上データも含める
        if (this.hourlySalesData && this.hourlySalesData.length > 0) {
            csvData += '\n時間帯別売上\n';
            csvData += '時間帯,売上金額,客数,構成比,累計\n';
            
            this.hourlySalesData.forEach(row => {
                const csvRow = [
                    this.escapeCsvValue(row.hour || ''),
                    row.amount || 0,
                    row.customers || 0,
                    this.escapeCsvValue(row.composition || ''),
                    row.cumulative || 0
                ];
                csvData += csvRow.join(',') + '\n';
            });
        }
        
        return csvData;
    }
    
    /**
     * CSV値をエスケープ
     * @param {any} value - エスケープする値
     * @returns {string} エスケープされた値
     */
    escapeCsvValue(value) {
        const stringValue = String(value || '');
        
        // カンマ、改行、ダブルクォートが含まれている場合はダブルクォートで囲む
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            // ダブルクォートは二重にエスケープ
            return '"' + stringValue.replace(/"/g, '""') + '"';
        }
        
        return stringValue;
    }

    /**
     * データリセット
     */
    resetData() {
        if (confirm('すべてのデータをリセットしますか？')) {
            this.performResetData();
        }
    }

    /**
     * データリセット実行
     */
    async performResetData() {
        try {
            await this.loadInitialData();
            
            if (this.mainTable && typeof this.mainTable.updateData === 'function') {
                this.mainTable.updateData(this.performanceData || []);
            }
            
            if (this.hourlySalesTable && typeof this.hourlySalesTable.updateData === 'function') {
                this.hourlySalesTable.updateData(this.hourlySalesData || []);
            }
            
            this.updateSummaryCards();
            this.clearDirty();
            
            Alert.success('データをリセットしました').mount();
        } catch (error) {
            console.error('Reset failed:', error);
            Alert.error('リセットに失敗しました').mount();
        }
    }

    /**
     * 全データ取得
     * @returns {Object} 全データ
     */
    getAllData() {
        return {
            targetDate: document.getElementById('target-date')?.value,
            weather: document.getElementById('weather')?.value,
            temperature: document.getElementById('temperature')?.value,
            performance: this.performanceData,
            hourlySales: this.hourlySalesData,
            validationErrors: this.validationErrors
        };
    }

    /**
     * 変更フラグ設定
     */
    markDirty() {
        document.body.classList.add('data-dirty');
        
        // 自動保存タイマー リセット
        if (this.autoSave) {
            this.startAutoSave();
        }
    }

    /**
     * 変更フラグクリア
     */
    clearDirty() {
        document.body.classList.remove('data-dirty');
    }

    /**
     * 自動保存開始
     */
    startAutoSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        
        this.saveTimer = setTimeout(() => {
            if (document.body.classList.contains('data-dirty')) {
                this.saveData();
            }
        }, this.saveInterval);
    }

    /**
     * システム破棄
     */
    destroy() {
        // 自動保存停止
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        
        // ヘッダー破棄
        if (this.header) {
            this.header.destroy();
        }
        
        // テーブル破棄
        if (this.mainTable) {
            this.mainTable.destroy();
        }
        
        if (this.hourlySalesTable) {
            this.hourlySalesTable.destroy();
        }
        
        // サマリーカード破棄
        this.summaryCards.forEach(card => card.destroy());
    }
}

/**
 * PerformanceInputService - 実績入力用データサービス
 */
class PerformanceInputService {
    async getTodayPerformance() {
        // モックデータ（idを追加）
        return [
            { id: '2408', code: '2408', name: 'デンマークCC', price: 1200, prevStock: 10, delivery: 8, movement: 0, sales: 12, waste: 1, currentStock: 5, soldoutTime: '18:30', memo: '' },
            { id: '1001', code: '1001', name: 'レアチーズC', price: 1000, prevStock: 8, delivery: 10, movement: 0, sales: 15, waste: 0, currentStock: 3, soldoutTime: '19:00', memo: '' },
            { id: '3201', code: '3201', name: 'カスタードプリン', price: 480, prevStock: 15, delivery: 20, movement: 0, sales: 25, waste: 2, currentStock: 8, soldoutTime: '', memo: '' }
        ];
    }
    
    async getHourlySales() {
        // モックデータ（idを追加）
        return [
            { id: 'h10', hour: '10:00', amount: 45000, customers: 12, composition: '', cumulative: 0 },
            { id: 'h11', hour: '11:00', amount: 67000, customers: 18, composition: '', cumulative: 0 },
            { id: 'h12', hour: '12:00', amount: 98000, customers: 25, composition: '', cumulative: 0 },
            { id: 'h13', hour: '13:00', amount: 123000, customers: 32, composition: '', cumulative: 0 },
            { id: 'h14', hour: '14:00', amount: 89000, customers: 22, composition: '', cumulative: 0 }
        ];
    }
    
    async savePerformanceData(data) {
        // API呼び出しのモック
        return new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceInput, PerformanceInputService };
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.PerformanceInput = PerformanceInput;
    window.PerformanceInputService = PerformanceInputService;
}