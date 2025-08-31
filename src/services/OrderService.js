/**
 * OrderService - 発注管理ビジネスロジック
 * MOCアーキテクチャのサービス層 - 洋生ノート仕様対応
 */
class OrderService {
    
    /**
     * 発注数量を計算（洋生ノート仕様）
     * @param {number} carryover - 翌日に繰り越す数量
     * @param {number} nextDayExpectedSales - 翌日の予想販売数
     * @returns {number} 発注数量
     */
    static calculateOrderQuantity(carryover, nextDayExpectedSales) {
        const carryoverQty = carryover || 0;
        const expectedSales = nextDayExpectedSales || 0;
        return Math.max(0, carryoverQty + expectedSales);
    }

    /**
     * 構成比ベースの発注数量計算
     * @param {number} totalBudget - 総予算
     * @param {Array} products - 商品データ
     * @param {Object} composition - 構成比データ（商品コード: 構成比%）
     * @returns {Array} 発注データ
     */
    static calculateOrderQuantitiesFromComposition(totalBudget, products, composition) {
        if (!products || !composition || !totalBudget) return [];

        return products.map(product => {
            const compositionRate = composition[product.code] || 0;
            const allocatedAmount = (totalBudget * compositionRate) / 100;
            const quantity = Math.floor(allocatedAmount / (product.price || 1));
            const actualAmount = quantity * (product.price || 0);
            
            return {
                ...product,
                compositionRate,
                allocatedAmount: Math.round(allocatedAmount),
                quantity,
                actualAmount,
                orderQuantity: quantity
            };
        });
    }

    /**
     * 参考実績との比較計算
     * @param {number} currentOrderQty - 現在の発注数量
     * @param {number} referenceQty - 参考実績数量（前年同曜日等）
     * @param {number} budgetQty - 本部基準数量
     * @returns {Object} 比較結果
     */
    static calculateOrderComparison(currentOrderQty, referenceQty, budgetQty) {
        const current = currentOrderQty || 0;
        const reference = referenceQty || 0;
        const budget = budgetQty || 0;

        const refDifference = current - reference;
        const budgetDifference = current - budget;
        
        const refDifferenceRate = reference > 0 ? (refDifference / reference) * 100 : 0;
        const budgetDifferenceRate = budget > 0 ? (budgetDifference / budget) * 100 : 0;

        return {
            currentOrderQty: current,
            referenceQty: reference,
            budgetQty: budget,
            refDifference,
            budgetDifference,
            refDifferenceRate: Math.round(refDifferenceRate * 10) / 10,
            budgetDifferenceRate: Math.round(budgetDifferenceRate * 10) / 10,
            comparisonLevel: this.getComparisonLevel(refDifferenceRate, budgetDifferenceRate)
        };
    }

    /**
     * 発注制約のバリデーション
     * @param {number} quantity - 発注数量
     * @param {Object} constraints - 制約条件
     * @returns {Object} バリデーション結果
     */
    static validateOrderConstraints(quantity, constraints = {}) {
        const {
            minOrderQuantity = 0,
            orderUnit = 1,
            maxOrderQuantity = Infinity,
            isOrderable = true
        } = constraints;

        const qty = quantity || 0;
        const errors = [];

        // 発注可能商品チェック
        if (!isOrderable) {
            return {
                valid: false,
                level: 'error',
                errors: ['この商品は発注不可です'],
                quantity: 0
            };
        }

        // 最小発注数チェック
        if (qty < minOrderQuantity) {
            errors.push(`最小発注数量は${minOrderQuantity}個です`);
        }

        // 発注倍数チェック
        if (qty % orderUnit !== 0) {
            errors.push(`発注数量は${orderUnit}の倍数で入力してください`);
        }

        // 最大発注数チェック
        if (qty > maxOrderQuantity) {
            errors.push(`最大発注数量は${maxOrderQuantity}個です`);
        }

        const isValid = errors.length === 0;
        
        return {
            valid: isValid,
            level: isValid ? 'normal' : 'error',
            errors,
            adjustedQuantity: this.adjustQuantityToConstraints(qty, constraints)
        };
    }

    /**
     * 制約に合わせて数量を調整
     * @param {number} quantity - 元の数量
     * @param {Object} constraints - 制約条件
     * @returns {number} 調整後の数量
     */
    static adjustQuantityToConstraints(quantity, constraints = {}) {
        const {
            minOrderQuantity = 0,
            orderUnit = 1,
            maxOrderQuantity = Infinity,
            isOrderable = true
        } = constraints;

        if (!isOrderable) return 0;

        let adjusted = Math.max(quantity || 0, minOrderQuantity);
        adjusted = Math.min(adjusted, maxOrderQuantity);
        
        // 発注倍数に調整（切り下げ）
        adjusted = Math.floor(adjusted / orderUnit) * orderUnit;
        
        // 最小発注数を下回る場合は最小発注数に調整
        if (adjusted < minOrderQuantity && adjusted > 0) {
            adjusted = minOrderQuantity;
        }

        return adjusted;
    }

    /**
     * 予算制約チェック
     * @param {Array} orders - 発注データ
     * @param {number} budget - 予算上限
     * @returns {Object} 予算チェック結果
     */
    static validateBudgetConstraints(orders, budget) {
        if (!orders || orders.length === 0) {
            return {
                valid: true,
                totalAmount: 0,
                budgetUsage: 0,
                exceeds: 0,
                level: 'normal'
            };
        }

        const totalAmount = orders.reduce((sum, order) => 
            sum + ((order.quantity || 0) * (order.price || 0)), 0);
        
        const budgetUsage = budget > 0 ? (totalAmount / budget) * 100 : 0;
        const exceeds = Math.max(0, totalAmount - budget);

        let level = 'normal';
        if (budgetUsage > 105) {
            level = 'error';
        } else if (budgetUsage > 95) {
            level = 'warning';
        }

        return {
            valid: exceeds === 0,
            totalAmount: Math.round(totalAmount),
            budgetUsage: Math.round(budgetUsage * 10) / 10,
            exceeds: Math.round(exceeds),
            level
        };
    }

    /**
     * 異常値検知
     * @param {number} orderQuantity - 発注数量
     * @param {Array} historicalData - 過去データ
     * @param {Object} options - 検知オプション
     * @returns {Object} 異常値検知結果
     */
    static detectAnomalies(orderQuantity, historicalData = [], options = {}) {
        const {
            deviationThreshold = 2.0, // 標準偏差の倍数
            percentageThreshold = 50   // 平均からの乖離率（%）
        } = options;

        if (!historicalData || historicalData.length < 3) {
            return { isAnomaly: false, level: 'normal', message: '過去データが不足しています' };
        }

        const quantities = historicalData.map(data => data.quantity || 0);
        const avg = quantities.reduce((sum, qty) => sum + qty, 0) / quantities.length;
        
        // 標準偏差計算
        const variance = quantities.reduce((sum, qty) => sum + Math.pow(qty - avg, 2), 0) / quantities.length;
        const stdDev = Math.sqrt(variance);

        const currentQty = orderQuantity || 0;
        const deviationFromAvg = Math.abs(currentQty - avg);
        const deviationFactor = stdDev > 0 ? deviationFromAvg / stdDev : 0;
        const percentageDifference = avg > 0 ? Math.abs((currentQty - avg) / avg) * 100 : 0;

        // 異常値判定
        const isStatisticalAnomaly = deviationFactor > deviationThreshold;
        const isPercentageAnomaly = percentageDifference > percentageThreshold;
        
        let level = 'normal';
        let message = '';

        if (isStatisticalAnomaly || isPercentageAnomaly) {
            level = isStatisticalAnomaly && isPercentageAnomaly ? 'error' : 'warning';
            
            if (currentQty > avg) {
                message = `発注数量が平均より${Math.round(percentageDifference)}%多くなっています（平均: ${Math.round(avg)}個）`;
            } else {
                message = `発注数量が平均より${Math.round(percentageDifference)}%少なくなっています（平均: ${Math.round(avg)}個）`;
            }
        }

        return {
            isAnomaly: isStatisticalAnomaly || isPercentageAnomaly,
            level,
            message,
            statistics: {
                average: Math.round(avg),
                standardDeviation: Math.round(stdDev * 100) / 100,
                deviationFactor: Math.round(deviationFactor * 100) / 100,
                percentageDifference: Math.round(percentageDifference * 10) / 10
            }
        };
    }

    /**
     * 持越率を計算
     * @param {number} carryover - 繰越数量
     * @param {number} totalNeed - 総必要数量
     * @returns {number} 持越率（%）
     */
    static calculateCarryoverRate(carryover, totalNeed) {
        if (!totalNeed || totalNeed === 0) return 0;
        return ((carryover || 0) / totalNeed) * 100;
    }

    /**
     * 発注推奨数量の計算（AI推奨機能）
     * @param {Object} orderData - 発注データ
     * @param {Array} historicalData - 過去データ
     * @param {Object} factors - 補正要因
     * @returns {Object} 推奨発注数量
     */
    static calculateRecommendedOrder(orderData, historicalData = [], factors = {}) {
        const {
            weatherFactor = 1.0,     // 天気係数
            seasonFactor = 1.0,      // 季節係数
            eventFactor = 1.0,       // イベント係数
            dayOfWeekFactor = 1.0    // 曜日係数
        } = factors;

        const baseCarryover = orderData.carryover || 0;
        const baseSales = orderData.expectedSales || 0;
        
        // 過去データから平均を算出
        let avgSales = baseSales;
        if (historicalData && historicalData.length > 0) {
            avgSales = historicalData.reduce((sum, data) => sum + (data.sales || 0), 0) / historicalData.length;
        }

        // 各種要因で補正
        const adjustedSales = Math.round(avgSales * weatherFactor * seasonFactor * eventFactor * dayOfWeekFactor);
        const recommendedQuantity = Math.max(0, baseCarryover + adjustedSales);

        return {
            baseCarryover,
            baseSales,
            avgSales: Math.round(avgSales),
            adjustedSales,
            recommendedQuantity,
            factors: {
                weatherFactor,
                seasonFactor,
                eventFactor,
                dayOfWeekFactor,
                totalFactor: weatherFactor * seasonFactor * eventFactor * dayOfWeekFactor
            },
            confidence: this.calculateConfidenceLevel(historicalData.length, factors)
        };
    }

    // ヘルパーメソッド
    static getComparisonLevel(refRate, budgetRate) {
        const maxRate = Math.max(Math.abs(refRate), Math.abs(budgetRate));
        
        if (maxRate > 30) return 'error';
        if (maxRate > 15) return 'warning';
        return 'normal';
    }

    static calculateConfidenceLevel(dataPoints, factors) {
        let confidence = 0.5; // ベース信頼度50%
        
        // データポイント数による信頼度向上
        if (dataPoints >= 10) confidence += 0.3;
        else if (dataPoints >= 5) confidence += 0.2;
        else if (dataPoints >= 3) confidence += 0.1;
        
        // 要因数による信頼度調整
        const factorCount = Object.keys(factors).filter(key => factors[key] !== 1.0).length;
        confidence += factorCount * 0.05;
        
        return Math.min(1.0, Math.max(0.1, confidence));
    }

    /**
     * 発注データをCSV形式で出力
     * @param {Array} orderData - 発注データ
     * @param {string} orderDate - 発注日
     * @returns {string} CSV文字列
     */
    static exportOrderToCSV(orderData, orderDate = '') {
        if (!orderData || orderData.length === 0) return '';

        const headers = [
            '発注日', '商品コード', '商品名', '単価', '発注数量', '金額', 
            '繰越数量', '予想販売数', '参考実績', '本部基準', '備考'
        ];

        const csvRows = orderData.map(item => [
            orderDate,
            item.code || '',
            item.name || '',
            item.price || 0,
            item.quantity || 0,
            (item.quantity || 0) * (item.price || 0),
            item.carryover || 0,
            item.expectedSales || 0,
            item.referenceQty || 0,
            item.budgetQty || 0,
            item.note || ''
        ]);

        return [headers, ...csvRows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderService;
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.OrderService = OrderService;
}