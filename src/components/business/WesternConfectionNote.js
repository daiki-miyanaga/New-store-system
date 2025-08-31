/**
 * WesternConfectionNote - 洋生ノートビジネスコンポーネント
 * MOCアーキテクチャのビジネスレイヤー - 企画書完全対応
 */
class WesternConfectionNote {
    
    constructor(options = {}) {
        this.container = options.container;
        this.services = {
            order: window.OrderService,
            historical: window.HistoricalDataService,
            validation: window.ValidationService,
            inventory: window.InventoryService
        };
        
        this.data = {
            date: options.date || new Date(),
            weather: options.weather || '晴れ',
            temperature: options.temperature || 20,
            nextDayBudget: options.nextDayBudget || 60000,
            nextDayArrival: {}, // 翌日入荷予定数（本部登録値）
            products: [],
            referenceData: null
        };
        
        this.constraints = {
            orderDeadline: 2, // 出荷日の2日前
            orderRules: {}, // 商品別発注制約
            budgetLimit: 60000 // 予算上限
        };

        this.init();
    }

    /**
     * コンポーネント初期化
     */
    init() {
        this.loadInitialData();
        this.render();
        this.bindEvents();
        this.loadReferenceData();
    }

    /**
     * 初期データロード
     */
    loadInitialData() {
        // 商品マスタデータ（企画書仕様に基づく）
        this.data.products = [
            // デンマーク関連
            { 
                code: '2408', name: 'デンマークCC', price: 1200, category: 'デンマーク関連',
                currentStock: 3, nextDayArrival: 8, carryover: 2, expectedSales: 6,
                constraints: { minOrderQuantity: 1, orderUnit: 1, isOrderable: true }
            },
            { 
                code: '2409', name: 'レアチーズC', price: 1000, category: 'デンマーク関連',
                currentStock: 2, nextDayArrival: 5, carryover: 1, expectedSales: 4,
                constraints: { minOrderQuantity: 1, orderUnit: 1, isOrderable: true }
            },
            
            // 洋菓子限定
            { 
                code: '3301', name: 'カスタードプリン', price: 350, category: '洋菓子限定',
                currentStock: 12, nextDayArrival: 20, carryover: 5, expectedSales: 15,
                constraints: { minOrderQuantity: 2, orderUnit: 2, isOrderable: true }
            },
            { 
                code: '3302', name: 'とろ生カスタード', price: 380, category: '洋菓子限定',
                currentStock: 8, nextDayArrival: 15, carryover: 3, expectedSales: 12,
                constraints: { minOrderQuantity: 2, orderUnit: 2, isOrderable: true }
            },
            { 
                code: '3303', name: '復刻カスタードP', price: 400, category: '洋菓子限定',
                currentStock: 6, nextDayArrival: 10, carryover: 2, expectedSales: 8,
                constraints: { minOrderQuantity: 1, orderUnit: 1, isOrderable: true }
            },
            
            // ゼリー
            { 
                code: '4101', name: 'マンゴー&オレンジ', price: 270, category: 'ゼリー',
                currentStock: 15, nextDayArrival: 25, carryover: 8, expectedSales: 20,
                constraints: { minOrderQuantity: 3, orderUnit: 3, isOrderable: true }
            },
            { 
                code: '4102', name: 'メロン&白桃', price: 270, category: 'ゼリー',
                currentStock: 10, nextDayArrival: 20, carryover: 5, expectedSales: 15,
                constraints: { minOrderQuantity: 3, orderUnit: 3, isOrderable: true }
            },
            
            // その他
            { 
                code: '5001', name: '白くまプリン', price: 450, category: 'その他',
                currentStock: 4, nextDayArrival: 8, carryover: 2, expectedSales: 6,
                constraints: { minOrderQuantity: 1, orderUnit: 1, isOrderable: true }
            },
            { 
                code: '5002', name: 'プリンのトルテ', price: 580, category: 'その他',
                currentStock: 3, nextDayArrival: 6, carryover: 1, expectedSales: 5,
                constraints: { minOrderQuantity: 1, orderUnit: 1, isOrderable: true }
            }
        ];

        // 初期発注数量を計算
        this.calculateInitialOrderQuantities();
    }

    /**
     * 初期発注数量を計算（企画書仕様: 発注数量 = 繰越 + 予想販売数）
     */
    calculateInitialOrderQuantities() {
        this.data.products.forEach(product => {
            product.orderQuantity = this.services.order.calculateOrderQuantity(
                product.carryover, 
                product.expectedSales
            );
        });
    }

    /**
     * メインレンダリング
     */
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="western-confection-note">
                ${this.renderHeader()}
                ${this.renderControlPanel()}
                ${this.renderReferenceDataPanel()}
                ${this.renderOrderTable()}
                ${this.renderSummary()}
                ${this.renderValidationResults()}
                ${this.renderActionButtons()}
            </div>
        `;
    }

    /**
     * ヘッダー部分のレンダリング
     */
    renderHeader() {
        const dateStr = this.data.date.toLocaleDateString('ja-JP', { 
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
        });

        return `
            <div class="note-header">
                <h2>洋生ノート - 発注計画</h2>
                <div class="header-info">
                    <div class="date-info">
                        <label>発注対象日:</label>
                        <input type="date" id="targetDate" value="${this.data.date.toISOString().split('T')[0]}">
                        <span class="date-display">${dateStr}</span>
                    </div>
                    <div class="weather-info">
                        <label>翌日天気:</label>
                        <select id="weatherSelect">
                            <option value="晴れ" ${this.data.weather === '晴れ' ? 'selected' : ''}>晴れ</option>
                            <option value="曇り" ${this.data.weather === '曇り' ? 'selected' : ''}>曇り</option>
                            <option value="雨" ${this.data.weather === '雨' ? 'selected' : ''}>雨</option>
                        </select>
                    </div>
                    <div class="temperature-info">
                        <label>予想気温:</label>
                        <input type="number" id="temperatureInput" value="${this.data.temperature}" min="-10" max="40">
                        <span>℃</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 制御パネルのレンダリング
     */
    renderControlPanel() {
        return `
            <div class="control-panel">
                <div class="budget-section">
                    <label>翌日予算（数量ベース）:</label>
                    <input type="number" id="budgetInput" value="${this.data.nextDayBudget}" min="0" step="1000">
                    <span>円</span>
                </div>
                <div class="action-buttons">
                    <button id="loadReferenceBtn" class="btn btn-secondary">参考実績更新</button>
                    <button id="calculateBtn" class="btn btn-primary">発注数量再計算</button>
                    <button id="validateBtn" class="btn btn-info">制約チェック</button>
                </div>
            </div>
        `;
    }

    /**
     * 参考実績パネルのレンダリング
     */
    renderReferenceDataPanel() {
        return `
            <div class="reference-panel" id="referencePanel">
                <h3>参考実績データ</h3>
                <div class="reference-content" id="referenceContent">
                    <p class="loading">参考データを読み込み中...</p>
                </div>
            </div>
        `;
    }

    /**
     * 発注テーブルのレンダリング
     */
    renderOrderTable() {
        const categories = ['デンマーク関連', '洋菓子限定', 'ゼリー', 'その他'];
        
        let tableHTML = `
            <div class="order-table-container">
                <table class="order-table" id="orderTable">
                    <thead>
                        <tr>
                            <th>商品コード</th>
                            <th>商品名</th>
                            <th>単価</th>
                            <th>現在在庫</th>
                            <th>翌日入荷<br>(確定)</th>
                            <th>繰越予定</th>
                            <th>予想販売数</th>
                            <th>発注数量</th>
                            <th>発注金額</th>
                            <th>参考実績</th>
                            <th>本部基準</th>
                            <th>異常値警告</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        categories.forEach(category => {
            const categoryProducts = this.data.products.filter(p => p.category === category);
            
            if (categoryProducts.length > 0) {
                tableHTML += `
                    <tr class="category-header">
                        <td colspan="12" class="category-title">${category}</td>
                    </tr>
                `;

                categoryProducts.forEach(product => {
                    tableHTML += this.renderProductRow(product);
                });
            }
        });

        tableHTML += `
                    </tbody>
                    <tfoot>
                        ${this.renderTotalRow()}
                    </tfoot>
                </table>
            </div>
        `;

        return tableHTML;
    }

    /**
     * 商品行のレンダリング
     */
    renderProductRow(product) {
        const orderAmount = (product.orderQuantity || 0) * (product.price || 0);
        const isReadOnly = !product.constraints.isOrderable;

        return `
            <tr class="product-row" data-product-code="${product.code}">
                <td class="product-code">${product.code}</td>
                <td class="product-name">${product.name}</td>
                <td class="price">¥${product.price?.toLocaleString()}</td>
                <td class="current-stock">${product.currentStock}</td>
                <td class="next-arrival readonly">${product.nextDayArrival}</td>
                <td class="carryover">
                    <input type="number" value="${product.carryover || 0}" 
                           class="carryover-input" ${isReadOnly ? 'readonly' : ''}>
                </td>
                <td class="expected-sales">
                    <input type="number" value="${product.expectedSales || 0}" 
                           class="expected-sales-input" ${isReadOnly ? 'readonly' : ''}>
                </td>
                <td class="order-quantity">
                    <input type="number" value="${product.orderQuantity || 0}" 
                           class="order-quantity-input" ${isReadOnly ? 'readonly' : ''}>
                    <div class="constraint-info">
                        <small>最小:${product.constraints.minOrderQuantity} 
                               倍数:${product.constraints.orderUnit}</small>
                    </div>
                </td>
                <td class="order-amount">¥${orderAmount.toLocaleString()}</td>
                <td class="reference-data" id="ref-${product.code}">-</td>
                <td class="budget-comparison" id="budget-${product.code}">-</td>
                <td class="anomaly-warning" id="anomaly-${product.code}">-</td>
            </tr>
        `;
    }

    /**
     * 合計行のレンダリング
     */
    renderTotalRow() {
        const totalOrderQuantity = this.data.products.reduce((sum, p) => sum + (p.orderQuantity || 0), 0);
        const totalOrderAmount = this.data.products.reduce((sum, p) => 
            sum + ((p.orderQuantity || 0) * (p.price || 0)), 0);

        return `
            <tr class="total-row">
                <td colspan="7"><strong>合計</strong></td>
                <td class="total-quantity"><strong>${totalOrderQuantity}</strong></td>
                <td class="total-amount"><strong>¥${totalOrderAmount.toLocaleString()}</strong></td>
                <td colspan="3"></td>
            </tr>
        `;
    }

    /**
     * サマリー情報のレンダリング
     */
    renderSummary() {
        const summary = this.calculateSummary();
        
        return `
            <div class="summary-panel">
                <div class="summary-cards">
                    <div class="summary-card">
                        <h4>発注概要</h4>
                        <div class="card-content">
                            <p>総発注数量: <strong>${summary.totalQuantity}個</strong></p>
                            <p>総発注金額: <strong>¥${summary.totalAmount.toLocaleString()}</strong></p>
                            <p>予算使用率: <strong>${summary.budgetUsage}%</strong></p>
                        </div>
                    </div>
                    <div class="summary-card">
                        <h4>制約チェック</h4>
                        <div class="card-content">
                            <p>発注可能商品: <strong>${summary.orderableItems}/${summary.totalItems}件</strong></p>
                            <p>制約違反: <strong class="error">${summary.constraintViolations}件</strong></p>
                            <p>異常値検知: <strong class="warning">${summary.anomalies}件</strong></p>
                        </div>
                    </div>
                    <div class="summary-card">
                        <h4>参考データ</h4>
                        <div class="card-content">
                            <p>データ品質: <strong>${summary.dataQuality}</strong></p>
                            <p>参考件数: <strong>${summary.referenceCount}件</strong></p>
                            <p>信頼度: <strong>${summary.confidence}</strong></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * バリデーション結果のレンダリング
     */
    renderValidationResults() {
        return `
            <div class="validation-panel" id="validationPanel">
                <h3>制約・異常値チェック結果</h3>
                <div class="validation-content" id="validationContent">
                    <p class="info">「制約チェック」ボタンを押してバリデーションを実行してください</p>
                </div>
            </div>
        `;
    }

    /**
     * アクションボタンのレンダリング
     */
    renderActionButtons() {
        return `
            <div class="action-panel">
                <div class="button-group">
                    <button id="saveOrderBtn" class="btn btn-success">発注内容保存</button>
                    <button id="submitOrderBtn" class="btn btn-primary">発注確定・送信</button>
                    <button id="exportCsvBtn" class="btn btn-secondary">CSV出力</button>
                    <button id="resetBtn" class="btn btn-outline">リセット</button>
                </div>
                <div class="deadline-warning" id="deadlineWarning">
                    <p>⚠️ 発注締切: 出荷日の2日前まで</p>
                </div>
            </div>
        `;
    }

    /**
     * イベントバインディング
     */
    bindEvents() {
        // 基本入力イベント
        this.bindBasicInputEvents();
        
        // 計算関連イベント
        this.bindCalculationEvents();
        
        // バリデーションイベント
        this.bindValidationEvents();
        
        // アクションイベント
        this.bindActionEvents();
    }

    /**
     * 基本入力イベントのバインド
     */
    bindBasicInputEvents() {
        // 日付変更
        const targetDateInput = document.getElementById('targetDate');
        if (targetDateInput) {
            targetDateInput.addEventListener('change', (e) => {
                this.data.date = new Date(e.target.value);
                this.loadReferenceData();
            });
        }

        // 天気変更
        const weatherSelect = document.getElementById('weatherSelect');
        if (weatherSelect) {
            weatherSelect.addEventListener('change', (e) => {
                this.data.weather = e.target.value;
                this.updateWeatherFactors();
            });
        }

        // 気温変更
        const temperatureInput = document.getElementById('temperatureInput');
        if (temperatureInput) {
            temperatureInput.addEventListener('change', (e) => {
                this.data.temperature = parseInt(e.target.value);
                this.updateTemperatureFactors();
            });
        }

        // 予算変更
        const budgetInput = document.getElementById('budgetInput');
        if (budgetInput) {
            budgetInput.addEventListener('change', (e) => {
                this.data.nextDayBudget = parseInt(e.target.value);
                this.updateBudgetDisplay();
            });
        }
    }

    /**
     * 計算関連イベントのバインド
     */
    bindCalculationEvents() {
        // 繰越数量・予想販売数の変更
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('carryover-input') || 
                e.target.classList.contains('expected-sales-input')) {
                this.handleOrderInputChange(e);
            }
        });

        // 発注数量の直接変更
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('order-quantity-input')) {
                this.handleOrderQuantityChange(e);
            }
        });

        // 再計算ボタン
        const calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.recalculateAll());
        }
    }

    /**
     * バリデーションイベントのバインド
     */
    bindValidationEvents() {
        const validateBtn = document.getElementById('validateBtn');
        if (validateBtn) {
            validateBtn.addEventListener('click', () => this.runValidation());
        }
    }

    /**
     * アクションイベントのバインド
     */
    bindActionEvents() {
        // 参考実績更新
        const loadReferenceBtn = document.getElementById('loadReferenceBtn');
        if (loadReferenceBtn) {
            loadReferenceBtn.addEventListener('click', () => this.loadReferenceData());
        }

        // 保存
        const saveOrderBtn = document.getElementById('saveOrderBtn');
        if (saveOrderBtn) {
            saveOrderBtn.addEventListener('click', () => this.saveOrder());
        }

        // 発注確定
        const submitOrderBtn = document.getElementById('submitOrderBtn');
        if (submitOrderBtn) {
            submitOrderBtn.addEventListener('click', () => this.submitOrder());
        }

        // CSV出力
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => this.exportToCsv());
        }

        // リセット
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetData());
        }
    }

    /**
     * 発注入力変更ハンドラー
     */
    handleOrderInputChange(event) {
        const row = event.target.closest('.product-row');
        const productCode = row.dataset.productCode;
        const product = this.data.products.find(p => p.code === productCode);

        if (product) {
            // 値を更新
            if (event.target.classList.contains('carryover-input')) {
                product.carryover = parseInt(event.target.value) || 0;
            } else if (event.target.classList.contains('expected-sales-input')) {
                product.expectedSales = parseInt(event.target.value) || 0;
            }

            // 発注数量を再計算
            product.orderQuantity = this.services.order.calculateOrderQuantity(
                product.carryover, 
                product.expectedSales
            );

            // 制約に基づく調整
            const adjustedQuantity = this.services.order.adjustQuantityToConstraints(
                product.orderQuantity,
                product.constraints
            );

            if (adjustedQuantity !== product.orderQuantity) {
                product.orderQuantity = adjustedQuantity;
                this.showConstraintAdjustmentMessage(product, adjustedQuantity);
            }

            // 表示を更新
            this.updateProductRow(productCode);
            this.updateSummary();
        }
    }

    /**
     * 発注数量直接変更ハンドラー
     */
    handleOrderQuantityChange(event) {
        const row = event.target.closest('.product-row');
        const productCode = row.dataset.productCode;
        const product = this.data.products.find(p => p.code === productCode);

        if (product) {
            const newQuantity = parseInt(event.target.value) || 0;
            
            // バリデーション
            const validation = this.services.validation.validateOrderConstraints(
                { ...product, quantity: newQuantity },
                product.constraints
            );

            if (validation.valid) {
                product.orderQuantity = newQuantity;
            } else {
                // エラー表示
                this.showValidationError(productCode, validation);
                // 制約に合わせて調整
                product.orderQuantity = validation.adjustedQuantity;
                event.target.value = product.orderQuantity;
            }

            this.updateProductRow(productCode);
            this.updateSummary();
        }
    }

    /**
     * 参考実績データのロード
     */
    async loadReferenceData() {
        const referencePanel = document.getElementById('referenceContent');
        if (!referencePanel) return;

        referencePanel.innerHTML = '<p class="loading">参考データを取得中...</p>';

        try {
            // シミュレート用のサンプルデータ
            const sampleHistoricalData = this.generateSampleHistoricalData();
            
            // 前年同曜日データ取得
            const previousYearData = this.services.historical.getPreviousYearSameDayData(
                this.data.date, 
                sampleHistoricalData
            );

            // 直近同曜日データ取得
            const recentSameDayData = this.services.historical.getSameDayOfWeekData(
                this.data.date, 
                4, 
                sampleHistoricalData
            );

            // 参考実績をフォーマット
            const referenceData = this.services.historical.formatReferenceData(
                recentSameDayData.length > 0 ? recentSameDayData : previousYearData,
                this.data.date
            );

            this.data.referenceData = referenceData;
            
            // 参考実績を表示
            this.displayReferenceData(referenceData);
            
            // 各商品の参考データを更新
            this.updateProductReferenceData(referenceData);

        } catch (error) {
            console.error('参考データの取得に失敗しました:', error);
            referencePanel.innerHTML = '<p class="error">参考データの取得に失敗しました</p>';
        }
    }

    /**
     * 参考実績データの表示
     */
    displayReferenceData(referenceData) {
        const content = document.getElementById('referenceContent');
        if (!content) return;

        if (!referenceData.products || referenceData.products.length === 0) {
            content.innerHTML = '<p class="info">参考データが見つかりませんでした</p>';
            return;
        }

        const quality = this.services.historical.evaluateDataQuality(
            referenceData.products.map(p => ({ products: p.recentData || [] }))
        );

        content.innerHTML = `
            <div class="reference-summary">
                <p><strong>${referenceData.summary}</strong></p>
                <p>データ品質: <span class="quality-${quality.level}">${quality.level.toUpperCase()}</span> 
                   (スコア: ${quality.score}/100)</p>
                <p>期間: ${referenceData.dateRange.from} 〜 ${referenceData.dateRange.to}</p>
            </div>
            <div class="reference-table-container">
                <table class="reference-table">
                    <thead>
                        <tr>
                            <th>商品名</th>
                            <th>平均発注数</th>
                            <th>平均販売数</th>
                            <th>最大発注</th>
                            <th>トレンド</th>
                            <th>信頼度</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${referenceData.products.map(product => `
                            <tr>
                                <td>${product.name || product.productCode}</td>
                                <td>${product.averageOrder}</td>
                                <td>${product.averageSales}</td>
                                <td>${product.maxOrder}</td>
                                <td class="trend-${product.trend}">${this.getTrendDisplay(product.trend)}</td>
                                <td>${Math.round(product.reliability * 100)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * 商品別参考データの更新
     */
    updateProductReferenceData(referenceData) {
        if (!referenceData.products) return;

        referenceData.products.forEach(refProduct => {
            const product = this.data.products.find(p => p.code === refProduct.productCode);
            if (product) {
                // 参考実績を表に表示
                const refCell = document.getElementById(`ref-${product.code}`);
                if (refCell) {
                    refCell.innerHTML = `
                        <div class="reference-info">
                            <div>平均: ${refProduct.averageOrder}</div>
                            <div class="trend-${refProduct.trend}">
                                ${this.getTrendDisplay(refProduct.trend)}
                            </div>
                        </div>
                    `;
                }

                // 本部基準との比較（仮データ）
                const budgetCell = document.getElementById(`budget-${product.code}`);
                if (budgetCell) {
                    const budgetQty = Math.round(refProduct.averageOrder * 1.1); // 仮の本部基準
                    const comparison = this.services.order.calculateOrderComparison(
                        product.orderQuantity,
                        refProduct.averageOrder,
                        budgetQty
                    );

                    budgetCell.innerHTML = `
                        <div class="budget-comparison">
                            <div>基準: ${budgetQty}</div>
                            <div class="comparison-${comparison.comparisonLevel}">
                                ${comparison.budgetDifference > 0 ? '+' : ''}${comparison.budgetDifference}
                                (${comparison.budgetDifferenceRate > 0 ? '+' : ''}${comparison.budgetDifferenceRate}%)
                            </div>
                        </div>
                    `;
                }
            }
        });
    }

    /**
     * 全体再計算
     */
    recalculateAll() {
        this.data.products.forEach(product => {
            // 基本計算
            product.orderQuantity = this.services.order.calculateOrderQuantity(
                product.carryover, 
                product.expectedSales
            );

            // 制約調整
            product.orderQuantity = this.services.order.adjustQuantityToConstraints(
                product.orderQuantity,
                product.constraints
            );
        });

        // 天気・季節要因の適用
        this.applyEnvironmentalFactors();

        // 表示更新
        this.updateAllProductRows();
        this.updateSummary();
        
        this.showMessage('発注数量を再計算しました', 'success');
    }

    /**
     * バリデーション実行
     */
    runValidation() {
        const validationPanel = document.getElementById('validationContent');
        if (!validationPanel) return;

        // 制約とヒストリカルデータを準備
        const constraints = {
            budget: {
                totalBudget: this.data.nextDayBudget,
                warningThreshold: 0.9,
                errorThreshold: 1.0
            },
            products: {}
        };

        this.data.products.forEach(product => {
            constraints.products[product.code] = product.constraints;
        });

        const sampleHistoricalData = this.generateSampleHistoricalData();

        // 複合バリデーション実行
        const validationResult = this.services.validation.validateOrderIntegrity(
            this.data.products,
            constraints,
            sampleHistoricalData
        );

        // 異常値検知
        this.runAnomalyDetection(sampleHistoricalData);

        // 結果表示
        this.displayValidationResults(validationResult);
    }

    /**
     * 異常値検知の実行
     */
    runAnomalyDetection(historicalData) {
        this.data.products.forEach(product => {
            const productHistory = historicalData
                .filter(h => h.products?.some(p => p.code === product.code))
                .map(h => h.products.find(p => p.code === product.code)?.quantity || 0);

            if (productHistory.length > 0) {
                const anomalyResult = this.services.validation.detectAnomalies(
                    product.orderQuantity,
                    productHistory,
                    { method: 'statistical', sensitivityLevel: 'medium' }
                );

                // 異常値警告を表示
                const anomalyCell = document.getElementById(`anomaly-${product.code}`);
                if (anomalyCell) {
                    if (anomalyResult.isAnomaly) {
                        anomalyCell.innerHTML = `
                            <div class="anomaly-${anomalyResult.level}">
                                <div class="anomaly-icon">⚠️</div>
                                <div class="anomaly-message">${anomalyResult.message}</div>
                            </div>
                        `;
                    } else {
                        anomalyCell.innerHTML = '<span class="normal">正常</span>';
                    }
                }
            }
        });
    }

    /**
     * バリデーション結果の表示
     */
    displayValidationResults(result) {
        const validationPanel = document.getElementById('validationContent');
        if (!validationPanel) return;

        const levelClass = `validation-${result.overallLevel}`;
        const statusIcon = result.valid ? '✅' : result.overallLevel === 'error' ? '❌' : '⚠️';

        let content = `
            <div class="validation-summary ${levelClass}">
                <h4>${statusIcon} バリデーション結果: ${result.valid ? '問題なし' : '要確認'}</h4>
                <div class="validation-stats">
                    <p>総アイテム数: ${result.summary.totalItems}件</p>
                    <p>正常: ${result.summary.validItems}件 / エラー: ${result.summary.errorItems}件 / 警告: ${result.summary.warningItems}件</p>
                    <p>総発注金額: ¥${result.summary.totalAmount.toLocaleString()}</p>
                </div>
            </div>
        `;

        // 予算チェック結果
        if (result.budgetResult) {
            content += `
                <div class="budget-validation">
                    <h5>予算チェック結果</h5>
                    <p>予算使用率: ${result.budgetResult.budgetUsage}% 
                       ${result.budgetResult.exceeds > 0 ? `(¥${result.budgetResult.exceeds.toLocaleString()}超過)` : ''}</p>
                </div>
            `;
        }

        // 異常値検知結果
        if (result.anomalyResults.length > 0) {
            content += `
                <div class="anomaly-validation">
                    <h5>異常値検知結果</h5>
                    <ul>
                        ${result.anomalyResults.map(anomaly => `
                            <li class="anomaly-${anomaly.level}">
                                ${anomaly.productName}: ${anomaly.message}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        // 推奨事項
        if (result.recommendations.length > 0) {
            content += `
                <div class="recommendations">
                    <h5>推奨事項</h5>
                    <ul>
                        ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        validationPanel.innerHTML = content;
    }

    // ユーティリティメソッド

    /**
     * サマリー計算
     */
    calculateSummary() {
        const totalQuantity = this.data.products.reduce((sum, p) => sum + (p.orderQuantity || 0), 0);
        const totalAmount = this.data.products.reduce((sum, p) => 
            sum + ((p.orderQuantity || 0) * (p.price || 0)), 0);
        const budgetUsage = this.data.nextDayBudget > 0 ? 
            Math.round((totalAmount / this.data.nextDayBudget) * 1000) / 10 : 0;

        return {
            totalQuantity,
            totalAmount,
            budgetUsage,
            orderableItems: this.data.products.filter(p => p.constraints.isOrderable).length,
            totalItems: this.data.products.length,
            constraintViolations: 0, // 後で実装
            anomalies: 0, // 後で実装
            dataQuality: 'Good',
            referenceCount: this.data.referenceData?.totalDataPoints || 0,
            confidence: '80%'
        };
    }

    /**
     * 商品行更新
     */
    updateProductRow(productCode) {
        const product = this.data.products.find(p => p.code === productCode);
        if (!product) return;

        const row = document.querySelector(`[data-product-code="${productCode}"]`);
        if (!row) return;

        // 発注数量更新
        const orderQuantityInput = row.querySelector('.order-quantity-input');
        if (orderQuantityInput) {
            orderQuantityInput.value = product.orderQuantity || 0;
        }

        // 発注金額更新
        const orderAmountCell = row.querySelector('.order-amount');
        if (orderAmountCell) {
            const amount = (product.orderQuantity || 0) * (product.price || 0);
            orderAmountCell.textContent = `¥${amount.toLocaleString()}`;
        }
    }

    /**
     * 全商品行更新
     */
    updateAllProductRows() {
        this.data.products.forEach(product => {
            this.updateProductRow(product.code);
        });
    }

    /**
     * サマリー更新
     */
    updateSummary() {
        const summaryPanel = document.querySelector('.summary-panel');
        if (!summaryPanel) return;

        const newSummaryHTML = this.renderSummary();
        summaryPanel.outerHTML = newSummaryHTML;
    }

    /**
     * サンプル過去データ生成（デモ用）
     */
    generateSampleHistoricalData() {
        const sampleData = [];
        const today = new Date();
        
        for (let i = 1; i <= 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            sampleData.push({
                date: date.toISOString().split('T')[0],
                weather: ['晴れ', '曇り', '雨'][Math.floor(Math.random() * 3)],
                temperature: 20 + Math.round(Math.random() * 10),
                products: this.data.products.map(product => ({
                    code: product.code,
                    name: product.name,
                    quantity: Math.round(product.orderQuantity * (0.8 + Math.random() * 0.4)),
                    sales: Math.round(product.expectedSales * (0.8 + Math.random() * 0.4))
                }))
            });
        }
        
        return sampleData;
    }

    /**
     * トレンド表示取得
     */
    getTrendDisplay(trend) {
        const displays = {
            'increasing': '↗️ 増加',
            'decreasing': '↘️ 減少',
            'stable': '→ 安定',
            'no_data': '- データなし'
        };
        return displays[trend] || displays['no_data'];
    }

    /**
     * メッセージ表示
     */
    showMessage(message, type = 'info') {
        // 簡易メッセージ表示（実装を簡略化）
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            padding: 10px 20px; border-radius: 4px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            z-index: 1000;
        `;
        
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 3000);
    }

    // 追加の実装メソッド（保存、送信、出力等）は必要に応じて実装

    /**
     * 発注内容保存
     */
    saveOrder() {
        // LocalStorageに保存（仮実装）
        const orderData = {
            date: this.data.date.toISOString(),
            weather: this.data.weather,
            temperature: this.data.temperature,
            budget: this.data.nextDayBudget,
            products: this.data.products.map(p => ({
                code: p.code,
                name: p.name,
                carryover: p.carryover,
                expectedSales: p.expectedSales,
                orderQuantity: p.orderQuantity
            }))
        };

        localStorage.setItem('westernConfectionOrder', JSON.stringify(orderData));
        this.showMessage('発注内容を保存しました', 'success');
    }

    /**
     * 発注確定・送信
     */
    submitOrder() {
        // バリデーション実行
        this.runValidation();
        
        // 実際の送信処理はAPI連携が必要
        this.showMessage('発注を確定しました（デモ版）', 'success');
    }

    /**
     * CSV出力
     */
    exportToCsv() {
        const csv = this.services.order.exportOrderToCSV(
            this.data.products,
            this.data.date.toISOString().split('T')[0]
        );

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `洋生ノート発注_${this.data.date.toISOString().split('T')[0]}.csv`;
        link.click();
    }

    /**
     * データリセット
     */
    resetData() {
        if (confirm('入力内容をリセットしますか？')) {
            this.loadInitialData();
            this.updateAllProductRows();
            this.updateSummary();
            this.showMessage('データをリセットしました', 'info');
        }
    }

    // 環境要因適用メソッド（天気・気温による補正）
    applyEnvironmentalFactors() {
        // 簡易実装: 天気による補正
        const weatherFactors = { '晴れ': 1.1, '曇り': 1.0, '雨': 0.9 };
        const weatherFactor = weatherFactors[this.data.weather] || 1.0;

        // 気温による補正（20度を基準）
        const tempFactor = 1.0 + ((this.data.temperature - 20) * 0.01);

        this.data.products.forEach(product => {
            if (product.constraints.isOrderable) {
                const basedQuantity = this.services.order.calculateOrderQuantity(
                    product.carryover, 
                    product.expectedSales
                );
                
                product.orderQuantity = Math.round(basedQuantity * weatherFactor * tempFactor);
                
                // 制約調整
                product.orderQuantity = this.services.order.adjustQuantityToConstraints(
                    product.orderQuantity,
                    product.constraints
                );
            }
        });
    }

    updateWeatherFactors() {
        this.applyEnvironmentalFactors();
        this.updateAllProductRows();
        this.updateSummary();
    }

    updateTemperatureFactors() {
        this.applyEnvironmentalFactors();
        this.updateAllProductRows();
        this.updateSummary();
    }

    updateBudgetDisplay() {
        this.updateSummary();
    }

    showConstraintAdjustmentMessage(product, adjustedQuantity) {
        this.showMessage(`${product.name}の発注数量を制約に合わせて${adjustedQuantity}個に調整しました`, 'info');
    }

    showValidationError(productCode, validation) {
        const errorMessages = validation.errors.map(e => e.message).join(', ');
        this.showMessage(`${productCode}: ${errorMessages}`, 'error');
    }
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WesternConfectionNote;
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.WesternConfectionNote = WesternConfectionNote;
}