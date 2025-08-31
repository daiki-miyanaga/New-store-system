/**
 * ValidationService - バリデーション・検証ビジネスロジック
 * MOCアーキテクチャのサービス層 - 洋生ノート仕様対応
 */
class ValidationService {
    
    /**
     * 発注制約の包括的バリデーション
     * @param {Object} orderData - 発注データ
     * @param {Object} constraints - 制約条件
     * @returns {Object} バリデーション結果
     */
    static validateOrderConstraints(orderData, constraints = {}) {
        const {
            minOrderQuantity = 0,
            orderUnit = 1,
            maxOrderQuantity = Infinity,
            isOrderable = true,
            budgetLimit = Infinity,
            deadlineDate = null
        } = constraints;

        const quantity = orderData.quantity || 0;
        const amount = (orderData.quantity || 0) * (orderData.price || 0);
        const orderDate = orderData.orderDate ? new Date(orderData.orderDate) : new Date();
        
        const errors = [];
        const warnings = [];
        let level = 'normal';

        // 発注可能商品チェック
        if (!isOrderable) {
            errors.push({
                code: 'ORDER_NOT_ALLOWED',
                message: 'この商品は発注対象外です',
                field: 'isOrderable'
            });
        }

        // 締切日チェック
        if (deadlineDate && orderDate > new Date(deadlineDate)) {
            errors.push({
                code: 'DEADLINE_EXCEEDED',
                message: `発注締切を過ぎています（締切: ${deadlineDate}）`,
                field: 'orderDate'
            });
        }

        // 数量関連バリデーション
        if (quantity < 0) {
            errors.push({
                code: 'NEGATIVE_QUANTITY',
                message: '発注数量は0以上で入力してください',
                field: 'quantity'
            });
        } else if (quantity > 0) {
            // 最小発注数チェック
            if (quantity < minOrderQuantity) {
                errors.push({
                    code: 'MIN_ORDER_VIOLATION',
                    message: `最小発注数量は${minOrderQuantity}個です`,
                    field: 'quantity'
                });
            }

            // 発注倍数チェック
            if (quantity % orderUnit !== 0) {
                errors.push({
                    code: 'ORDER_UNIT_VIOLATION',
                    message: `発注数量は${orderUnit}の倍数で入力してください`,
                    field: 'quantity'
                });
            }

            // 最大発注数チェック
            if (quantity > maxOrderQuantity) {
                warnings.push({
                    code: 'MAX_ORDER_WARNING',
                    message: `最大発注数量(${maxOrderQuantity}個)を超えています`,
                    field: 'quantity'
                });
            }
        }

        // 予算チェック
        if (amount > budgetLimit) {
            if (budgetLimit !== Infinity) {
                errors.push({
                    code: 'BUDGET_EXCEEDED',
                    message: `予算上限(¥${budgetLimit.toLocaleString()})を超えています`,
                    field: 'amount'
                });
            }
        } else if (amount > budgetLimit * 0.9) {
            warnings.push({
                code: 'BUDGET_WARNING',
                message: '予算の90%を超えています',
                field: 'amount'
            });
        }

        // レベル判定
        if (errors.length > 0) level = 'error';
        else if (warnings.length > 0) level = 'warning';

        // 自動調整提案
        const adjustedQuantity = this.suggestAdjustedQuantity(quantity, constraints);

        return {
            valid: errors.length === 0,
            level,
            errors,
            warnings,
            adjustedQuantity,
            canAutoFix: errors.some(e => ['ORDER_UNIT_VIOLATION', 'MIN_ORDER_VIOLATION'].includes(e.code)),
            summary: this.generateValidationSummary(errors, warnings)
        };
    }

    /**
     * 予算制約の検証
     * @param {Array} orderList - 発注リスト
     * @param {Object} budgetConstraints - 予算制約
     * @returns {Object} 予算バリデーション結果
     */
    static validateBudgetConstraints(orderList, budgetConstraints = {}) {
        const {
            totalBudget = 0,
            categoryBudgets = {},
            dailyBudget = Infinity,
            warningThreshold = 0.9,
            errorThreshold = 1.0
        } = budgetConstraints;

        if (!orderList || orderList.length === 0) {
            return {
                valid: true,
                level: 'normal',
                totalAmount: 0,
                budgetUsage: 0,
                exceeds: 0,
                details: { total: { used: 0, budget: totalBudget, rate: 0 } }
            };
        }

        // 総額計算
        const totalAmount = orderList.reduce((sum, order) => 
            sum + ((order.quantity || 0) * (order.price || 0)), 0);

        // カテゴリ別集計
        const categoryTotals = {};
        orderList.forEach(order => {
            const category = order.category || 'その他';
            categoryTotals[category] = (categoryTotals[category] || 0) + 
                ((order.quantity || 0) * (order.price || 0));
        });

        // 総予算チェック
        const totalUsageRate = totalBudget > 0 ? totalAmount / totalBudget : 0;
        const totalExceeds = Math.max(0, totalAmount - totalBudget);

        // カテゴリ予算チェック
        const categoryResults = {};
        Object.keys(categoryTotals).forEach(category => {
            const used = categoryTotals[category];
            const budget = categoryBudgets[category] || Infinity;
            const rate = budget !== Infinity ? used / budget : 0;
            const exceeds = Math.max(0, used - budget);

            categoryResults[category] = {
                used: Math.round(used),
                budget,
                rate: Math.round(rate * 1000) / 10,
                exceeds: Math.round(exceeds),
                level: this.determineBudgetLevel(rate, warningThreshold, errorThreshold)
            };
        });

        // 全体レベル判定
        let overallLevel = 'normal';
        if (totalUsageRate > errorThreshold) {
            overallLevel = 'error';
        } else if (totalUsageRate > warningThreshold) {
            overallLevel = 'warning';
        }

        // カテゴリレベルも考慮
        Object.values(categoryResults).forEach(result => {
            if (result.level === 'error' && overallLevel !== 'error') {
                overallLevel = 'error';
            } else if (result.level === 'warning' && overallLevel === 'normal') {
                overallLevel = 'warning';
            }
        });

        return {
            valid: totalExceeds === 0 && !Object.values(categoryResults).some(r => r.exceeds > 0),
            level: overallLevel,
            totalAmount: Math.round(totalAmount),
            budgetUsage: Math.round(totalUsageRate * 1000) / 10,
            exceeds: Math.round(totalExceeds),
            details: {
                total: {
                    used: Math.round(totalAmount),
                    budget: totalBudget,
                    rate: Math.round(totalUsageRate * 1000) / 10,
                    exceeds: Math.round(totalExceeds)
                },
                categories: categoryResults
            },
            suggestions: this.generateBudgetSuggestions(categoryResults, totalUsageRate, errorThreshold)
        };
    }

    /**
     * 異常値検知
     * @param {number} value - 検証対象値
     * @param {Array} historicalData - 過去データ
     * @param {Object} options - 検知オプション
     * @returns {Object} 異常値検知結果
     */
    static detectAnomalies(value, historicalData = [], options = {}) {
        const {
            method = 'statistical', // 'statistical', 'percentile', 'iqr'
            sensitivityLevel = 'medium', // 'low', 'medium', 'high'
            minDataPoints = 5
        } = options;

        if (!historicalData || historicalData.length < minDataPoints) {
            return {
                isAnomaly: false,
                level: 'normal',
                message: `異常値検知には最低${minDataPoints}件のデータが必要です`,
                confidence: 0,
                details: { method, dataPoints: historicalData.length }
            };
        }

        const cleanData = historicalData.filter(d => d !== null && d !== undefined && !isNaN(d)).sort((a, b) => a - b);
        
        if (cleanData.length < minDataPoints) {
            return {
                isAnomaly: false,
                level: 'normal',
                message: '有効なデータが不足しています',
                confidence: 0,
                details: { method, validDataPoints: cleanData.length }
            };
        }

        let result;
        switch (method) {
            case 'statistical':
                result = this.detectStatisticalAnomalies(value, cleanData, sensitivityLevel);
                break;
            case 'percentile':
                result = this.detectPercentileAnomalies(value, cleanData, sensitivityLevel);
                break;
            case 'iqr':
                result = this.detectIQRAnomalies(value, cleanData, sensitivityLevel);
                break;
            default:
                result = this.detectStatisticalAnomalies(value, cleanData, sensitivityLevel);
        }

        return {
            ...result,
            details: {
                method,
                dataPoints: cleanData.length,
                sensitivity: sensitivityLevel,
                statistics: this.calculateBasicStatistics(cleanData)
            }
        };
    }

    /**
     * 複合バリデーション（発注データ全体の整合性チェック）
     * @param {Array} orderList - 発注リスト
     * @param {Object} constraints - 制約条件
     * @param {Array} historicalData - 過去データ
     * @returns {Object} 複合バリデーション結果
     */
    static validateOrderIntegrity(orderList, constraints = {}, historicalData = []) {
        const results = {
            valid: true,
            overallLevel: 'normal',
            summary: {
                totalItems: orderList.length,
                validItems: 0,
                errorItems: 0,
                warningItems: 0,
                totalAmount: 0
            },
            itemResults: [],
            budgetResult: null,
            anomalyResults: [],
            recommendations: []
        };

        // 個別アイテムバリデーション
        orderList.forEach((order, index) => {
            const itemConstraints = {
                ...constraints.default,
                ...constraints.products?.[order.code]
            };

            const itemResult = this.validateOrderConstraints(order, itemConstraints);
            
            results.itemResults.push({
                index,
                productCode: order.code,
                productName: order.name,
                ...itemResult
            });

            // サマリー更新
            results.summary.totalAmount += (order.quantity || 0) * (order.price || 0);
            
            if (itemResult.valid) {
                results.summary.validItems++;
            } else {
                results.summary.errorItems++;
                results.valid = false;
            }
            
            if (itemResult.level === 'warning') {
                results.summary.warningItems++;
            }
            
            if (itemResult.level === 'error') {
                results.overallLevel = 'error';
            } else if (itemResult.level === 'warning' && results.overallLevel === 'normal') {
                results.overallLevel = 'warning';
            }
        });

        // 予算バリデーション
        if (constraints.budget) {
            results.budgetResult = this.validateBudgetConstraints(orderList, constraints.budget);
            
            if (!results.budgetResult.valid) {
                results.valid = false;
                if (results.overallLevel !== 'error') {
                    results.overallLevel = results.budgetResult.level;
                }
            }
        }

        // 異常値検知
        if (historicalData && historicalData.length > 0) {
            orderList.forEach(order => {
                const productHistory = historicalData
                    .filter(h => h.products?.some(p => p.code === order.code))
                    .map(h => h.products.find(p => p.code === order.code)?.quantity || 0);

                if (productHistory.length > 0) {
                    const anomalyResult = this.detectAnomalies(
                        order.quantity,
                        productHistory,
                        constraints.anomalyDetection
                    );

                    if (anomalyResult.isAnomaly) {
                        results.anomalyResults.push({
                            productCode: order.code,
                            productName: order.name,
                            ...anomalyResult
                        });

                        if (anomalyResult.level === 'error' && results.overallLevel !== 'error') {
                            results.overallLevel = 'warning'; // 異常値は警告レベルまで
                        }
                    }
                }
            });
        }

        // 推奨事項生成
        results.recommendations = this.generateIntegrityRecommendations(results);

        return results;
    }

    // ヘルパーメソッド

    static suggestAdjustedQuantity(quantity, constraints) {
        const {
            minOrderQuantity = 0,
            orderUnit = 1,
            maxOrderQuantity = Infinity
        } = constraints;

        if (quantity <= 0) return minOrderQuantity;

        let adjusted = Math.max(quantity, minOrderQuantity);
        adjusted = Math.min(adjusted, maxOrderQuantity);
        
        // 発注倍数に調整（四捨五入）
        adjusted = Math.round(adjusted / orderUnit) * orderUnit;
        
        // 最小発注数を下回る場合は最小発注数に調整
        if (adjusted < minOrderQuantity) {
            adjusted = Math.ceil(minOrderQuantity / orderUnit) * orderUnit;
        }

        return adjusted;
    }

    static generateValidationSummary(errors, warnings) {
        if (errors.length === 0 && warnings.length === 0) {
            return '発注制約を満たしています';
        }

        let summary = [];
        if (errors.length > 0) {
            summary.push(`エラー${errors.length}件`);
        }
        if (warnings.length > 0) {
            summary.push(`警告${warnings.length}件`);
        }

        return summary.join('、');
    }

    static determineBudgetLevel(rate, warningThreshold, errorThreshold) {
        if (rate > errorThreshold) return 'error';
        if (rate > warningThreshold) return 'warning';
        return 'normal';
    }

    static generateBudgetSuggestions(categoryResults, totalUsageRate, errorThreshold) {
        const suggestions = [];

        if (totalUsageRate > errorThreshold) {
            suggestions.push('総予算を超過しています。発注数量を見直してください');
        }

        Object.entries(categoryResults).forEach(([category, result]) => {
            if (result.exceeds > 0) {
                suggestions.push(`${category}カテゴリの予算を¥${result.exceeds.toLocaleString()}超過しています`);
            }
        });

        // 予算内での最適化提案
        const overBudgetCategories = Object.entries(categoryResults)
            .filter(([_, result]) => result.exceeds > 0)
            .sort(([_, a], [__, b]) => b.rate - a.rate);

        if (overBudgetCategories.length > 0) {
            const topCategory = overBudgetCategories[0][0];
            suggestions.push(`${topCategory}の発注を優先的に調整することをお勧めします`);
        }

        return suggestions;
    }

    // 異常値検知メソッド群

    static detectStatisticalAnomalies(value, data, sensitivity) {
        const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
        const stdDev = Math.sqrt(variance);

        const thresholds = {
            low: 3.0,    // 3シグマ
            medium: 2.5, // 2.5シグマ
            high: 2.0    // 2シグマ
        };

        const threshold = thresholds[sensitivity] || thresholds.medium;
        const zScore = stdDev > 0 ? Math.abs(value - mean) / stdDev : 0;
        const isAnomaly = zScore > threshold;

        return {
            isAnomaly,
            level: isAnomaly ? (zScore > 3.0 ? 'error' : 'warning') : 'normal',
            message: isAnomaly 
                ? `統計的異常値: 平均から${zScore.toFixed(1)}標準偏差離れています`
                : '正常範囲内です',
            confidence: Math.min(1.0, zScore / threshold),
            metrics: { zScore: zScore.toFixed(2), mean: mean.toFixed(1), stdDev: stdDev.toFixed(1) }
        };
    }

    static detectPercentileAnomalies(value, data, sensitivity) {
        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;
        
        const percentiles = {
            low: { lower: 0.05, upper: 0.95 },    // 5-95パーセンタイル
            medium: { lower: 0.1, upper: 0.9 },   // 10-90パーセンタイル
            high: { lower: 0.15, upper: 0.85 }    // 15-85パーセンタイル
        };

        const { lower, upper } = percentiles[sensitivity] || percentiles.medium;
        
        const lowerIndex = Math.floor(n * lower);
        const upperIndex = Math.floor(n * upper);
        const lowerBound = sorted[lowerIndex];
        const upperBound = sorted[upperIndex];

        const isAnomaly = value < lowerBound || value > upperBound;
        const distanceFromBounds = Math.min(
            Math.abs(value - lowerBound),
            Math.abs(value - upperBound)
        );

        return {
            isAnomaly,
            level: isAnomaly ? 'warning' : 'normal',
            message: isAnomaly 
                ? `パーセンタイル異常値: ${lower*100}-${upper*100}%範囲外です`
                : '正常範囲内です',
            confidence: isAnomaly ? Math.min(1.0, distanceFromBounds / (upperBound - lowerBound)) : 0,
            metrics: { 
                lowerBound: lowerBound.toFixed(1), 
                upperBound: upperBound.toFixed(1),
                percentile: `${lower*100}-${upper*100}%`
            }
        };
    }

    static detectIQRAnomalies(value, data, sensitivity) {
        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;
        
        const q1Index = Math.floor(n * 0.25);
        const q3Index = Math.floor(n * 0.75);
        const q1 = sorted[q1Index];
        const q3 = sorted[q3Index];
        const iqr = q3 - q1;

        const multipliers = {
            low: 2.5,    // 2.5 * IQR
            medium: 2.0, // 2.0 * IQR
            high: 1.5    // 1.5 * IQR (標準)
        };

        const multiplier = multipliers[sensitivity] || multipliers.medium;
        const lowerBound = q1 - multiplier * iqr;
        const upperBound = q3 + multiplier * iqr;

        const isAnomaly = value < lowerBound || value > upperBound;

        return {
            isAnomaly,
            level: isAnomaly ? 'warning' : 'normal',
            message: isAnomaly 
                ? `IQR異常値: 四分位範囲の${multiplier}倍を超えています`
                : '正常範囲内です',
            confidence: isAnomaly ? 0.8 : 0,
            metrics: { 
                q1: q1.toFixed(1), 
                q3: q3.toFixed(1), 
                iqr: iqr.toFixed(1),
                bounds: `${lowerBound.toFixed(1)} - ${upperBound.toFixed(1)}`
            }
        };
    }

    static calculateBasicStatistics(data) {
        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;
        const mean = sorted.reduce((sum, val) => sum + val, 0) / n;
        const median = n % 2 === 0 
            ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
            : sorted[Math.floor(n/2)];
        
        const variance = sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);

        return {
            count: n,
            mean: Math.round(mean * 10) / 10,
            median: Math.round(median * 10) / 10,
            stdDev: Math.round(stdDev * 10) / 10,
            min: sorted[0],
            max: sorted[n-1]
        };
    }

    static generateIntegrityRecommendations(results) {
        const recommendations = [];

        // エラーアイテムへの対応
        if (results.summary.errorItems > 0) {
            recommendations.push(`${results.summary.errorItems}件のアイテムにエラーがあります。修正が必要です`);
        }

        // 予算超過への対応
        if (results.budgetResult && !results.budgetResult.valid) {
            recommendations.push('予算を超過しています。発注数量を見直してください');
        }

        // 異常値への対応
        if (results.anomalyResults.length > 0) {
            recommendations.push(`${results.anomalyResults.length}件の異常値を検出しました。過去実績と比較して確認してください`);
        }

        // 効率性の改善提案
        const warningRate = results.summary.warningItems / results.summary.totalItems;
        if (warningRate > 0.3) {
            recommendations.push('多くのアイテムで警告が発生しています。発注制約の見直しをお勧めします');
        }

        return recommendations;
    }
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationService;
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.ValidationService = ValidationService;
}