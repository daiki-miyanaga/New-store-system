/**
 * Chart Component - Chart.js統合チャートコンポーネント
 * MOCアーキテクチャの基本UIコンポーネント
 */
class Chart {
    constructor(options = {}) {
        this.type = options.type || 'bar';
        this.data = options.data || {};
        this.options = options.options || {};
        this.container = options.container || null;
        this.responsive = options.responsive !== false;
        this.maintainAspectRatio = options.maintainAspectRatio !== false;
        this.className = options.className || '';
        this.id = options.id || `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        this.chartInstance = null;
        this.canvas = null;
        this.isLoading = false;
        
        // デフォルトオプション
        this.defaultOptions = {
            responsive: this.responsive,
            maintainAspectRatio: this.maintainAspectRatio,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false
                }
            },
            scales: this.getDefaultScales()
        };
    }

    /**
     * デフォルトのスケール設定を取得
     * @returns {Object} スケール設定
     */
    getDefaultScales() {
        if (this.type === 'pie' || this.type === 'doughnut') {
            return {};
        }
        
        return {
            x: {
                display: true,
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            y: {
                display: true,
                beginAtZero: true,
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            }
        };
    }

    /**
     * チャートのHTML構造を生成
     * @returns {string} HTML文字列
     */
    render() {
        return `
            <div id="${this.id}" class="chart-container ${this.className}">
                <div class="chart-loading" style="display: none;">
                    <div class="chart-spinner"></div>
                    <div class="chart-loading-text">読み込み中...</div>
                </div>
                <canvas class="chart-canvas"></canvas>
                <div class="chart-error" style="display: none;">
                    <div class="chart-error-icon">⚠️</div>
                    <div class="chart-error-text">チャートの読み込みに失敗しました</div>
                    <button class="chart-retry-btn" onclick="window.chart_${this.id}.retry()">再試行</button>
                </div>
            </div>
        `;
    }

    /**
     * DOM要素に挿入・初期化
     * @param {string|HTMLElement} target - 挿入先
     * @returns {Promise<HTMLElement>} チャート要素
     */
    async mount(target = null) {
        const container = target || this.container;
        const containerElement = typeof container === 'string' ? 
            document.querySelector(container) : container;
            
        if (!containerElement) {
            throw new Error('Chart mount target not found');
        }

        // HTMLを挿入
        containerElement.innerHTML = this.render();
        this.element = containerElement.querySelector(`#${this.id}`);
        this.canvas = this.element.querySelector('.chart-canvas');
        
        // グローバル参照を設定
        window[`chart_${this.id}`] = this;
        
        // Chart.jsの読み込み確認
        await this.ensureChartJS();
        
        // チャートを初期化
        await this.initialize();
        
        return this.element;
    }

    /**
     * Chart.jsライブラリの読み込み確認
     * @returns {Promise<void>}
     */
    async ensureChartJS() {
        if (typeof Chart !== 'undefined' && Chart.register) {
            return; // 既に読み込まれている
        }
        
        // Chart.jsが読み込まれていない場合
        if (!document.querySelector('script[src*="chart.js"]')) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
            document.head.appendChild(script);
            
            return new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load Chart.js'));
            });
        }
        
        // 既にscriptタグがある場合は読み込み完了を待つ
        return new Promise((resolve) => {
            const checkLoaded = () => {
                if (typeof Chart !== 'undefined' && Chart.register) {
                    resolve();
                } else {
                    setTimeout(checkLoaded, 100);
                }
            };
            checkLoaded();
        });
    }

    /**
     * チャートを初期化
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            this.showLoading();
            
            // Chart.jsのコンテキストを取得
            const ctx = this.canvas.getContext('2d');
            
            // オプションをマージ
            const mergedOptions = this.mergeDeep(this.defaultOptions, this.options);
            
            // チャートインスタンスを作成
            this.chartInstance = new window.Chart(ctx, {
                type: this.type,
                data: this.data,
                options: mergedOptions
            });
            
            this.hideLoading();
            
            // リサイズイベント監視
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Chart initialization error:', error);
            this.showError();
        }
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // ウィンドウリサイズ時の処理
        if (this.responsive) {
            const resizeObserver = new ResizeObserver(() => {
                if (this.chartInstance) {
                    this.chartInstance.resize();
                }
            });
            resizeObserver.observe(this.element);
        }
    }

    /**
     * 深いマージを実行
     * @param {Object} target - ターゲットオブジェクト
     * @param {Object} source - ソースオブジェクト
     * @returns {Object} マージされたオブジェクト
     */
    mergeDeep(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] instanceof Object && target[key] instanceof Object) {
                    result[key] = this.mergeDeep(target[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }

    /**
     * ローディング表示
     */
    showLoading() {
        this.isLoading = true;
        const loading = this.element.querySelector('.chart-loading');
        const canvas = this.element.querySelector('.chart-canvas');
        const error = this.element.querySelector('.chart-error');
        
        loading.style.display = 'flex';
        canvas.style.display = 'none';
        error.style.display = 'none';
    }

    /**
     * ローディング非表示
     */
    hideLoading() {
        this.isLoading = false;
        const loading = this.element.querySelector('.chart-loading');
        const canvas = this.element.querySelector('.chart-canvas');
        
        loading.style.display = 'none';
        canvas.style.display = 'block';
    }

    /**
     * エラー表示
     */
    showError() {
        const loading = this.element.querySelector('.chart-loading');
        const canvas = this.element.querySelector('.chart-canvas');
        const error = this.element.querySelector('.chart-error');
        
        loading.style.display = 'none';
        canvas.style.display = 'none';
        error.style.display = 'flex';
    }

    /**
     * チャートデータを更新
     * @param {Object} newData - 新しいデータ
     * @param {boolean} animate - アニメーション有無
     */
    updateData(newData, animate = true) {
        if (!this.chartInstance) return;
        
        this.data = newData;
        this.chartInstance.data = newData;
        
        if (animate) {
            this.chartInstance.update();
        } else {
            this.chartInstance.update('none');
        }
    }

    /**
     * チャートオプションを更新
     * @param {Object} newOptions - 新しいオプション
     */
    updateOptions(newOptions) {
        if (!this.chartInstance) return;
        
        this.options = this.mergeDeep(this.options, newOptions);
        this.chartInstance.options = this.mergeDeep(this.defaultOptions, this.options);
        this.chartInstance.update();
    }

    /**
     * チャートタイプを変更
     * @param {string} newType - 新しいチャートタイプ
     */
    changeType(newType) {
        if (!this.chartInstance) return;
        
        this.type = newType;
        
        // スケール設定を更新
        const newScales = this.getDefaultScales();
        this.chartInstance.options.scales = newScales;
        
        // チャートタイプを変更
        this.chartInstance.config.type = newType;
        this.chartInstance.update();
    }

    /**
     * チャートを再描画
     */
    redraw() {
        if (this.chartInstance) {
            this.chartInstance.update('active');
        }
    }

    /**
     * チャートをリセット
     */
    reset() {
        if (this.chartInstance) {
            this.chartInstance.reset();
        }
    }

    /**
     * PNG画像として出力
     * @param {string} backgroundColor - 背景色
     * @returns {string} DataURL
     */
    toImage(backgroundColor = '#ffffff') {
        if (!this.chartInstance) return null;
        
        return this.chartInstance.toBase64Image('image/png', 1.0);
    }

    /**
     * 再試行
     */
    async retry() {
        if (this.isLoading) return;
        
        await this.initialize();
    }

    /**
     * チャートを破棄
     */
    destroy() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
        
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        
        delete window[`chart_${this.id}`];
    }

    // ========== 静的ファクトリーメソッド ==========

    /**
     * 棒グラフを作成
     * @param {Object} data - データ
     * @param {Object} options - オプション
     * @returns {Chart} チャートインスタンス
     */
    static bar(data, options = {}) {
        return new Chart({
            type: 'bar',
            data,
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { display: true },
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('ja-JP').format(value);
                            }
                        }
                    }
                },
                ...options
            }
        });
    }

    /**
     * 線グラフを作成
     * @param {Object} data - データ
     * @param {Object} options - オプション
     * @returns {Chart} チャートインスタンス
     */
    static line(data, options = {}) {
        return new Chart({
            type: 'line',
            data,
            options: {
                elements: {
                    line: {
                        tension: 0.1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { display: true }
                    }
                },
                ...options
            }
        });
    }

    /**
     * 円グラフを作成
     * @param {Object} data - データ
     * @param {Object} options - オプション
     * @returns {Chart} チャートインスタンス
     */
    static pie(data, options = {}) {
        return new Chart({
            type: 'pie',
            data,
            options: {
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.formattedValue} (${percentage}%)`;
                            }
                        }
                    }
                },
                ...options
            }
        });
    }

    /**
     * ドーナツグラフを作成
     * @param {Object} data - データ
     * @param {Object} options - オプション
     * @returns {Chart} チャートインスタンス
     */
    static doughnut(data, options = {}) {
        return new Chart({
            type: 'doughnut',
            data,
            options: {
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.formattedValue} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%',
                ...options
            }
        });
    }

    /**
     * 売上チャートを作成（時間帯別）
     * @param {Array} hourlyData - 時間帯別データ
     * @returns {Chart} チャートインスタンス
     */
    static salesChart(hourlyData) {
        const data = {
            labels: hourlyData.map(item => `${item.hour}:00`),
            datasets: [{
                label: '売上金額',
                data: hourlyData.map(item => item.amount),
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        };

        return Chart.bar(data, {
            plugins: {
                title: {
                    display: true,
                    text: '時間帯別売上'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '¥' + new Intl.NumberFormat('ja-JP').format(value);
                        }
                    }
                }
            }
        });
    }

    /**
     * 構成比チャートを作成
     * @param {Array} compositionData - 構成比データ
     * @returns {Chart} チャートインスタンス
     */
    static compositionChart(compositionData) {
        const data = {
            labels: compositionData.map(item => item.category),
            datasets: [{
                data: compositionData.map(item => item.percentage),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        return Chart.doughnut(data, {
            plugins: {
                title: {
                    display: true,
                    text: 'カテゴリ構成比'
                }
            }
        });
    }

    /**
     * トレンドチャートを作成
     * @param {Array} trendData - トレンドデータ
     * @returns {Chart} チャートインスタンス
     */
    static trendChart(trendData) {
        const data = {
            labels: trendData.map(item => item.date),
            datasets: [{
                label: '売上推移',
                data: trendData.map(item => item.amount),
                fill: true,
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderColor: 'rgba(52, 152, 219, 1)',
                tension: 0.1
            }]
        };

        return Chart.line(data, {
            plugins: {
                title: {
                    display: true,
                    text: '売上トレンド'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '¥' + new Intl.NumberFormat('ja-JP').format(value);
                        }
                    }
                }
            }
        });
    }
}

// EventBusとの連携
if (typeof window !== 'undefined' && window.eventBus) {
    // データ更新イベントを監視
    window.eventBus.on('chart.update', (data) => {
        const { chartId, newData, animate } = data;
        const chartInstance = window[`chart_${chartId}`];
        if (chartInstance) {
            chartInstance.updateData(newData, animate);
        }
    });
    
    // チャートタイプ変更イベント
    window.eventBus.on('chart.changeType', (data) => {
        const { chartId, newType } = data;
        const chartInstance = window[`chart_${chartId}`];
        if (chartInstance) {
            chartInstance.changeType(newType);
        }
    });
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Chart;
}

// グローバルスコープでも利用可能（Chart.jsとの名前衝突を回避）
if (typeof window !== 'undefined') {
    window.MOCChart = Chart;
}