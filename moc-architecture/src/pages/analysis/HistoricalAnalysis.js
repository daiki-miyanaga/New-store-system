/**
 * HistoricalAnalysis Page - 過去データ分析ページコンポーネント
 * MOCアーキテクチャのページレベルコンポーネント
 */
class HistoricalAnalysis {
    constructor(options = {}) {
        this.container = options.container || 'body';
        this.header = null;
        this.searchForm = null;
        this.dataTable = null;
        this.analysisCharts = [];
        this.summaryCards = [];
        
        // 設定
        this.defaultDateRange = options.defaultDateRange || 30; // 30日間
        this.maxDateRange = options.maxDateRange || 365; // 1年間
        
        // データ
        this.historicalData = [];
        this.filteredData = [];
        this.searchCriteria = {
            startDate: '',
            endDate: '',
            category: '',
            productName: '',
            viewMode: 'daily'
        };
        this.analysisSummary = null;
        
        // サービス
        this.analysisService = null;
    }

    /**
     * 過去データ分析システムを初期化
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // サービスの初期化
            this.analysisService = new HistoricalAnalysisService();
            
            // レイアウトの構築
            this.buildLayout();
            
            // ヘッダーの初期化
            this.initHeader();
            
            // デフォルト検索条件の設定
            this.setDefaultSearchCriteria();
            
            // 検索フォームの構築
            this.buildSearchForm();
            
            // データテーブルの構築
            this.buildDataTable();
            
            // 分析チャートの構築
            this.buildAnalysisCharts();
            
            // サマリーカードの構築
            this.buildSummaryCards();
            
            // 初期データの読み込み
            await this.performSearch();
            
            // イベントリスナーの設定
            this.attachEventListeners();
            
            // ページ読み込み完了イベント
            if (window.eventBus) {
                window.eventBus.emit('historicalAnalysis.loaded');
            }
            
        } catch (error) {
            console.error('HistoricalAnalysis initialization failed:', error);
            Alert.error('過去データ分析の初期化に失敗しました').mount();
        }
    }

    /**
     * レイアウトの基本構造を構築
     */
    buildLayout() {
        const container = typeof this.container === 'string' ? 
            document.querySelector(this.container) : this.container;
            
        container.innerHTML = `
            <div class="historical-analysis-layout">
                <div id="analysis-header"></div>
                
                <main class="analysis-main">
                    <div class="analysis-content">
                        <!-- Search Section -->
                        <section class="analysis-search">
                            <div class="container">
                                <h2 class="section-title">🔍 検索・フィルタ条件</h2>
                                <div id="search-form-container" class="search-form-container"></div>
                            </div>
                        </section>
                        
                        <!-- Analysis Summary -->
                        <section class="analysis-summary">
                            <div class="container">
                                <h2 class="section-title">📊 分析サマリー</h2>
                                <div id="summary-cards-container" class="summary-cards-grid"></div>
                            </div>
                        </section>
                        
                        <!-- Data Table Section -->
                        <section class="analysis-data">
                            <div class="container">
                                <h2 class="section-title">📋 データ一覧</h2>
                                <div class="data-controls">
                                    <div class="control-group">
                                        <label>表示方式</label>
                                        <select id="view-mode" class="form-input">
                                            <option value="daily">日別表示</option>
                                            <option value="comparison">比較表示</option>
                                            <option value="summary">サマリー表示</option>
                                        </select>
                                    </div>
                                    <div class="control-group">
                                        <button id="export-btn" class="btn btn-secondary">📤 CSV出力</button>
                                        <button id="report-btn" class="btn btn-secondary">📄 レポート生成</button>
                                    </div>
                                </div>
                                <div id="data-table-container"></div>
                            </div>
                        </section>
                        
                        <!-- Charts Section -->
                        <section class="analysis-charts">
                            <div class="container">
                                <h2 class="section-title">📈 データ分析チャート</h2>
                                <div class="charts-grid">
                                    <div class="chart-container">
                                        <h3 class="chart-title">日別売上推移</h3>
                                        <div id="sales-trend-chart"></div>
                                    </div>
                                    <div class="chart-container">
                                        <h3 class="chart-title">完売時間分析</h3>
                                        <div id="soldout-analysis-chart"></div>
                                    </div>
                                    <div class="chart-container">
                                        <h3 class="chart-title">商品カテゴリ別構成比</h3>
                                        <div id="category-composition-chart"></div>
                                    </div>
                                    <div class="chart-container">
                                        <h3 class="chart-title">月次売上比較</h3>
                                        <div id="monthly-comparison-chart"></div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        <!-- Forecast Section -->
                        <section class="analysis-forecast">
                            <div class="container">
                                <h2 class="section-title">🔮 売上予測</h2>
                                <div id="forecast-container" class="forecast-panel">
                                    <div class="forecast-controls">
                                        <button id="generate-forecast-btn" class="btn btn-primary">
                                            🔮 AI予測生成
                                        </button>
                                        <select id="forecast-period" class="form-input">
                                            <option value="7">7日後まで</option>
                                            <option value="14">14日後まで</option>
                                            <option value="30">30日後まで</option>
                                        </select>
                                    </div>
                                    <div id="forecast-results" class="forecast-results"></div>
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
            subtitle: '過去データ分析',
            menuItems: [
                { label: 'ダッシュボード', icon: '📊', href: 'index.html' },
                { label: '実績入力', icon: '📝', href: 'performance-input.html' },
                { label: '発注シミュレーション', icon: '🔄', href: 'order-simulation.html' },
                { label: '洋生ノート', icon: '🧁', href: 'western-confection-note.html' },
                { label: '過去データ分析', icon: '📈', href: 'historical-analysis.html', active: true }
            ]
        });
        
        this.header.mount('#analysis-header');
    }

    /**
     * デフォルト検索条件を設定
     */
    setDefaultSearchCriteria() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - this.defaultDateRange);
        
        this.searchCriteria.startDate = startDate.toISOString().slice(0, 10);
        this.searchCriteria.endDate = endDate.toISOString().slice(0, 10);
    }

    /**
     * 検索フォームを構築
     */
    buildSearchForm() {
        const container = document.getElementById('search-form-container');
        if (!container) return;
        
        const formConfig = {
            fields: [
                {
                    key: 'startDate',
                    type: 'date',
                    label: '開始日',
                    value: this.searchCriteria.startDate,
                    required: true
                },
                {
                    key: 'endDate',
                    type: 'date',
                    label: '終了日',
                    value: this.searchCriteria.endDate,
                    required: true
                },
                {
                    key: 'category',
                    type: 'select',
                    label: '商品カテゴリ',
                    options: [
                        { value: '', label: '全て' },
                        { value: 'denmark', label: 'デンマーク関連' },
                        { value: 'confection', label: '洋菓子限定' },
                        { value: 'jelly', label: 'ゼリー' },
                        { value: 'other', label: 'その他' }
                    ],
                    value: this.searchCriteria.category
                },
                {
                    key: 'productName',
                    type: 'text',
                    label: '商品名検索',
                    placeholder: '商品名の一部を入力',
                    value: this.searchCriteria.productName
                }
            ],
            buttons: [
                {
                    type: 'primary',
                    text: '🔍 検索実行',
                    action: 'search'
                },
                {
                    type: 'secondary',
                    text: '🔄 リセット',
                    action: 'reset'
                }
            ],
            onSubmit: this.handleSearchSubmit.bind(this)
        };
        
        this.searchForm = new Form(formConfig);
        this.searchForm.mount(container);
    }

    /**
     * データテーブルを構築
     */
    buildDataTable() {
        const columns = [
            { key: 'date', label: '日付', type: 'date', width: '100px', sortable: true },
            { key: 'dayOfWeek', label: '曜日', type: 'text', width: '60px' },
            { key: 'weather', label: '天気', type: 'text', width: '60px' },
            { key: 'temperature', label: '気温', type: 'number', width: '60px' },
            { key: 'totalSales', label: '総売上', type: 'currency', width: '100px', sortable: true },
            { key: 'totalCustomers', label: '客数', type: 'number', width: '80px', sortable: true },
            { key: 'avgCustomerSpend', label: '客単価', type: 'currency', width: '100px' },
            { key: 'totalItems', label: '総販売数', type: 'number', width: '80px' },
            { key: 'soldoutCount', label: '完売商品数', type: 'number', width: '80px' },
            { key: 'wasteRate', label: 'ロス率', type: 'percentage', width: '80px' }
        ];
        
        this.dataTable = new Table({
            columns: columns,
            data: this.filteredData,
            sortable: true,
            paginated: true,
            pageSize: 20,
            onRowClick: this.handleRowClick.bind(this),
            className: 'analysis-table'
        });
        
        this.dataTable.mount('#data-table-container');
    }

    /**
     * 分析チャートを構築
     */
    buildAnalysisCharts() {
        // チャート構築は検索実行後に行う
        this.analysisCharts = [];
    }

    /**
     * サマリーカードを構築
     */
    buildSummaryCards() {
        const container = document.getElementById('summary-cards-container');
        if (!container) return;
        
        const summaryItems = [
            {
                key: 'analysisDate',
                icon: '📅',
                label: '分析対象日数',
                value: '-',
                trend: 0
            },
            {
                key: 'avgDailySales',
                icon: '💰',
                label: '平均日次売上',
                value: '-',
                trend: 0
            },
            {
                key: 'totalItems',
                icon: '📦',
                label: '商品アイテム数',
                value: '-',
                trend: 0
            },
            {
                key: 'avgSoldoutTime',
                icon: '⏰',
                label: '平均完売時間',
                value: '-',
                trend: 0
            },
            {
                key: 'totalReservations',
                icon: '📋',
                label: '期間予約合計',
                value: '-',
                trend: 0
            },
            {
                key: 'totalSpecialOrders',
                icon: '✨',
                label: '期間特注合計',
                value: '-',
                trend: 0
            }
        ];
        
        this.summaryCards = summaryItems.map(item => {
            const card = Card.createKPICard(item);
            card.mount(container);
            return card;
        });
    }

    /**
     * 検索フォーム送信ハンドラー
     * @param {Object} formData - フォームデータ
     */
    async handleSearchSubmit(formData) {
        try {
            // 検索条件の更新
            Object.assign(this.searchCriteria, formData);
            
            // バリデーション
            if (!this.validateSearchCriteria()) {
                return;
            }
            
            // 検索実行
            await this.performSearch();
            
        } catch (error) {
            console.error('Search failed:', error);
            Alert.error('検索に失敗しました').mount();
        }
    }

    /**
     * 検索条件バリデーション
     * @returns {boolean} バリデーション結果
     */
    validateSearchCriteria() {
        const { startDate, endDate } = this.searchCriteria;
        
        if (!startDate || !endDate) {
            Alert.error('開始日と終了日を入力してください').mount();
            return false;
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = (end - start) / (1000 * 60 * 60 * 24);
        
        if (diffDays < 0) {
            Alert.error('開始日は終了日より前に設定してください').mount();
            return false;
        }
        
        if (diffDays > this.maxDateRange) {
            Alert.error(`検索期間は${this.maxDateRange}日以内で設定してください`).mount();
            return false;
        }
        
        return true;
    }

    /**
     * 検索実行
     * @returns {Promise<void>}
     */
    async performSearch() {
        try {
            // ローディング表示
            const searchBtn = document.querySelector('[data-action="search"]');
            if (searchBtn) {
                searchBtn.disabled = true;
                searchBtn.textContent = '🔍 検索中...';
            }
            
            // データ取得
            const result = await this.analysisService.getHistoricalData(this.searchCriteria);
            
            this.historicalData = result.data;
            this.filteredData = this.applyFilters(this.historicalData);
            this.analysisSummary = result.summary;
            
            // UI更新
            this.updateDataTable();
            this.updateSummaryCards();
            this.updateAnalysisCharts();
            
            Alert.success(`${this.filteredData.length}件のデータを取得しました`).mount();
            
        } catch (error) {
            console.error('Search execution failed:', error);
            Alert.error('データの取得に失敗しました').mount();
        } finally {
            // ローディング解除
            const searchBtn = document.querySelector('[data-action="search"]');
            if (searchBtn) {
                searchBtn.disabled = false;
                searchBtn.textContent = '🔍 検索実行';
            }
        }
    }

    /**
     * フィルタ適用
     * @param {Array} data - 元データ
     * @returns {Array} フィルタ済みデータ
     */
    applyFilters(data) {
        let filtered = [...data];
        
        // 商品名フィルタ
        if (this.searchCriteria.productName) {
            const searchTerm = this.searchCriteria.productName.toLowerCase();
            filtered = filtered.filter(item => 
                item.productName && item.productName.toLowerCase().includes(searchTerm)
            );
        }
        
        return filtered;
    }

    /**
     * データテーブル更新
     */
    updateDataTable() {
        if (this.dataTable) {
            this.dataTable.updateData(this.filteredData);
        }
    }

    /**
     * サマリーカード更新
     */
    updateSummaryCards() {
        if (!this.analysisSummary) return;
        
        const updates = [
            { value: `${this.analysisSummary.analysisDate}日間` },
            { value: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(this.analysisSummary.avgDailySales) },
            { value: `${this.analysisSummary.totalItems}品` },
            { value: this.analysisSummary.avgSoldoutTime },
            { value: `${this.analysisSummary.totalReservations}件` },
            { value: `${this.analysisSummary.totalSpecialOrders}件` }
        ];
        
        this.summaryCards.forEach((card, index) => {
            if (updates[index]) {
                card.update({
                    content: `
                        <div class="kpi-value">${updates[index].value}</div>
                        <div class="kpi-trend neutral">
                            📊 分析結果
                        </div>
                    `
                });
            }
        });
    }

    /**
     * 分析チャート更新
     */
    updateAnalysisCharts() {
        // 既存チャートの破棄
        this.analysisCharts.forEach(chart => chart.destroy());
        this.analysisCharts = [];
        
        if (!this.filteredData || this.filteredData.length === 0) return;
        
        // 日別売上推移チャート
        const salesTrendData = {
            labels: this.filteredData.map(item => item.date),
            datasets: [{
                label: '日別売上',
                data: this.filteredData.map(item => item.totalSales),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true
            }]
        };
        
        const salesTrendChart = MOCChart.lineChart(salesTrendData);
        salesTrendChart.mount('#sales-trend-chart');
        this.analysisCharts.push(salesTrendChart);
        
        // 完売時間分析チャート
        const soldoutTimeData = this.prepareSoldoutTimeData();
        const soldoutChart = MOCChart.barChart(soldoutTimeData);
        soldoutChart.mount('#soldout-analysis-chart');
        this.analysisCharts.push(soldoutChart);
        
        // カテゴリ構成比チャート
        const categoryData = this.prepareCategoryCompositionData();
        const categoryChart = MOCChart.compositionChart(categoryData);
        categoryChart.mount('#category-composition-chart');
        this.analysisCharts.push(categoryChart);
        
        // 月次売上比較チャート
        const monthlyData = this.prepareMonthlyComparisonData();
        const monthlyChart = MOCChart.barChart(monthlyData);
        monthlyChart.mount('#monthly-comparison-chart');
        this.analysisCharts.push(monthlyChart);
    }

    /**
     * 完売時間データ準備
     * @returns {Object} チャートデータ
     */
    prepareSoldoutTimeData() {
        const timeSlots = {
            '15:00-16:00': 0, '16:00-17:00': 0, '17:00-18:00': 0,
            '18:00-19:00': 0, '19:00-20:00': 0, '20:00-21:00': 0
        };
        
        this.filteredData.forEach(item => {
            if (item.soldoutTime) {
                const hour = parseInt(item.soldoutTime.split(':')[0]);
                if (hour >= 15 && hour < 16) timeSlots['15:00-16:00']++;
                else if (hour >= 16 && hour < 17) timeSlots['16:00-17:00']++;
                else if (hour >= 17 && hour < 18) timeSlots['17:00-18:00']++;
                else if (hour >= 18 && hour < 19) timeSlots['18:00-19:00']++;
                else if (hour >= 19 && hour < 20) timeSlots['19:00-20:00']++;
                else if (hour >= 20 && hour < 21) timeSlots['20:00-21:00']++;
            }
        });
        
        return {
            labels: Object.keys(timeSlots),
            datasets: [{
                label: '完売件数',
                data: Object.values(timeSlots),
                backgroundColor: 'rgba(231, 76, 60, 0.7)',
                borderColor: 'rgba(231, 76, 60, 1)'
            }]
        };
    }

    /**
     * カテゴリ構成比データ準備
     * @returns {Object} チャートデータ
     */
    prepareCategoryCompositionData() {
        const categories = {};
        
        this.filteredData.forEach(item => {
            const category = item.category || 'その他';
            categories[category] = (categories[category] || 0) + (item.totalSales || 0);
        });
        
        const total = Object.values(categories).reduce((sum, val) => sum + val, 0);
        const percentages = Object.entries(categories).map(([key, value]) => ({
            category: key,
            percentage: total > 0 ? (value / total) * 100 : 0
        }));
        
        return percentages;
    }

    /**
     * 月次比較データ準備
     * @returns {Object} チャートデータ
     */
    prepareMonthlyComparisonData() {
        const monthlyData = {};
        
        this.filteredData.forEach(item => {
            const month = item.date.slice(0, 7); // YYYY-MM
            monthlyData[month] = (monthlyData[month] || 0) + (item.totalSales || 0);
        });
        
        return {
            labels: Object.keys(monthlyData).sort(),
            datasets: [{
                label: '月次売上',
                data: Object.values(monthlyData),
                backgroundColor: 'rgba(46, 204, 113, 0.7)',
                borderColor: 'rgba(46, 204, 113, 1)'
            }]
        };
    }

    /**
     * 行クリックハンドラー
     * @param {Object} row - 行データ
     */
    handleRowClick(row) {
        // 詳細モーダル表示（実装省略）
        console.log('Row clicked:', row);
        Alert.info(`${row.date}の詳細データを表示します`).mount();
    }

    /**
     * イベントリスナーの設定
     */
    attachEventListeners() {
        // 表示方式変更
        document.getElementById('view-mode')?.addEventListener('change', (e) => {
            this.changeViewMode(e.target.value);
        });
        
        // CSV出力
        document.getElementById('export-btn')?.addEventListener('click', () => {
            this.exportToCSV();
        });
        
        // レポート生成
        document.getElementById('report-btn')?.addEventListener('click', () => {
            this.generateReport();
        });
        
        // AI予測生成
        document.getElementById('generate-forecast-btn')?.addEventListener('click', () => {
            this.generateForecast();
        });
    }

    /**
     * 表示方式変更
     * @param {string} mode - 表示方式
     */
    changeViewMode(mode) {
        console.log('View mode changed to:', mode);
        
        switch (mode) {
            case 'daily':
                this.updateDataTable();
                break;
            case 'comparison':
                this.showComparisonView();
                break;
            case 'summary':
                this.showSummaryView();
                break;
        }
    }

    /**
     * 比較表示
     */
    showComparisonView() {
        // 比較表示の実装
        Alert.info('比較表示機能を実装中です').mount();
    }

    /**
     * サマリー表示
     */
    showSummaryView() {
        // サマリー表示の実装
        Alert.info('サマリー表示機能を実装中です').mount();
    }

    /**
     * CSV出力
     */
    exportToCSV() {
        try {
            const csvData = this.analysisService.exportToCSV(this.filteredData, this.searchCriteria);
            
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `analysis_${this.searchCriteria.startDate}_${this.searchCriteria.endDate}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            Alert.success('分析データをCSV出力しました').mount();
            
        } catch (error) {
            console.error('Export failed:', error);
            Alert.error('CSV出力に失敗しました').mount();
        }
    }

    /**
     * レポート生成
     */
    generateReport() {
        try {
            const reportData = this.analysisService.generateReport(this.filteredData, this.analysisSummary);
            
            // レポート表示（簡易実装）
            const reportWindow = window.open('', '_blank');
            reportWindow.document.write(`
                <html>
                <head>
                    <title>過去データ分析レポート</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        .header { border-bottom: 2px solid #333; padding-bottom: 10px; }
                        .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; }
                        .chart-placeholder { height: 300px; background: #e0e0e0; margin: 20px 0; text-align: center; line-height: 300px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>📊 過去データ分析レポート</h1>
                        <p>対象期間: ${this.searchCriteria.startDate} ～ ${this.searchCriteria.endDate}</p>
                        <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
                    </div>
                    <div class="summary">
                        <h2>🔍 分析サマリー</h2>
                        <p>・分析対象日数: ${this.analysisSummary?.analysisDate || 0}日間</p>
                        <p>・平均日次売上: ${new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(this.analysisSummary?.avgDailySales || 0)}</p>
                        <p>・総データ件数: ${this.filteredData.length}件</p>
                    </div>
                    <div class="chart-placeholder">
                        📈 チャート画像（今後実装予定）
                    </div>
                    ${reportData}
                </body>
                </html>
            `);
            reportWindow.document.close();
            
            Alert.success('レポートを生成しました').mount();
            
        } catch (error) {
            console.error('Report generation failed:', error);
            Alert.error('レポート生成に失敗しました').mount();
        }
    }

    /**
     * AI予測生成
     */
    async generateForecast() {
        try {
            const forecastBtn = document.getElementById('generate-forecast-btn');
            const forecastPeriod = document.getElementById('forecast-period').value;
            
            forecastBtn.disabled = true;
            forecastBtn.textContent = '🔮 予測生成中...';
            
            const forecastResult = await this.analysisService.generateForecast(this.filteredData, forecastPeriod);
            
            this.displayForecastResults(forecastResult);
            
            Alert.success('AI予測を生成しました').mount();
            
        } catch (error) {
            console.error('Forecast generation failed:', error);
            Alert.error('予測生成に失敗しました').mount();
        } finally {
            const forecastBtn = document.getElementById('generate-forecast-btn');
            forecastBtn.disabled = false;
            forecastBtn.textContent = '🔮 AI予測生成';
        }
    }

    /**
     * 予測結果表示
     * @param {Object} forecastResult - 予測結果
     */
    displayForecastResults(forecastResult) {
        const container = document.getElementById('forecast-results');
        if (!container) return;
        
        container.innerHTML = `
            <div class="forecast-summary">
                <h4>🔮 AI売上予測結果</h4>
                <div class="forecast-metrics">
                    <div class="metric">
                        <span class="metric-label">予測期間:</span>
                        <strong>${forecastResult.period}日間</strong>
                    </div>
                    <div class="metric">
                        <span class="metric-label">予測総売上:</span>
                        <strong>${new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(forecastResult.totalForecast)}</strong>
                    </div>
                    <div class="metric">
                        <span class="metric-label">信頼度:</span>
                        <strong>${forecastResult.confidence}%</strong>
                    </div>
                </div>
                <div class="forecast-chart-placeholder">
                    📈 予測チャート（今後Chart.js実装予定）
                </div>
            </div>
        `;
    }

    /**
     * システム破棄
     */
    destroy() {
        // ヘッダー破棄
        if (this.header) {
            this.header.destroy();
        }
        
        // フォーム破棄
        if (this.searchForm) {
            this.searchForm.destroy();
        }
        
        // テーブル破棄
        if (this.dataTable) {
            this.dataTable.destroy();
        }
        
        // チャート破棄
        this.analysisCharts.forEach(chart => chart.destroy());
        
        // カード破棄
        this.summaryCards.forEach(card => card.destroy());
    }
}

/**
 * HistoricalAnalysisService - 過去データ分析用サービス
 */
class HistoricalAnalysisService {
    constructor() {
        this.baseURL = '/api/analysis';
    }

    /**
     * 過去データ取得
     * @param {Object} criteria - 検索条件
     * @returns {Promise<Object>} 分析データ
     */
    async getHistoricalData(criteria) {
        // モックデータ生成
        const mockData = this.generateMockData(criteria);
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    data: mockData,
                    summary: this.calculateSummary(mockData, criteria)
                });
            }, 1000);
        });
    }

    /**
     * モックデータ生成
     * @param {Object} criteria - 検索条件
     * @returns {Array} モックデータ
     */
    generateMockData(criteria) {
        const data = [];
        const startDate = new Date(criteria.startDate);
        const endDate = new Date(criteria.endDate);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0, 10);
            const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
            
            // ランダムなデータ生成
            const baseSales = 80000 + Math.random() * 40000;
            const weatherBonus = Math.random() > 0.3 ? 1.2 : 0.8; // 天気による影響
            const dayBonus = d.getDay() === 0 || d.getDay() === 6 ? 1.3 : 1.0; // 土日ボーナス
            
            data.push({
                date: dateStr,
                dayOfWeek: dayOfWeek,
                weather: ['晴れ', '曇り', '雨'][Math.floor(Math.random() * 3)],
                temperature: 18 + Math.floor(Math.random() * 15),
                totalSales: Math.floor(baseSales * weatherBonus * dayBonus),
                totalCustomers: 150 + Math.floor(Math.random() * 100),
                avgCustomerSpend: 0, // 後で計算
                totalItems: 200 + Math.floor(Math.random() * 150),
                soldoutCount: Math.floor(Math.random() * 8),
                wasteRate: Math.random() * 10,
                soldoutTime: Math.random() > 0.5 ? `${17 + Math.floor(Math.random() * 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : null,
                category: ['デンマーク関連', '洋菓子限定', 'ゼリー'][Math.floor(Math.random() * 3)]
            });
        }
        
        // 客単価計算
        data.forEach(item => {
            item.avgCustomerSpend = item.totalCustomers > 0 ? item.totalSales / item.totalCustomers : 0;
        });
        
        return data;
    }

    /**
     * サマリー計算
     * @param {Array} data - データ
     * @param {Object} criteria - 検索条件
     * @returns {Object} サマリー
     */
    calculateSummary(data, criteria) {
        if (data.length === 0) {
            return {
                analysisDate: 0,
                avgDailySales: 0,
                totalItems: 0,
                avgSoldoutTime: '-',
                totalReservations: 0,
                totalSpecialOrders: 0
            };
        }
        
        const totalSales = data.reduce((sum, item) => sum + item.totalSales, 0);
        const avgDailySales = totalSales / data.length;
        const totalItems = data.reduce((sum, item) => sum + item.totalItems, 0);
        
        // 完売時間の平均計算
        const soldoutTimes = data.filter(item => item.soldoutTime).map(item => {
            const [hour, minute] = item.soldoutTime.split(':').map(Number);
            return hour * 60 + minute;
        });
        
        const avgSoldoutTime = soldoutTimes.length > 0 
            ? `${Math.floor(soldoutTimes.reduce((sum, time) => sum + time, 0) / soldoutTimes.length / 60)}:${String(Math.floor((soldoutTimes.reduce((sum, time) => sum + time, 0) / soldoutTimes.length) % 60)).padStart(2, '0')}`
            : '-';
        
        return {
            analysisDate: data.length,
            avgDailySales,
            totalItems,
            avgSoldoutTime,
            totalReservations: Math.floor(Math.random() * 200), // モック値
            totalSpecialOrders: Math.floor(Math.random() * 50) // モック値
        };
    }

    /**
     * CSV出力
     * @param {Array} data - データ
     * @param {Object} criteria - 検索条件
     * @returns {string} CSV文字列
     */
    exportToCSV(data, criteria) {
        const headers = [
            '日付', '曜日', '天気', '気温', '総売上', '客数', '客単価', 
            '総販売数', '完売商品数', 'ロス率', '完売時間'
        ];
        
        const csvContent = [
            `# 過去データ分析結果 - ${criteria.startDate} ～ ${criteria.endDate}`,
            `# 出力日時: ${new Date().toLocaleString('ja-JP')}`,
            '',
            headers.join(','),
            ...data.map(row => [
                row.date,
                row.dayOfWeek,
                `"${row.weather}"`,
                row.temperature,
                row.totalSales,
                row.totalCustomers,
                Math.round(row.avgCustomerSpend),
                row.totalItems,
                row.soldoutCount,
                row.wasteRate.toFixed(1),
                `"${row.soldoutTime || ''}"`
            ].join(','))
        ].join('\n');
        
        return csvContent;
    }

    /**
     * レポート生成
     * @param {Array} data - データ
     * @param {Object} summary - サマリー
     * @returns {string} HTMLレポート
     */
    generateReport(data, summary) {
        return `
            <div class="detailed-analysis">
                <h2>📈 詳細分析</h2>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th>項目</th>
                            <th>値</th>
                            <th>分析</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>最高売上日</td>
                            <td>${data.reduce((max, item) => item.totalSales > max.totalSales ? item : max, data[0])?.date || '-'}</td>
                            <td>売上パフォーマンスが最も高い日</td>
                        </tr>
                        <tr>
                            <td>平均ロス率</td>
                            <td>${(data.reduce((sum, item) => sum + item.wasteRate, 0) / data.length).toFixed(1)}%</td>
                            <td>基準値5%との比較が重要</td>
                        </tr>
                        <tr>
                            <td>完売率</td>
                            <td>${((data.filter(item => item.soldoutTime).length / data.length) * 100).toFixed(1)}%</td>
                            <td>商品の回転効率を示す</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * AI予測生成
     * @param {Array} data - 履歴データ
     * @param {number} period - 予測期間
     * @returns {Promise<Object>} 予測結果
     */
    async generateForecast(data, period) {
        // 簡易予測アルゴリズム（実際にはより複雑な機械学習を使用）
        return new Promise((resolve) => {
            setTimeout(() => {
                const avgDailySales = data.reduce((sum, item) => sum + item.totalSales, 0) / data.length;
                const trend = this.calculateTrend(data);
                const seasonality = this.calculateSeasonality(data);
                
                const forecastSales = avgDailySales * period * (1 + trend) * (1 + seasonality);
                
                resolve({
                    period: parseInt(period),
                    totalForecast: Math.floor(forecastSales),
                    dailyForecast: Math.floor(forecastSales / period),
                    confidence: 75 + Math.floor(Math.random() * 20), // 75-95%
                    trend: trend > 0 ? 'increase' : 'decrease',
                    factors: ['過去の売上傾向', '季節性', '曜日パターン']
                });
            }, 2000);
        });
    }

    /**
     * トレンド計算
     * @param {Array} data - データ
     * @returns {number} トレンド係数
     */
    calculateTrend(data) {
        if (data.length < 7) return 0;
        
        const recentWeek = data.slice(-7);
        const previousWeek = data.slice(-14, -7);
        
        const recentAvg = recentWeek.reduce((sum, item) => sum + item.totalSales, 0) / 7;
        const previousAvg = previousWeek.reduce((sum, item) => sum + item.totalSales, 0) / 7;
        
        return previousAvg > 0 ? (recentAvg - previousAvg) / previousAvg : 0;
    }

    /**
     * 季節性計算
     * @param {Array} data - データ
     * @returns {number} 季節性係数
     */
    calculateSeasonality(data) {
        // 簡易的な季節性計算（実際はより複雑）
        const month = new Date().getMonth();
        const seasonalFactors = [0.9, 0.95, 1.05, 1.1, 1.15, 1.2, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85];
        
        return (seasonalFactors[month] - 1);
    }
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HistoricalAnalysis, HistoricalAnalysisService };
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.HistoricalAnalysis = HistoricalAnalysis;
    window.HistoricalAnalysisService = HistoricalAnalysisService;
}