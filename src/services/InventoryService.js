/**
 * InventoryService - 在庫管理ビジネスロジック
 * MOCアーキテクチャのサービス層
 */
class InventoryService {
    
    /**
     * 当日在庫を計算
     * @param {number} prevStock - 前日残在庫
     * @param {number} delivery - 入荷数
     * @param {number} movement - 移動数
     * @param {number} sales - 販売数
     * @param {number} waste - ロス数
     * @returns {number} 当日在庫
     */
    static calculateCurrentStock(prevStock, delivery, movement, sales, waste) {
        const result = (prevStock || 0) + (delivery || 0) + (movement || 0) - (sales || 0) - (waste || 0);
        return Math.max(0, result); // マイナス在庫は0に補正
    }

    /**
     * 移動後在庫を計算
     * @param {number} orderQuantity - 発注数
     * @param {number} movement - 移動数
     * @returns {number} 移動後在庫
     */
    static calculateAfterMoveStock(orderQuantity, movement) {
        return (orderQuantity || 0) + (movement || 0);
    }

    /**
     * ロス率を計算
     * @param {number} waste - ロス数
     * @param {number} totalStock - 総在庫数
     * @returns {number} ロス率（％）
     */
    static calculateWasteRate(waste, totalStock) {
        if (!totalStock || totalStock === 0) return 0;
        return ((waste || 0) / totalStock) * 100;
    }

    /**
     * ロス率バリデーション
     * @param {number} wasteRate - ロス率
     * @param {number} threshold - しきい値（デフォルト5%）
     * @returns {Object} バリデーション結果
     */
    static validateWasteRate(wasteRate, threshold = 5) {
        const rate = wasteRate || 0;
        
        if (rate <= threshold) {
            return { valid: true, level: 'normal', message: '' };
        } else if (rate <= 15) {
            return { 
                valid: false, 
                level: 'warning', 
                message: `ロス率が基準値(${threshold}%)を超えています: ${rate.toFixed(1)}%` 
            };
        } else {
            return { 
                valid: false, 
                level: 'error', 
                message: `ロス率が異常値です: ${rate.toFixed(1)}%` 
            };
        }
    }

    /**
     * 在庫レベルのバリデーション
     * @param {number} stock - 在庫数
     * @param {number} minLevel - 最小在庫レベル
     * @returns {Object} バリデーション結果
     */
    static validateStockLevel(stock, minLevel = 0) {
        const currentStock = stock || 0;
        
        if (currentStock < 0) {
            return { 
                valid: false, 
                level: 'error', 
                message: 'マイナス在庫は許可されません' 
            };
        } else if (currentStock < minLevel) {
            return { 
                valid: false, 
                level: 'warning', 
                message: `在庫が最小レベルを下回っています: ${currentStock}` 
            };
        } else {
            return { valid: true, level: 'normal', message: '' };
        }
    }

    /**
     * 完売時間のバリデーション
     * @param {string} soldoutTime - 完売時間 (HH:MM形式)
     * @returns {Object} バリデーション結果
     */
    static validateSoldoutTime(soldoutTime) {
        if (!soldoutTime) {
            return { valid: true, level: 'normal', message: '' };
        }

        const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        
        if (!timePattern.test(soldoutTime)) {
            return { 
                valid: false, 
                level: 'error', 
                message: '時間はHH:MM形式で入力してください（例: 14:30）' 
            };
        }

        const [hours, minutes] = soldoutTime.split(':').map(Number);
        if (hours < 10 || hours > 20) {
            return { 
                valid: false, 
                level: 'warning', 
                message: '営業時間外の完売時間です' 
            };
        }

        return { valid: true, level: 'normal', message: '' };
    }

    /**
     * 翌日必要在庫を予測
     * @param {number} avgSales - 平均販売数
     * @param {number} currentStock - 現在在庫
     * @param {number} seasonFactor - 季節係数（デフォルト1.0）
     * @returns {number} 翌日必要在庫
     */
    static predictTomorrowNeed(avgSales, currentStock, seasonFactor = 1.0) {
        const predictedSales = (avgSales || 0) * seasonFactor;
        return Math.max(0, Math.ceil(predictedSales - (currentStock || 0)));
    }

    /**
     * 在庫回転率を計算
     * @param {Array} salesHistory - 販売履歴
     * @param {number} averageStock - 平均在庫
     * @param {number} days - 計算期間（日数）
     * @returns {number} 在庫回転率
     */
    static calculateTurnoverRate(salesHistory, averageStock, days = 30) {
        if (!salesHistory || salesHistory.length === 0 || !averageStock) return 0;
        
        const totalSales = salesHistory.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
        const dailyAvgSales = totalSales / days;
        
        return dailyAvgSales / averageStock;
    }

    /**
     * ABC分析を実行
     * @param {Array} products - 商品データ
     * @param {string} valueKey - 分析対象のキー（sales, profit等）
     * @returns {Array} ABC分析結果
     */
    static performABCAnalysis(products, valueKey = 'sales') {
        if (!products || products.length === 0) return [];

        // 売上順にソート
        const sortedProducts = [...products].sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0));
        
        const totalValue = sortedProducts.reduce((sum, product) => sum + (product[valueKey] || 0), 0);
        let cumulativeValue = 0;
        let cumulativePercentage = 0;

        return sortedProducts.map(product => {
            cumulativeValue += (product[valueKey] || 0);
            cumulativePercentage = (cumulativeValue / totalValue) * 100;
            
            let category;
            if (cumulativePercentage <= 70) {
                category = 'A';
            } else if (cumulativePercentage <= 90) {
                category = 'B';
            } else {
                category = 'C';
            }

            return {
                ...product,
                abcCategory: category,
                cumulativePercentage: cumulativePercentage.toFixed(1)
            };
        });
    }

    /**
     * 安全在庫を計算
     * @param {Array} salesHistory - 販売履歴
     * @param {number} leadTime - リードタイム（日数）
     * @param {number} serviceLevel - サービスレベル（0.95 = 95%）
     * @returns {number} 安全在庫数
     */
    static calculateSafetyStock(salesHistory, leadTime = 1, serviceLevel = 0.95) {
        if (!salesHistory || salesHistory.length < 2) return 0;

        // 日別販売数の標準偏差を計算
        const dailySales = salesHistory.map(sale => sale.quantity || 0);
        const avgSales = dailySales.reduce((sum, qty) => sum + qty, 0) / dailySales.length;
        
        const variance = dailySales.reduce((sum, qty) => sum + Math.pow(qty - avgSales, 2), 0) / (dailySales.length - 1);
        const stdDev = Math.sqrt(variance);

        // Z値（サービスレベルに基づく）
        const zValue = serviceLevel >= 0.99 ? 2.33 : 
                      serviceLevel >= 0.95 ? 1.65 : 1.28;

        return Math.ceil(zValue * stdDev * Math.sqrt(leadTime));
    }

    /**
     * 発注点を計算
     * @param {number} avgSales - 平均販売数
     * @param {number} leadTime - リードタイム
     * @param {number} safetyStock - 安全在庫
     * @returns {number} 発注点
     */
    static calculateReorderPoint(avgSales, leadTime = 1, safetyStock = 0) {
        return Math.ceil((avgSales || 0) * leadTime + safetyStock);
    }

    /**
     * 在庫データの統計サマリーを生成
     * @param {Array} inventoryData - 在庫データ
     * @returns {Object} 統計サマリー
     */
    static generateInventorySummary(inventoryData) {
        if (!inventoryData || inventoryData.length === 0) {
            return {
                totalItems: 0,
                totalValue: 0,
                averageStock: 0,
                wasteRate: 0,
                topProducts: []
            };
        }

        const totalItems = inventoryData.length;
        const totalValue = inventoryData.reduce((sum, item) => 
            sum + ((item.currentStock || 0) * (item.price || 0)), 0);
        const totalStock = inventoryData.reduce((sum, item) => sum + (item.currentStock || 0), 0);
        const totalWaste = inventoryData.reduce((sum, item) => sum + (item.waste || 0), 0);
        const averageStock = totalStock / totalItems;
        const wasteRate = totalStock > 0 ? (totalWaste / totalStock) * 100 : 0;

        // 在庫価値の高い商品トップ5
        const topProducts = inventoryData
            .map(item => ({
                ...item,
                value: (item.currentStock || 0) * (item.price || 0)
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return {
            totalItems,
            totalValue: Math.round(totalValue),
            averageStock: Math.round(averageStock),
            wasteRate: Math.round(wasteRate * 100) / 100,
            topProducts
        };
    }

    /**
     * 在庫アラートをチェック
     * @param {Array} inventoryData - 在庫データ
     * @param {Object} thresholds - しきい値設定
     * @returns {Array} アラート一覧
     */
    static checkInventoryAlerts(inventoryData, thresholds = {}) {
        const alerts = [];
        const {
            lowStockThreshold = 5,
            wasteRateThreshold = 5,
            overStockThreshold = 100
        } = thresholds;

        inventoryData.forEach(item => {
            const stock = item.currentStock || 0;
            const wasteRate = this.calculateWasteRate(item.waste, stock);

            // 低在庫アラート
            if (stock <= lowStockThreshold && stock > 0) {
                alerts.push({
                    type: 'low_stock',
                    level: 'warning',
                    product: item.name,
                    message: `在庫不足: ${item.name} (${stock}個)`
                });
            }

            // 在庫切れアラート
            if (stock === 0) {
                alerts.push({
                    type: 'out_of_stock',
                    level: 'error',
                    product: item.name,
                    message: `在庫切れ: ${item.name}`
                });
            }

            // 過剰在庫アラート
            if (stock >= overStockThreshold) {
                alerts.push({
                    type: 'over_stock',
                    level: 'info',
                    product: item.name,
                    message: `過剰在庫の可能性: ${item.name} (${stock}個)`
                });
            }

            // ロス率アラート
            if (wasteRate > wasteRateThreshold) {
                alerts.push({
                    type: 'high_waste',
                    level: 'warning',
                    product: item.name,
                    message: `ロス率が高いです: ${item.name} (${wasteRate.toFixed(1)}%)`
                });
            }
        });

        return alerts.sort((a, b) => {
            const levelOrder = { error: 3, warning: 2, info: 1 };
            return levelOrder[b.level] - levelOrder[a.level];
        });
    }

    /**
     * 在庫データをCSV形式で出力
     * @param {Array} inventoryData - 在庫データ
     * @returns {string} CSV文字列
     */
    static exportToCSV(inventoryData) {
        if (!inventoryData || inventoryData.length === 0) return '';

        const headers = [
            '商品コード', '商品名', '単価', '前日残', '入荷', '移動', '販売', 'ロス', '当日在庫', '完売時間'
        ];

        const csvRows = inventoryData.map(item => [
            item.code || '',
            item.name || '',
            item.price || 0,
            item.prevStock || 0,
            item.delivery || 0,
            item.movement || 0,
            item.sales || 0,
            item.waste || 0,
            this.calculateCurrentStock(item.prevStock, item.delivery, item.movement, item.sales, item.waste),
            item.soldoutTime || ''
        ]);

        return [headers, ...csvRows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryService;
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.InventoryService = InventoryService;
}