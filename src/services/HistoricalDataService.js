/**
 * HistoricalDataService - 過去実績データ管理ビジネスロジック
 * MOCアーキテクチャのサービス層 - 洋生ノート仕様対応
 */
class HistoricalDataService {
    
    /**
     * 前年同曜日のデータを取得
     * @param {Date} targetDate - 対象日
     * @param {Array} historicalData - 過去データ
     * @returns {Array} 前年同曜日データ
     */
    static getPreviousYearSameDayData(targetDate, historicalData = []) {
        if (!targetDate || !historicalData || historicalData.length === 0) return [];

        const targetDayOfWeek = targetDate.getDay();
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();
        const previousYear = targetYear - 1;

        return historicalData.filter(data => {
            const dataDate = new Date(data.date);
            return (
                dataDate.getFullYear() === previousYear &&
                dataDate.getMonth() === targetMonth &&
                dataDate.getDay() === targetDayOfWeek
            );
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * 直近N日間の実績データを取得
     * @param {Date} fromDate - 基準日
     * @param {number} days - 取得日数
     * @param {Array} historicalData - 過去データ
     * @returns {Array} 直近実績データ
     */
    static getRecentData(fromDate, days = 7, historicalData = []) {
        if (!fromDate || !historicalData || historicalData.length === 0) return [];

        const endDate = new Date(fromDate);
        const startDate = new Date(fromDate);
        startDate.setDate(startDate.getDate() - days);

        return historicalData.filter(data => {
            const dataDate = new Date(data.date);
            return dataDate >= startDate && dataDate <= endDate;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * 同じ曜日の過去データを取得
     * @param {Date} targetDate - 対象日
     * @param {number} weeks - 取得週数
     * @param {Array} historicalData - 過去データ
     * @returns {Array} 同曜日データ
     */
    static getSameDayOfWeekData(targetDate, weeks = 4, historicalData = []) {
        if (!targetDate || !historicalData || historicalData.length === 0) return [];

        const targetDayOfWeek = targetDate.getDay();
        const endDate = new Date(targetDate);
        const startDate = new Date(targetDate);
        startDate.setDate(startDate.getDate() - (weeks * 7));

        return historicalData.filter(data => {
            const dataDate = new Date(data.date);
            return (
                dataDate >= startDate &&
                dataDate < endDate &&
                dataDate.getDay() === targetDayOfWeek
            );
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * 参考実績サマリーを生成
     * @param {Array} referenceData - 参考データ
     * @param {string} productCode - 商品コード
     * @returns {Object} 参考実績サマリー
     */
    static generateReferenceSummary(referenceData, productCode) {
        if (!referenceData || referenceData.length === 0) {
            return {
                productCode,
                dataCount: 0,
                averageOrder: 0,
                averageSales: 0,
                averageWaste: 0,
                maxOrder: 0,
                minOrder: 0,
                trend: 'no_data',
                reliability: 0
            };
        }

        const productData = referenceData.map(data => {
            const product = data.products?.find(p => p.code === productCode);
            return product || { orderQuantity: 0, sales: 0, waste: 0 };
        }).filter(p => p.orderQuantity > 0 || p.sales > 0);

        if (productData.length === 0) {
            return {
                productCode,
                dataCount: 0,
                averageOrder: 0,
                averageSales: 0,
                averageWaste: 0,
                maxOrder: 0,
                minOrder: 0,
                trend: 'no_data',
                reliability: 0
            };
        }

        const orders = productData.map(p => p.orderQuantity || 0);
        const sales = productData.map(p => p.sales || 0);
        const wastes = productData.map(p => p.waste || 0);

        const averageOrder = orders.reduce((sum, qty) => sum + qty, 0) / orders.length;
        const averageSales = sales.reduce((sum, qty) => sum + qty, 0) / sales.length;
        const averageWaste = wastes.reduce((sum, qty) => sum + qty, 0) / wastes.length;
        const maxOrder = Math.max(...orders);
        const minOrder = Math.min(...orders.filter(o => o > 0));

        // トレンド分析（直近3データポイントの傾向）
        const trend = this.analyzeTrend(orders.slice(0, 3));
        
        // 信頼性スコア（データ数と分散に基づく）
        const reliability = this.calculateReliabilityScore(orders);

        return {
            productCode,
            dataCount: productData.length,
            averageOrder: Math.round(averageOrder * 10) / 10,
            averageSales: Math.round(averageSales * 10) / 10,
            averageWaste: Math.round(averageWaste * 10) / 10,
            maxOrder,
            minOrder: minOrder === Infinity ? 0 : minOrder,
            trend,
            reliability,
            lastOrderDate: referenceData[0]?.date || '',
            varianceOrder: this.calculateVariance(orders)
        };
    }

    /**
     * 季節調整係数を計算
     * @param {Date} targetDate - 対象日
     * @param {Array} historicalData - 過去データ
     * @param {string} productCode - 商品コード
     * @returns {number} 季節調整係数
     */
    static calculateSeasonalFactor(targetDate, historicalData = [], productCode) {
        if (!targetDate || !historicalData || historicalData.length === 0) return 1.0;

        const targetMonth = targetDate.getMonth();
        const yearlyData = {};

        // 月別データを集計
        historicalData.forEach(data => {
            const dataDate = new Date(data.date);
            const month = dataDate.getMonth();
            const year = dataDate.getFullYear();
            
            if (!yearlyData[year]) yearlyData[year] = {};
            if (!yearlyData[year][month]) yearlyData[year][month] = [];
            
            const product = data.products?.find(p => p.code === productCode);
            if (product) {
                yearlyData[year][month].push(product.sales || 0);
            }
        });

        // 各年の月平均を計算
        const monthlyAverages = [];
        const annualAverages = [];
        
        Object.keys(yearlyData).forEach(year => {
            let annualTotal = 0;
            let annualCount = 0;
            
            Object.keys(yearlyData[year]).forEach(month => {
                const monthData = yearlyData[year][month];
                const monthAvg = monthData.reduce((sum, val) => sum + val, 0) / monthData.length;
                annualTotal += monthAvg;
                annualCount++;
                
                if (parseInt(month) === targetMonth) {
                    monthlyAverages.push(monthAvg);
                }
            });
            
            if (annualCount > 0) {
                annualAverages.push(annualTotal / annualCount);
            }
        });

        if (monthlyAverages.length === 0 || annualAverages.length === 0) return 1.0;

        const targetMonthAvg = monthlyAverages.reduce((sum, val) => sum + val, 0) / monthlyAverages.length;
        const overallAvg = annualAverages.reduce((sum, val) => sum + val, 0) / annualAverages.length;

        return overallAvg > 0 ? Math.round((targetMonthAvg / overallAvg) * 100) / 100 : 1.0;
    }

    /**
     * 天気による影響係数を計算
     * @param {string} weather - 天気 ('sunny', 'cloudy', 'rainy', etc.)
     * @param {Array} historicalData - 過去データ
     * @param {string} productCode - 商品コード
     * @returns {number} 天気影響係数
     */
    static calculateWeatherFactor(weather, historicalData = [], productCode) {
        if (!weather || !historicalData || historicalData.length === 0) return 1.0;

        const weatherData = {
            sunny: [],
            cloudy: [],
            rainy: [],
            other: []
        };

        // 天気別データを分類
        historicalData.forEach(data => {
            const weatherCondition = this.normalizeWeather(data.weather);
            const product = data.products?.find(p => p.code === productCode);
            
            if (product && weatherData[weatherCondition]) {
                weatherData[weatherCondition].push(product.sales || 0);
            }
        });

        // 各天気の平均売上を計算
        const weatherAverages = {};
        Object.keys(weatherData).forEach(condition => {
            if (weatherData[condition].length > 0) {
                weatherAverages[condition] = weatherData[condition].reduce((sum, val) => sum + val, 0) / weatherData[condition].length;
            }
        });

        // 全体平均を計算
        const allSales = Object.values(weatherData).flat();
        if (allSales.length === 0) return 1.0;
        
        const overallAvg = allSales.reduce((sum, val) => sum + val, 0) / allSales.length;
        const normalizedWeather = this.normalizeWeather(weather);
        
        const weatherAvg = weatherAverages[normalizedWeather];
        
        return (weatherAvg && overallAvg > 0) ? Math.round((weatherAvg / overallAvg) * 100) / 100 : 1.0;
    }

    /**
     * 参考実績に基づく推奨発注数量を計算
     * @param {Object} referenceData - 参考データサマリー
     * @param {Object} adjustmentFactors - 調整要因
     * @returns {Object} 推奨発注数量
     */
    static calculateRecommendedQuantity(referenceData, adjustmentFactors = {}) {
        const {
            seasonalFactor = 1.0,
            weatherFactor = 1.0,
            eventFactor = 1.0,
            userAdjustment = 1.0
        } = adjustmentFactors;

        const baseQuantity = referenceData.averageOrder || 0;
        
        if (baseQuantity === 0) {
            return {
                recommendedQuantity: 0,
                confidence: 0,
                adjustments: {
                    seasonal: 0,
                    weather: 0,
                    event: 0,
                    user: 0,
                    total: 1.0
                }
            };
        }

        const totalFactor = seasonalFactor * weatherFactor * eventFactor * userAdjustment;
        const recommendedQuantity = Math.round(baseQuantity * totalFactor);
        
        // 信頼度は参考データの信頼性と調整要因の妥当性を考慮
        const confidence = Math.min(
            referenceData.reliability || 0.5,
            this.calculateAdjustmentConfidence(adjustmentFactors)
        );

        return {
            baseQuantity: Math.round(baseQuantity),
            recommendedQuantity: Math.max(0, recommendedQuantity),
            confidence: Math.round(confidence * 100) / 100,
            adjustments: {
                seasonal: Math.round((seasonalFactor - 1) * 100 * 10) / 10,
                weather: Math.round((weatherFactor - 1) * 100 * 10) / 10,
                event: Math.round((eventFactor - 1) * 100 * 10) / 10,
                user: Math.round((userAdjustment - 1) * 100 * 10) / 10,
                total: Math.round(totalFactor * 100) / 100
            },
            factors: adjustmentFactors
        };
    }

    /**
     * 参考実績データの品質を評価
     * @param {Array} referenceData - 参考データ
     * @returns {Object} データ品質評価
     */
    static evaluateDataQuality(referenceData) {
        if (!referenceData || referenceData.length === 0) {
            return {
                score: 0,
                level: 'poor',
                issues: ['データが存在しません'],
                recommendations: ['実績データの蓄積が必要です']
            };
        }

        const issues = [];
        const recommendations = [];
        let score = 100;

        // データ量の評価
        if (referenceData.length < 3) {
            issues.push('参考データが少ない（3件未満）');
            recommendations.push('より多くの過去データの蓄積が必要です');
            score -= 30;
        } else if (referenceData.length < 7) {
            issues.push('参考データがやや少ない（7件未満）');
            score -= 15;
        }

        // データの新しさ評価
        const latestDate = new Date(Math.max(...referenceData.map(d => new Date(d.date))));
        const daysSinceLatest = (new Date() - latestDate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLatest > 30) {
            issues.push('最新データが古い（30日以上前）');
            recommendations.push('最新の実績データの更新が必要です');
            score -= 20;
        } else if (daysSinceLatest > 14) {
            issues.push('最新データがやや古い（14日以上前）');
            score -= 10;
        }

        // データの一貫性評価
        const dataConsistency = this.evaluateDataConsistency(referenceData);
        if (dataConsistency < 0.7) {
            issues.push('データの一貫性が低い');
            recommendations.push('データ入力の精度向上が必要です');
            score -= 15;
        }

        // 最終スコアとレベル決定
        score = Math.max(0, score);
        let level;
        if (score >= 80) level = 'excellent';
        else if (score >= 60) level = 'good';
        else if (score >= 40) level = 'fair';
        else level = 'poor';

        return {
            score,
            level,
            issues,
            recommendations,
            dataCount: referenceData.length,
            latestDate: latestDate.toISOString().split('T')[0],
            consistency: Math.round(dataConsistency * 100) / 100
        };
    }

    // ヘルパーメソッド
    static analyzeTrend(data) {
        if (!data || data.length < 2) return 'stable';
        
        let increasing = 0;
        let decreasing = 0;
        
        for (let i = 1; i < data.length; i++) {
            if (data[i] > data[i-1]) increasing++;
            else if (data[i] < data[i-1]) decreasing++;
        }
        
        if (increasing > decreasing) return 'increasing';
        if (decreasing > increasing) return 'decreasing';
        return 'stable';
    }

    static calculateReliabilityScore(data) {
        if (!data || data.length === 0) return 0;
        if (data.length === 1) return 0.3;
        
        const variance = this.calculateVariance(data);
        const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
        const cv = avg > 0 ? Math.sqrt(variance) / avg : 1; // 変動係数
        
        // データ数による基礎スコア
        let score = Math.min(data.length / 10, 0.8);
        
        // 変動係数による調整（低いほど高スコア）
        score *= Math.max(0.2, 1 - cv);
        
        return Math.round(score * 100) / 100;
    }

    static calculateVariance(data) {
        if (!data || data.length === 0) return 0;
        
        const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
        const variance = data.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / data.length;
        
        return Math.round(variance * 100) / 100;
    }

    static normalizeWeather(weather) {
        if (!weather) return 'other';
        
        const w = weather.toLowerCase();
        if (w.includes('晴') || w.includes('sunny')) return 'sunny';
        if (w.includes('曇') || w.includes('cloudy')) return 'cloudy';
        if (w.includes('雨') || w.includes('rainy') || w.includes('rain')) return 'rainy';
        return 'other';
    }

    static calculateAdjustmentConfidence(factors) {
        const {
            seasonalFactor = 1.0,
            weatherFactor = 1.0,
            eventFactor = 1.0,
            userAdjustment = 1.0
        } = factors;

        // 極端な調整値は信頼度を下げる
        const extremeFactors = [seasonalFactor, weatherFactor, eventFactor, userAdjustment]
            .filter(factor => factor < 0.5 || factor > 2.0);
        
        const confidence = Math.max(0.1, 1.0 - (extremeFactors.length * 0.15));
        return confidence;
    }

    static evaluateDataConsistency(data) {
        if (!data || data.length < 2) return 1.0;

        // 各商品の数量データの変動係数を計算
        const productCodes = new Set();
        data.forEach(d => {
            if (d.products) {
                d.products.forEach(p => productCodes.add(p.code));
            }
        });

        let totalConsistency = 0;
        let productCount = 0;

        productCodes.forEach(code => {
            const quantities = data.map(d => {
                const product = d.products?.find(p => p.code === code);
                return product ? (product.sales || 0) : 0;
            }).filter(q => q > 0);

            if (quantities.length >= 2) {
                const avg = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
                const cv = avg > 0 ? Math.sqrt(this.calculateVariance(quantities)) / avg : 1;
                
                // 変動係数が低いほど一貫性が高い
                totalConsistency += Math.max(0, 1 - cv);
                productCount++;
            }
        });

        return productCount > 0 ? totalConsistency / productCount : 1.0;
    }

    /**
     * 参考実績データをフォーマット
     * @param {Array} referenceData - 参考データ
     * @param {Date} targetDate - 対象日
     * @returns {Object} フォーマット済み参考実績
     */
    static formatReferenceData(referenceData, targetDate) {
        if (!referenceData || referenceData.length === 0) {
            return {
                targetDate: targetDate ? targetDate.toISOString().split('T')[0] : '',
                dataType: 'no_data',
                summary: '参考データがありません',
                products: []
            };
        }

        const dataType = this.determineDataType(referenceData, targetDate);
        const productSummaries = new Map();

        // 商品別サマリー生成
        referenceData.forEach(data => {
            if (data.products) {
                data.products.forEach(product => {
                    if (!productSummaries.has(product.code)) {
                        productSummaries.set(product.code, {
                            code: product.code,
                            name: product.name,
                            data: []
                        });
                    }
                    productSummaries.get(product.code).data.push({
                        date: data.date,
                        orderQuantity: product.orderQuantity || 0,
                        sales: product.sales || 0,
                        waste: product.waste || 0,
                        weather: data.weather
                    });
                });
            }
        });

        // 各商品の統計を計算
        const products = Array.from(productSummaries.values()).map(product => {
            const summary = this.generateReferenceSummary(
                product.data.map(d => ({ products: [d] })), 
                product.code
            );
            
            return {
                ...summary,
                name: product.name,
                recentData: product.data.slice(0, 3) // 直近3件
            };
        });

        return {
            targetDate: targetDate ? targetDate.toISOString().split('T')[0] : '',
            dataType,
            summary: this.generateDataTypeSummary(dataType, referenceData.length),
            totalDataPoints: referenceData.length,
            dateRange: {
                from: referenceData[referenceData.length - 1]?.date || '',
                to: referenceData[0]?.date || ''
            },
            products: products.sort((a, b) => b.averageOrder - a.averageOrder)
        };
    }

    static determineDataType(referenceData, targetDate) {
        if (!referenceData || referenceData.length === 0) return 'no_data';
        if (!targetDate) return 'general';

        const targetDayOfWeek = targetDate.getDay();
        const sameDayOfWeek = referenceData.filter(data => 
            new Date(data.date).getDay() === targetDayOfWeek
        ).length;

        if (sameDayOfWeek === referenceData.length) return 'same_day_of_week';
        if (sameDayOfWeek > 0) return 'mixed';
        return 'general';
    }

    static generateDataTypeSummary(dataType, count) {
        const messages = {
            'no_data': '参考データがありません',
            'same_day_of_week': `同じ曜日の過去データ ${count}件`,
            'mixed': `過去データ ${count}件（同曜日含む）`,
            'general': `過去データ ${count}件`
        };
        return messages[dataType] || `参考データ ${count}件`;
    }
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoricalDataService;
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.HistoricalDataService = HistoricalDataService;
}