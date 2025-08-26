/**
 * EventBus - イベント駆動アーキテクチャの中核
 * MOCアーキテクチャのデータフロー制御
 */
class EventBus {
    constructor() {
        this.events = new Map();
        this.history = [];
        this.maxHistorySize = 100;
        this.wildcardListeners = [];
        this.middleware = [];
        this.debug = false;
    }

    /**
     * イベントリスナーを登録
     * @param {string} eventName - イベント名
     * @param {Function} callback - コールバック関数
     * @param {Object} options - オプション
     * @returns {Function} アンサブスクライブ関数
     */
    on(eventName, callback, options = {}) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const listener = {
            callback,
            once: options.once || false,
            priority: options.priority || 0,
            context: options.context || null,
            id: `${eventName}_${Date.now()}_${Math.random()}`
        };

        const listeners = this.events.get(eventName);
        listeners.push(listener);
        
        // 優先度でソート（高い順）
        listeners.sort((a, b) => b.priority - a.priority);

        if (this.debug) {
            console.log(`📡 Event listener registered: ${eventName}`, listener);
        }

        // アンサブスクライブ関数を返す
        return () => this.off(eventName, listener.id);
    }

    /**
     * 一度だけ実行されるイベントリスナーを登録
     * @param {string} eventName - イベント名
     * @param {Function} callback - コールバック関数
     * @param {Object} options - オプション
     * @returns {Function} アンサブスクライブ関数
     */
    once(eventName, callback, options = {}) {
        return this.on(eventName, callback, { ...options, once: true });
    }

    /**
     * イベントリスナーを削除
     * @param {string} eventName - イベント名
     * @param {string|Function} listenerIdOrCallback - リスナーIDまたはコールバック関数
     */
    off(eventName, listenerIdOrCallback = null) {
        if (!this.events.has(eventName)) return;

        const listeners = this.events.get(eventName);

        if (listenerIdOrCallback === null) {
            // 全リスナーを削除
            this.events.delete(eventName);
        } else if (typeof listenerIdOrCallback === 'string') {
            // IDによる削除
            const index = listeners.findIndex(l => l.id === listenerIdOrCallback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        } else if (typeof listenerIdOrCallback === 'function') {
            // コールバック関数による削除
            const index = listeners.findIndex(l => l.callback === listenerIdOrCallback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }

        // 空になったイベントは削除
        if (listeners.length === 0) {
            this.events.delete(eventName);
        }

        if (this.debug) {
            console.log(`📡 Event listener removed: ${eventName}`);
        }
    }

    /**
     * ワイルドカードリスナーを登録（全イベントを監視）
     * @param {Function} callback - コールバック関数
     * @returns {Function} アンサブスクライブ関数
     */
    onAny(callback) {
        const listener = {
            callback,
            id: `wildcard_${Date.now()}_${Math.random()}`
        };
        
        this.wildcardListeners.push(listener);

        return () => {
            const index = this.wildcardListeners.findIndex(l => l.id === listener.id);
            if (index > -1) {
                this.wildcardListeners.splice(index, 1);
            }
        };
    }

    /**
     * イベントを発火
     * @param {string} eventName - イベント名
     * @param {any} data - イベントデータ
     * @param {Object} options - オプション
     * @returns {Promise<Array>} リスナーの実行結果
     */
    async emit(eventName, data = null, options = {}) {
        const event = {
            name: eventName,
            data,
            timestamp: Date.now(),
            id: `${eventName}_${Date.now()}_${Math.random()}`,
            ...options
        };

        // イベント履歴に追加
        this.addToHistory(event);

        // ミドルウェア実行
        let processedEvent = event;
        for (const middleware of this.middleware) {
            try {
                const result = await middleware(processedEvent);
                if (result) {
                    processedEvent = result;
                }
            } catch (error) {
                console.error('EventBus middleware error:', error);
            }
        }

        if (this.debug) {
            console.log(`🚀 Event emitted: ${eventName}`, processedEvent);
        }

        const results = [];

        // 通常のリスナー実行
        if (this.events.has(eventName)) {
            const listeners = [...this.events.get(eventName)]; // コピーを作成
            
            for (const listener of listeners) {
                try {
                    const result = await this.executeListener(listener, processedEvent);
                    results.push(result);

                    // onceリスナーは実行後削除
                    if (listener.once) {
                        this.off(eventName, listener.id);
                    }
                } catch (error) {
                    console.error(`Event listener error for ${eventName}:`, error);
                    results.push({ error });
                }
            }
        }

        // ワイルドカードリスナー実行
        for (const listener of this.wildcardListeners) {
            try {
                const result = await this.executeListener(listener, processedEvent);
                results.push(result);
            } catch (error) {
                console.error('Wildcard listener error:', error);
                results.push({ error });
            }
        }

        return results;
    }

    /**
     * リスナーを実行
     * @param {Object} listener - リスナーオブジェクト
     * @param {Object} event - イベントオブジェクト
     * @returns {Promise<any>} 実行結果
     */
    async executeListener(listener, event) {
        const context = listener.context || null;
        const callback = listener.callback;

        if (typeof callback !== 'function') {
            throw new Error('Listener callback must be a function');
        }

        // コンテキストがある場合はbindして実行
        if (context) {
            return await callback.call(context, event.data, event);
        } else {
            return await callback(event.data, event);
        }
    }

    /**
     * イベント履歴に追加
     * @param {Object} event - イベントオブジェクト
     */
    addToHistory(event) {
        this.history.push(event);
        
        // 履歴サイズ制限
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * ミドルウェアを追加
     * @param {Function} middleware - ミドルウェア関数
     */
    use(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }
        this.middleware.push(middleware);
    }

    /**
     * イベントが存在するかチェック
     * @param {string} eventName - イベント名
     * @returns {boolean} 存在するか
     */
    hasEvent(eventName) {
        return this.events.has(eventName) && this.events.get(eventName).length > 0;
    }

    /**
     * イベントのリスナー数を取得
     * @param {string} eventName - イベント名
     * @returns {number} リスナー数
     */
    listenerCount(eventName) {
        return this.events.has(eventName) ? this.events.get(eventName).length : 0;
    }

    /**
     * 全イベント名を取得
     * @returns {Array<string>} イベント名の配列
     */
    eventNames() {
        return Array.from(this.events.keys());
    }

    /**
     * イベント履歴を取得
     * @param {number} limit - 取得数制限
     * @returns {Array} イベント履歴
     */
    getHistory(limit = 50) {
        return this.history.slice(-limit);
    }

    /**
     * 特定イベントの履歴を取得
     * @param {string} eventName - イベント名
     * @param {number} limit - 取得数制限
     * @returns {Array} 該当イベントの履歴
     */
    getEventHistory(eventName, limit = 50) {
        return this.history
            .filter(event => event.name === eventName)
            .slice(-limit);
    }

    /**
     * デバッグモードの切り替え
     * @param {boolean} enabled - デバッグモード有効/無効
     */
    setDebug(enabled) {
        this.debug = enabled;
    }

    /**
     * 統計情報を取得
     * @returns {Object} 統計情報
     */
    getStats() {
        const totalListeners = Array.from(this.events.values())
            .reduce((sum, listeners) => sum + listeners.length, 0);
        
        const eventStats = {};
        for (const [eventName, listeners] of this.events) {
            eventStats[eventName] = listeners.length;
        }

        return {
            totalEvents: this.events.size,
            totalListeners,
            wildcardListeners: this.wildcardListeners.length,
            historySize: this.history.length,
            middlewareCount: this.middleware.length,
            eventStats
        };
    }

    /**
     * 全てのリスナーを削除
     */
    clear() {
        this.events.clear();
        this.wildcardListeners = [];
        this.history = [];
        
        if (this.debug) {
            console.log('📡 All event listeners cleared');
        }
    }

    /**
     * EventBusを破棄
     */
    destroy() {
        this.clear();
        this.middleware = [];
    }

    /**
     * 非同期イベントチェーンを実行
     * @param {Array} eventChain - イベントチェーン [{name, data, delay}]
     * @returns {Promise} 全イベント実行完了
     */
    async emitChain(eventChain) {
        const results = [];
        
        for (const eventConfig of eventChain) {
            if (eventConfig.delay) {
                await new Promise(resolve => setTimeout(resolve, eventConfig.delay));
            }
            
            const result = await this.emit(eventConfig.name, eventConfig.data, eventConfig.options);
            results.push(result);
        }
        
        return results;
    }

    /**
     * 条件付きイベント発火
     * @param {string} eventName - イベント名
     * @param {any} data - イベントデータ
     * @param {Function} condition - 条件関数
     * @returns {Promise<Array|null>} 実行結果またはnull
     */
    async emitIf(eventName, data, condition) {
        if (typeof condition === 'function' && condition(data)) {
            return await this.emit(eventName, data);
        }
        return null;
    }

    /**
     * イベント待機
     * @param {string} eventName - 待機するイベント名
     * @param {number} timeout - タイムアウト（ミリ秒）
     * @returns {Promise} イベントデータ
     */
    waitFor(eventName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.off(eventName, listener);
                reject(new Error(`Event ${eventName} timeout after ${timeout}ms`));
            }, timeout);

            const listener = (data, event) => {
                clearTimeout(timer);
                resolve({ data, event });
            };

            this.once(eventName, listener);
        });
    }
}

// グローバルEventBusインスタンスを作成
const eventBus = new EventBus();

// 開発環境でのデバッグ設定
if (typeof window !== 'undefined') {
    if (window.location.search.includes('debug=true')) {
        eventBus.setDebug(true);
    }
    
    // デバッグ用のミドルウェア
    eventBus.use(async (event) => {
        if (eventBus.debug) {
            console.log(`🔥 EventBus middleware processing: ${event.name}`, event.data);
        }
        return event;
    });
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventBus, eventBus };
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
    window.eventBus = eventBus;
}