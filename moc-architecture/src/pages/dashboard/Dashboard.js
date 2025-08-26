/**
 * Dashboard Page - ダッシュボードページコンポーネント
 * MOCアーキテクチャのページレベルコンポーネント
 */
class Dashboard {
    constructor(options = {}) {
        this.container = options.container || 'body';
        this.header = null;
        this.kpiCards = [];
        this.charts = [];
        this.alerts = [];
        
        // 設定
        this.autoRefresh = options.autoRefresh !== false;
        this.refreshInterval = options.refreshInterval || 60000; // 1分
        this.refreshTimer = null;
        
        // データ
        this.kpiData = null;
        this.chartData = null;
        this.alertsData = [];
        
        // サービス
        this.dashboardService = null;
    }

    /**
     * ダッシュボードを初期化
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // サービスの初期化
            this.dashboardService = new DashboardService();
            
            // レイアウトの構築
            this.buildLayout();
            
            // ヘッダーの初期化
            this.initHeader();
            
            // データの初期読み込み
            await this.loadInitialData();
            
            // ナビゲーションカードの構築
            this.buildNavigationCards();
            
            // KPIカードの構築
            this.buildKPICards();
            
            // チャートの構築
            this.buildCharts();
            
            // アラートの構築
            this.buildAlerts();
            
            // イベントリスナーの設定
            this.attachEventListeners();
            
            // 自動更新の開始
            if (this.autoRefresh) {
                this.startAutoRefresh();
            }
            
            // ページ読み込み完了イベント
            if (window.eventBus) {
                window.eventBus.emit('dashboard.loaded');
            }
            
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showError('ダッシュボードの初期化に失敗しました。');
        }
    }

    /**
     * レイアウトの基本構造を構築
     */
    buildLayout() {
        const container = typeof this.container === 'string' ? 
            document.querySelector(this.container) : this.container;
            
        container.innerHTML = `
            <div class="dashboard-layout">
                <div id="dashboard-header"></div>
                
                <main class="dashboard-main">
                    <div class="dashboard-content">
                        <!-- Navigation Cards -->
                        <section class="dashboard-navigation">
                            <div class="container">
                                <div id="nav-cards-container" class="nav-cards-grid"></div>
                            </div>
                        </section>
                        
                        <!-- KPI Section -->
                        <section class="dashboard-kpi">
                            <div class="container">
                                <h2 class="section-title">📊 KPI ダッシュボード</h2>
                                <div id="kpi-cards-container" class="kpi-cards-grid"></div>
                            </div>
                        </section>
                        
                        <!-- Alerts Section -->
                        <section class="dashboard-alerts">
                            <div class="container">
                                <h2 class="section-title">⚠️ アラート</h2>
                                <div id="alerts-container"></div>
                            </div>
                        </section>
                        
                        <!-- Charts Section -->
                        <section class="dashboard-charts">
                            <div class="container">
                                <h2 class="section-title">📈 データ分析</h2>
                                <div class="charts-grid">
                                    <div class="chart-container">
                                        <h3 class="chart-title">時間帯別売上</h3>
                                        <div id="sales-chart"></div>
                                    </div>
                                    <div class="chart-container">
                                        <h3 class="chart-title">カテゴリ構成比</h3>
                                        <div id="composition-chart"></div>
                                    </div>
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
            subtitle: 'ダッシュボード',
            menuItems: [
                { label: 'ダッシュボード', icon: '📊', href: 'index-moc.html', active: true },
                { label: '実績入力', icon: '📝', href: 'performance-input-moc.html' },
                { label: '発注シミュレーション', icon: '🔄', href: 'order-simulation-moc.html' },
                { label: '洋生ノート', icon: '🧁', href: 'western-confection-note-moc.html' },
                { label: '過去データ分析', icon: '📈', href: 'historical-analysis-moc.html' },
                { label: 'マスタメンテナンス', icon: '🔧', href: 'master-maintenance-moc.html' }
            ]
        });
        
        this.header.mount('#dashboard-header');
    }

    /**
     * 初期データを読み込み
     * @returns {Promise<void>}
     */
    async loadInitialData() {
        try {
            // 並列でデータを取得
            const [kpiData, chartData, alertsData] = await Promise.all([
                this.dashboardService.getKPIData(),
                this.dashboardService.getChartData(),
                this.dashboardService.getAlertsData()
            ]);
            
            this.kpiData = kpiData;
            this.chartData = chartData;
            this.alertsData = alertsData;
            
        } catch (error) {
            console.error('Initial data load failed:', error);
            throw error;
        }
    }

    /**
     * ナビゲーションカードを構築
     */
    buildNavigationCards() {
        const container = document.getElementById('nav-cards-container');
        if (!container) return;
        
        const navigationItems = [
            {
                title: '実績入力＆日次ノート',
                description: '日々の売上実績と在庫データを入力',
                icon: '📝',
                href: 'performance-input-moc.html'
            },
            {
                title: '発注修正シミュレーション',
                description: '最適な発注数量をシミュレーション',
                icon: '🔄',
                href: 'order-simulation-moc.html'
            },
            {
                title: '洋生ノート',
                description: '洋菓子専用の詳細管理ノート',
                icon: '🧁',
                href: 'western-confection-note-moc.html'
            },
            {
                title: '過去データ分析',
                description: '期間指定での実績・売上データ分析',
                icon: '📈',
                href: 'historical-analysis-moc.html'
            },
            {
                title: 'マスタメンテナンス',
                description: '商品・カテゴリ・仕入先・設定の管理',
                icon: '🔧',
                href: 'master-maintenance-moc.html'
            },
            {
                title: '使用方法マニュアル',
                description: 'システムの操作方法と機能説明',
                icon: '📖',
                href: 'user-manual.html'
            }
        ];
        
        navigationItems.forEach(item => {
            const navCard = Card.createNavCard(item);
            navCard.mount(container);
        });
    }

    /**
     * KPIカードを構築
     */
    buildKPICards() {
        const container = document.getElementById('kpi-cards-container');
        if (!container || !this.kpiData) return;
        
        this.kpiCards = this.kpiData.map(kpi => {
            const card = Card.createKPICard(kpi);
            card.mount(container);
            return card;
        });
    }

    /**
     * チャートを構築
     */
    buildCharts() {
        if (!this.chartData) return;
        
        // 時間帯別売上チャート
        if (this.chartData.hourlySales) {
            const salesChart = MOCChart.salesChart(this.chartData.hourlySales);
            salesChart.mount('#sales-chart');
            this.charts.push(salesChart);
        }
        
        // カテゴリ構成比チャート
        if (this.chartData.categoryComposition) {
            const compositionChart = MOCChart.compositionChart(this.chartData.categoryComposition);
            compositionChart.mount('#composition-chart');
            this.charts.push(compositionChart);
        }
    }

    /**
     * アラートを構築
     */
    buildAlerts() {
        const container = document.getElementById('alerts-container');
        if (!container) return;
        
        if (this.alertsData.length === 0) {
            container.innerHTML = '<div class="no-alerts">現在アラートはありません</div>';
            return;
        }
        
        this.alertsData.forEach(alertData => {
            const alert = new Alert({
                type: alertData.type,
                title: alertData.title,
                message: alertData.message,
                closable: true,
                autoClose: null
            });
            
            const alertElement = alert.mount(container);
            this.alerts.push(alert);
        });
    }

    /**
     * イベントリスナーを設定
     */
    attachEventListeners() {
        // データ更新イベント
        if (window.eventBus) {
            window.eventBus.on('dashboard.refresh', () => {
                this.refresh();
            });
            
            window.eventBus.on('performance.updated', () => {
                this.refreshKPIData();
            });
            
            window.eventBus.on('order.updated', () => {
                this.refreshChartData();
            });
        }
        
        // ページ可視性変更イベント
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoRefresh();
            } else {
                if (this.autoRefresh) {
                    this.startAutoRefresh();
                }
            }
        });
    }

    /**
     * KPIデータを更新
     * @returns {Promise<void>}
     */
    async refreshKPIData() {
        try {
            const newKPIData = await this.dashboardService.getKPIData();
            
            // 既存のKPIカードを更新
            this.kpiCards.forEach((card, index) => {
                if (newKPIData[index]) {
                    const newKPI = newKPIData[index];
                    const content = `
                        <div class="kpi-value">${newKPI.value}</div>
                        <div class="kpi-trend ${newKPI.trend > 0 ? 'up' : newKPI.trend < 0 ? 'down' : 'neutral'}">
                            ${newKPI.trend > 0 ? '↑' : newKPI.trend < 0 ? '↓' : '→'} ${Math.abs(newKPI.trend)}%
                        </div>
                    `;
                    card.update({ content });
                }
            });
            
            this.kpiData = newKPIData;
            
        } catch (error) {
            console.error('KPI data refresh failed:', error);
        }
    }

    /**
     * チャートデータを更新
     * @returns {Promise<void>}
     */
    async refreshChartData() {
        try {
            const newChartData = await this.dashboardService.getChartData();
            
            // 既存のチャートを更新
            this.charts.forEach(chart => {
                if (chart.type === 'bar' && newChartData.hourlySales) {
                    const data = {
                        labels: newChartData.hourlySales.map(item => `${item.hour}:00`),
                        datasets: [{
                            label: '売上金額',
                            data: newChartData.hourlySales.map(item => item.amount),
                            backgroundColor: 'rgba(52, 152, 219, 0.7)',
                            borderColor: 'rgba(52, 152, 219, 1)',
                            borderWidth: 1
                        }]
                    };
                    chart.updateData(data);
                } else if (chart.type === 'doughnut' && newChartData.categoryComposition) {
                    const data = {
                        labels: newChartData.categoryComposition.map(item => item.category),
                        datasets: [{
                            data: newChartData.categoryComposition.map(item => item.percentage),
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    };
                    chart.updateData(data);
                }
            });
            
            this.chartData = newChartData;
            
        } catch (error) {
            console.error('Chart data refresh failed:', error);
        }
    }

    /**
     * 全データを再読み込み
     * @returns {Promise<void>}
     */
    async refresh() {
        try {
            await this.loadInitialData();
            await Promise.all([
                this.refreshKPIData(),
                this.refreshChartData()
            ]);
            
            // 成功通知
            Alert.success('ダッシュボードを更新しました').mount();
            
        } catch (error) {
            console.error('Dashboard refresh failed:', error);
            Alert.error('ダッシュボードの更新に失敗しました').mount();
        }
    }

    /**
     * 自動更新を開始
     */
    startAutoRefresh() {
        this.stopAutoRefresh(); // 既存タイマーをクリア
        
        this.refreshTimer = setInterval(async () => {
            await this.refresh();
        }, this.refreshInterval);
    }

    /**
     * 自動更新を停止
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * エラー表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        Alert.error(message).mount();
    }

    /**
     * ダッシュボードを破棄
     */
    destroy() {
        // 自動更新を停止
        this.stopAutoRefresh();
        
        // ヘッダーを破棄
        if (this.header) {
            this.header.destroy();
        }
        
        // KPIカードを破棄
        this.kpiCards.forEach(card => card.destroy());
        this.kpiCards = [];
        
        // チャートを破棄
        this.charts.forEach(chart => chart.destroy());
        this.charts = [];
        
        // アラートを破棄
        this.alerts.forEach(alert => alert.destroy());
        this.alerts = [];
    }
}

/**
 * DashboardService - ダッシュボード用データサービス
 */
class DashboardService {
    constructor() {
        this.baseURL = '/api';
    }

    /**
     * KPIデータを取得
     * @returns {Promise<Array>} KPIデータ
     */
    async getKPIData() {
        // 実際のAPIコールの代わりにモックデータを返す
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        key: 'customers',
                        icon: '👥',
                        label: '客数',
                        value: '342',
                        trend: 12
                    },
                    {
                        key: 'sales',
                        icon: '💰',
                        label: '売上',
                        value: '¥1,234,567',
                        trend: 8
                    },
                    {
                        key: 'inventory',
                        icon: '📦',
                        label: '在庫合計',
                        value: '¥892,340',
                        trend: -3
                    },
                    {
                        key: 'soldout',
                        icon: '🔥',
                        label: '完売件数',
                        value: '15',
                        trend: 25
                    },
                    {
                        key: 'budget',
                        icon: '🎯',
                        label: '予算進捗',
                        value: '78%',
                        trend: 5
                    }
                ]);
            }, 500);
        });
    }

    /**
     * チャートデータを取得
     * @returns {Promise<Object>} チャートデータ
     */
    async getChartData() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    hourlySales: [
                        { hour: 10, amount: 45000 },
                        { hour: 11, amount: 67000 },
                        { hour: 12, amount: 98000 },
                        { hour: 13, amount: 123000 },
                        { hour: 14, amount: 89000 },
                        { hour: 15, amount: 76000 },
                        { hour: 16, amount: 54000 },
                        { hour: 17, amount: 87000 },
                        { hour: 18, amount: 134000 },
                        { hour: 19, amount: 92000 }
                    ],
                    categoryComposition: [
                        { category: 'ケーキ', percentage: 35 },
                        { category: 'プリン', percentage: 28 },
                        { category: 'ゼリー', percentage: 18 },
                        { category: 'その他', percentage: 19 }
                    ]
                });
            }, 300);
        });
    }

    /**
     * アラートデータを取得
     * @returns {Promise<Array>} アラートデータ
     */
    async getAlertsData() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        type: 'warning',
                        title: '在庫不足警告',
                        message: 'カスタードプリンの在庫が5個を下回りました。'
                    },
                    {
                        type: 'error',
                        title: '完売時間記録漏れ',
                        message: 'デンマークCCの完売時間が記録されていません。'
                    },
                    {
                        type: 'info',
                        title: 'ロス率通知',
                        message: '本日のロス率が基準値（5%）を若干上回っています。'
                    }
                ]);
            }, 200);
        });
    }
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Dashboard, DashboardService };
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.Dashboard = Dashboard;
    window.DashboardService = DashboardService;
}