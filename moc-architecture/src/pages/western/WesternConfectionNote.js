/**
 * WesternConfectionNote Page - 洋生ノートページコンポーネント
 * MOCアーキテクチャのページレベルコンポーネント
 */
class WesternConfectionNote {
    constructor(options = {}) {
        this.container = options.container || 'body';
        this.header = null;
        this.mainTable = null;
        this.summaryCards = [];
        
        // 設定
        this.autoSave = options.autoSave !== false;
        this.saveInterval = options.saveInterval || 30000; // 30秒
        this.saveTimer = null;
        
        // データ
        this.confectionData = null;
        this.headerInfo = {
            date: new Date().toISOString().slice(0, 10),
            dayOfWeek: this.getDayOfWeek(),
            weather: '晴れ',
            temperature: 25,
            productCategory: '洋生商品'
        };
        
        // サービス
        this.confectionService = null;
    }

    /**
     * 曜日を取得
     * @returns {string} 曜日
     */
    getDayOfWeek() {
        const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
        const today = new Date();
        return days[today.getDay()];
    }

    /**
     * 洋生ノートシステムを初期化
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // サービスの初期化
            this.confectionService = new WesternConfectionService();
            
            // レイアウトの構築
            this.buildLayout();
            
            // ヘッダーの初期化
            this.initHeader();
            
            // データの初期読み込み
            await this.loadInitialData();
            
            // メインテーブルの構築
            this.buildMainTable();
            
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
                window.eventBus.emit('westernConfection.loaded');
            }
            
        } catch (error) {
            console.error('WesternConfectionNote initialization failed:', error);
            Alert.error('洋生ノートの初期化に失敗しました').mount();
            throw error;
        }
    }

    /**
     * レイアウトの基本構造を構築
     */
    buildLayout() {
        const container = typeof this.container === 'string' ? 
            document.querySelector(this.container) : this.container;
            
        container.innerHTML = `
            <div class="western-confection-layout">
                <div id="western-header"></div>
                
                <main class="western-main">
                    <div class="western-content">
                        <!-- Header Info Section -->
                        <section class="confection-info">
                            <div class="container">
                                <h2 class="section-title">🧁 洋生ノート管理</h2>
                                <div class="info-header-grid">
                                    <div class="info-item">
                                        <label>対象日</label>
                                        <input type="date" id="target-date" class="form-input" value="${this.headerInfo.date}">
                                    </div>
                                    <div class="info-item">
                                        <label>曜日</label>
                                        <input type="text" id="day-of-week" class="form-input" value="${this.headerInfo.dayOfWeek}" readonly>
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
                                        <input type="number" id="temperature" class="form-input" min="-10" max="40" value="${this.headerInfo.temperature}">
                                    </div>
                                    <div class="info-item">
                                        <label>商品区分</label>
                                        <input type="text" id="product-category" class="form-input" value="${this.headerInfo.productCategory}" readonly>
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        <!-- Summary Cards -->
                        <section class="confection-summary">
                            <div class="container">
                                <h2 class="section-title">📊 集計サマリー</h2>
                                <div id="summary-cards-container" class="summary-cards-grid"></div>
                            </div>
                        </section>
                        
                        <!-- Main Table Section -->
                        <section class="confection-table">
                            <div class="container">
                                <h2 class="section-title">📋 商品別詳細管理</h2>
                                <div class="table-controls">
                                    <button id="add-product-btn" class="btn btn-secondary">➕ 商品追加</button>
                                    <button id="recalculate-btn" class="btn btn-secondary">🧮 再計算</button>
                                </div>
                                <div id="main-table-container"></div>
                            </div>
                        </section>
                        
                        <!-- Actions -->
                        <section class="confection-actions">
                            <div class="container">
                                <div class="actions-bar">
                                    <button id="save-confection-btn" class="btn btn-primary">💾 データ保存</button>
                                    <button id="export-confection-btn" class="btn btn-secondary">📤 CSV出力</button>
                                    <button id="sync-to-performance-btn" class="btn btn-secondary">🔄 実績入力へ送信</button>
                                    <button id="reset-confection-btn" class="btn btn-warning">🔄 リセット</button>
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
            subtitle: '洋生ノート',
            menuItems: [
                { label: 'ダッシュボード', icon: '📊', href: 'index-moc.html' },
                { label: '実績入力', icon: '📝', href: 'performance-input-moc.html' },
                { label: '発注シミュレーション', icon: '🔄', href: 'order-simulation-moc.html' },
                { label: '洋生ノート', icon: '🧁', href: 'western-confection-note-moc.html', active: true },
                { label: '過去データ分析', icon: '📈', href: 'historical-analysis-moc.html' },
                { label: 'マスタメンテナンス', icon: '🔧', href: 'master-maintenance-moc.html' }
            ]
        });
        
        this.header.mount('#western-header');
    }

    /**
     * 初期データを読み込み
     * @returns {Promise<void>}
     */
    async loadInitialData() {
        try {
            this.confectionData = await this.confectionService.getConfectionData();
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
                { key: 'code', label: '商品C', type: 'text', width: '70px', required: true },
                { key: 'name', label: '商品名', type: 'text', width: '120px', required: true },
                { key: 'price', label: '単価', type: 'currency', width: '80px' },
                { key: 'plan', label: '計画数(A)', type: 'number', width: '80px', editable: true },
                { key: 'order', label: '発注数(B)', type: 'number', width: '80px', editable: true },
                { key: 'movement', label: '移動数(C)', type: 'number', width: '80px', editable: true },
                { key: 'afterMovement', label: '移動後在庫(D)', type: 'number', width: '100px', calculated: true },
                { key: 'tasting', label: '試食(E)', type: 'number', width: '60px', editable: true },
                { key: 'dayStock', label: '当日在庫残(F)', type: 'number', width: '100px', calculated: true },
                { key: 'orderRemain', label: '発注残数(G)', type: 'number', width: '80px', calculated: true },
                { key: 'endStock', label: '当日終在庫(H)', type: 'number', width: '100px', calculated: true },
                { key: 'reservation', label: '予約(I)', type: 'number', width: '60px', editable: true },
                { key: 'special', label: '特注(J)', type: 'number', width: '60px', editable: true },
                { key: 'forecast', label: '予想/実績', type: 'number', width: '80px', editable: true },
                { key: 'soldoutTime', label: '完売時間', type: 'time', width: '80px', editable: true }
            ];
            
            // データにidを追加
            if (this.confectionData && Array.isArray(this.confectionData)) {
                this.confectionData.forEach((row, index) => {
                    if (!row.id) {
                        row.id = row.code || `confection-${index}`;
                    }
                });
            }
            
            this.mainTable = new Table({
                columns: columns,
                data: this.confectionData || [],
                editable: true,
                sortable: true,
                onRowUpdate: this.handleRowUpdate.bind(this),
                className: 'confection-table'
            });
            
            const container = document.getElementById('main-table-container');
            if (container) {
                this.mainTable.mount('#main-table-container');
            }
        } catch (error) {
            console.error('Main table build failed:', error);
            const container = document.getElementById('main-table-container');
            if (container) {
                container.innerHTML = '<div class="table-error">洋生ノートテーブルの作成に失敗しました</div>';
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
                key: 'totalPlan',
                icon: '📋',
                label: '計画数合計',
                value: `${summary.totalPlan}個`,
                trend: 0
            },
            {
                key: 'totalOrder',
                icon: '🛒',
                label: '発注数合計',
                value: `${summary.totalOrder}個`,
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
                key: 'categoryCount',
                icon: '🏷️',
                label: 'カテゴリ数',
                value: `${summary.categoryCount}種類`,
                trend: 0
            },
            {
                key: 'itemCount',
                icon: '📦',
                label: '商品アイテム数',
                value: `${summary.itemCount}品`,
                trend: 0
            },
            {
                key: 'avgPrice',
                icon: '💱',
                label: '平均単価',
                value: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(summary.avgPrice),
                trend: 0
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
     * 行更新ハンドラー
     * @param {Object} row - 更新された行データ
     * @param {string} column - 更新されたカラム
     * @param {any} value - 新しい値
     */
    handleRowUpdate(row, column, value) {
        try {
            // 数値フィールドの処理
            if (['plan', 'order', 'movement', 'tasting', 'reservation', 'special', 'forecast'].includes(column)) {
                const numValue = parseFloat(value) || 0;
                row[column] = numValue;
            } else {
                row[column] = value;
            }
            
            // 自動計算の実行
            this.performRowCalculations(row);
            
            // サマリー更新
            this.updateSummaryCards();
            
            // データ変更イベント発火
            if (window.eventBus) {
                window.eventBus.emit('westernConfection.rowUpdated', { row, column, value });
            }
            
            // 自動保存フラグ設定
            this.markDirty();
        } catch (error) {
            console.error('Row update failed:', error, { row, column, value });
            Alert.error('データの更新に失敗しました').mount();
        }
    }

    /**
     * 行の計算処理
     * @param {Object} row - 行データ
     */
    performRowCalculations(row) {
        try {
            // 移動後在庫(D) = 発注数(B) + 移動数(C)
            row.afterMovement = (parseFloat(row.order) || 0) + (parseFloat(row.movement) || 0);
            
            // 当日在庫残(F) = 移動後在庫(D)
            row.dayStock = row.afterMovement;
            
            // 発注残数(G) = 基本的に0（特殊な場合のみ手動入力）
            if (!row.orderRemain) {
                row.orderRemain = 0;
            }
            
            // 当日終在庫(H) = 当日在庫残(F) - 試食(E) - 売上実績
            const salesActual = parseFloat(row.forecast) || 0;
            const tastingAmount = parseFloat(row.tasting) || 0;
            const dayStockAmount = parseFloat(row.dayStock) || 0;
            
            row.endStock = Math.max(0, dayStockAmount - tastingAmount - salesActual);
        } catch (error) {
            console.error('Row calculation failed:', error, row);
            // フォールバック値を設定
            row.afterMovement = row.afterMovement || 0;
            row.dayStock = row.dayStock || 0;
            row.orderRemain = row.orderRemain || 0;
            row.endStock = row.endStock || 0;
        }
    }

    /**
     * セルレンダラー
     * @param {any} value - セルの値
     * @param {string} column - カラム名
     * @param {Object} row - 行データ
     * @returns {string} レンダリング結果
     */
    renderConfectionCell(value, column, row) {
        // 計算フィールドは編集不可でグレー表示
        if (['afterMovement', 'dayStock', 'orderRemain', 'endStock'].includes(column)) {
            return `<span class="calculated-value">${value || 0}</span>`;
        }
        
        // 完売時間は特別なフォーマット
        if (column === 'soldoutTime') {
            return value ? `<span class="soldout-time">${value}</span>` : '';
        }
        
        return value;
    }

    /**
     * サマリー計算
     * @returns {Object} サマリーデータ
     */
    calculateSummary() {
        try {
            if (!this.confectionData || !Array.isArray(this.confectionData)) {
                return {
                    totalPlan: 0,
                    totalOrder: 0,
                    totalAmount: 0,
                    categoryCount: 0,
                    itemCount: 0,
                    avgPrice: 0
                };
            }

            const totalPlan = this.confectionData.reduce((sum, row) => sum + (parseFloat(row.plan) || 0), 0);
            const totalOrder = this.confectionData.reduce((sum, row) => sum + (parseFloat(row.order) || 0), 0);
            const totalAmount = this.confectionData.reduce((sum, row) => {
                const order = parseFloat(row.order) || 0;
                const price = parseFloat(row.price) || 0;
                return sum + (order * price);
            }, 0);
            
            // カテゴリ数の計算（簡易的に商品名のプレフィックスで判定）
            const categories = new Set(this.confectionData.map(row => {
                const name = row.name || '';
                if (name.includes('デンマーク')) return 'デンマーク関連';
                if (name.includes('プリン') || name.includes('マフィン')) return '洋菓子限定';
                if (name.includes('ゼリー') || name.includes('マンゴー') || name.includes('メロン')) return 'ゼリー';
                return 'その他';
            }));
            
            const itemCount = this.confectionData.length;
            const avgPrice = totalOrder > 0 ? totalAmount / totalOrder : 0;
            
            return {
                totalPlan,
                totalOrder,
                totalAmount,
                categoryCount: categories.size,
                itemCount,
                avgPrice
            };
        } catch (error) {
            console.error('Summary calculation failed:', error);
            return {
                totalPlan: 0,
                totalOrder: 0,
                totalAmount: 0,
                categoryCount: 0,
                itemCount: 0,
                avgPrice: 0
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
                { value: `${summary.totalPlan}個` },
                { value: `${summary.totalOrder}個` },
                { value: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(summary.totalAmount) },
                { value: `${summary.categoryCount}種類` },
                { value: `${summary.itemCount}品` },
                { value: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(summary.avgPrice) }
            ];
            
            if (this.summaryCards && Array.isArray(this.summaryCards)) {
                this.summaryCards.forEach((card, index) => {
                    if (updates[index] && card && typeof card.update === 'function') {
                        try {
                            card.update({
                                content: `
                                    <div class="kpi-value">${updates[index].value}</div>
                                    <div class="kpi-trend neutral">
                                        → 最新
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
     * 曜日取得
     * @returns {string} 曜日
     */
    getDayOfWeek() {
        const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
        return days[new Date().getDay()];
    }

    /**
     * イベントリスナーの設定
     */
    attachEventListeners() {
        // 商品追加
        document.getElementById('add-product-btn')?.addEventListener('click', () => {
            this.addProduct();
        });
        
        // 再計算
        document.getElementById('recalculate-btn')?.addEventListener('click', () => {
            this.recalculateAll();
        });
        
        // アクションボタン
        document.getElementById('save-confection-btn')?.addEventListener('click', () => {
            this.saveData();
        });
        
        document.getElementById('export-confection-btn')?.addEventListener('click', () => {
            this.exportToCSV();
        });
        
        document.getElementById('sync-to-performance-btn')?.addEventListener('click', () => {
            this.syncToPerformance();
        });
        
        document.getElementById('reset-confection-btn')?.addEventListener('click', () => {
            this.resetData();
        });
        
        // ヘッダー情報の変更監視
        ['target-date', 'weather', 'temperature'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.headerInfo[id.replace('-', '')] = e.target.value;
                    
                    // 日付変更時は曜日も更新
                    if (id === 'target-date') {
                        const date = new Date(e.target.value);
                        const dayOfWeek = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'][date.getDay()];
                        document.getElementById('day-of-week').value = dayOfWeek;
                        this.headerInfo.dayOfWeek = dayOfWeek;
                    }
                    
                    this.markDirty();
                });
            }
        });
    }

    /**
     * 商品追加
     */
    addProduct() {
        const newProduct = {
            code: '',
            name: '',
            price: 0,
            plan: 0,
            order: 0,
            movement: 0,
            afterMovement: 0,
            tasting: 0,
            dayStock: 0,
            orderRemain: 0,
            endStock: 0,
            reservation: 0,
            special: 0,
            forecast: 0,
            soldoutTime: ''
        };
        
        this.confectionData.push(newProduct);
        this.mainTable.updateData(this.confectionData);
        this.updateSummaryCards();
        
        Alert.success('新しい商品行を追加しました').mount();
    }

    /**
     * 全体再計算
     */
    recalculateAll() {
        this.confectionData.forEach(row => {
            this.performRowCalculations(row);
        });
        
        this.mainTable.updateData(this.confectionData);
        this.updateSummaryCards();
        
        Alert.success('全ての計算を再実行しました').mount();
    }

    /**
     * データ保存
     * @returns {Promise<void>}
     */
    async saveData() {
        try {
            const saveBtn = document.getElementById('save-confection-btn');
            saveBtn.disabled = true;
            saveBtn.textContent = '💾 保存中...';
            
            const allData = this.getAllData();
            await this.confectionService.saveConfectionData(allData);
            
            Alert.success('洋生ノートデータを保存しました').mount();
            this.clearDirty();
            
            // イベント発火
            if (window.eventBus) {
                window.eventBus.emit('westernConfection.saved', allData);
            }
            
        } catch (error) {
            console.error('Save failed:', error);
            Alert.error('データの保存に失敗しました').mount();
        } finally {
            const saveBtn = document.getElementById('save-confection-btn');
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 データ保存';
        }
    }

    /**
     * CSV出力
     */
    exportToCSV() {
        try {
            const csvData = this.confectionService.exportToCSV(this.confectionData, this.headerInfo);
            
            // BOM（Byte Order Mark）を追加して文字化けを防止
            const bom = '\uFEFF';
            const csvWithBom = bom + csvData;
            
            const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `western_confection_${this.headerInfo.date}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // URLを解放してメモリリークを防ぐ
            URL.revokeObjectURL(url);
            
            Alert.success('洋生ノートCSVをダウンロードしました').mount();
            
        } catch (error) {
            console.error('Export failed:', error);
            Alert.error('CSV出力に失敗しました').mount();
        }
    }

    /**
     * 実績入力システムとの同期
     */
    syncToPerformance() {
        try {
            const syncData = this.getAllData();
            
            // イベントバスで実績入力システムに通知
            if (window.eventBus) {
                window.eventBus.emit('westernConfection.syncToPerformance', syncData);
            }
            
            Alert.success('実績入力システムと同期しました').mount();
            
        } catch (error) {
            console.error('Sync failed:', error);
            Alert.error('同期に失敗しました').mount();
        }
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
                this.mainTable.updateData(this.confectionData);
            }
            
            this.updateSummaryCards();
            this.clearDirty();
            
            Alert.success('洋生ノートデータをリセットしました').mount();
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
            headerInfo: this.headerInfo,
            confectionData: this.confectionData,
            summary: this.calculateSummary()
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
        
        // サマリーカード破棄
        this.summaryCards.forEach(card => card.destroy());
    }
}

/**
 * WesternConfectionService - 洋生ノート用データサービス
 */
class WesternConfectionService {
    async getConfectionData() {
        // モックデータ（15列対応）
        return [
            // デンマーク関連
            { code: '2408', name: 'デンマークCC', price: 1200, plan: 8, order: 8, movement: 0, afterMovement: 8, tasting: 1, dayStock: 8, orderRemain: 0, endStock: 6, reservation: 2, special: 1, forecast: 12, soldoutTime: '18:30' },
            { code: '1001', name: 'レアチーズC', price: 1000, plan: 10, order: 10, movement: 0, afterMovement: 10, tasting: 0, dayStock: 10, orderRemain: 0, endStock: 2, reservation: 3, special: 0, forecast: 15, soldoutTime: '19:00' },
            
            // 洋菓子限定
            { code: '3201', name: 'カスタードプリン', price: 480, plan: 20, order: 20, movement: 0, afterMovement: 20, tasting: 2, dayStock: 20, orderRemain: 0, endStock: 8, reservation: 5, special: 2, forecast: 25, soldoutTime: '' },
            { code: '3202', name: 'とろ生カスタード', price: 520, plan: 15, order: 15, movement: 0, afterMovement: 15, tasting: 1, dayStock: 15, orderRemain: 0, endStock: 4, reservation: 3, special: 1, forecast: 18, soldoutTime: '' },
            { code: '3203', name: '復刻カスタードP', price: 500, plan: 12, order: 12, movement: 0, afterMovement: 12, tasting: 1, dayStock: 12, orderRemain: 0, endStock: 3, reservation: 2, special: 0, forecast: 14, soldoutTime: '' },
            { code: '3301', name: '濃厚あまプリン', price: 550, plan: 10, order: 10, movement: 0, afterMovement: 10, tasting: 1, dayStock: 10, orderRemain: 0, endStock: 2, reservation: 1, special: 0, forecast: 12, soldoutTime: '' },
            { code: '3401', name: 'マフィン', price: 350, plan: 25, order: 25, movement: 0, afterMovement: 25, tasting: 2, dayStock: 25, orderRemain: 0, endStock: 8, reservation: 4, special: 1, forecast: 28, soldoutTime: '' },
            { code: '3501', name: '完熟マンゴーP', price: 480, plan: 18, order: 18, movement: 0, afterMovement: 18, tasting: 1, dayStock: 18, orderRemain: 0, endStock: 5, reservation: 2, special: 0, forecast: 20, soldoutTime: '' },
            
            // ゼリー
            { code: '4101', name: 'マンゴー&オレンジ', price: 270, plan: 35, order: 35, movement: 0, afterMovement: 35, tasting: 2, dayStock: 35, orderRemain: 0, endStock: 12, reservation: 6, special: 1, forecast: 40, soldoutTime: '' },
            { code: '4102', name: 'メロン&白桃', price: 270, plan: 30, order: 30, movement: 0, afterMovement: 30, tasting: 1, dayStock: 30, orderRemain: 0, endStock: 10, reservation: 4, special: 0, forecast: 35, soldoutTime: '' },
            
            // その他
            { code: '5101', name: '白くまプリン', price: 450, plan: 8, order: 8, movement: 0, afterMovement: 8, tasting: 0, dayStock: 8, orderRemain: 0, endStock: 3, reservation: 1, special: 0, forecast: 10, soldoutTime: '' },
            { code: '5201', name: 'プリンのトルテ', price: 580, plan: 6, order: 6, movement: 0, afterMovement: 6, tasting: 1, dayStock: 6, orderRemain: 0, endStock: 1, reservation: 1, special: 1, forecast: 8, soldoutTime: '' }
        ];
    }
    
    async saveConfectionData(data) {
        // API呼び出しのモック
        return new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    exportToCSV(confectionData, headerInfo) {
        const headers = [
            '商品C', '商品名', '単価', '計画数(A)', '発注数(B)', '移動数(C)', '移動後在庫(D)', 
            '試食(E)', '当日在庫残(F)', '発注残数(G)', '当日終在庫(H)', '予約(I)', '特注(J)', 
            '予想/実績', '完売時間'
        ];
        
        const csvContent = [
            `# 洋生ノート - ${headerInfo.date} (${headerInfo.dayOfWeek})`,
            `# 天気: ${headerInfo.weather}, 気温: ${headerInfo.temperature}℃, 商品区分: ${headerInfo.productCategory}`,
            '',
            headers.join(','),
            ...confectionData.map(row => [
                row.code, `"${row.name}"`, row.price, row.plan, row.order, row.movement,
                row.afterMovement, row.tasting, row.dayStock, row.orderRemain, row.endStock,
                row.reservation, row.special, row.forecast, `"${row.soldoutTime || ''}"`
            ].join(','))
        ].join('\n');
        
        return csvContent;
    }
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WesternConfectionNote, WesternConfectionService };
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.WesternConfectionNote = WesternConfectionNote;
    window.WesternConfectionService = WesternConfectionService;
}