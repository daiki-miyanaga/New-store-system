/**
 * AppStore - アプリケーション全体の状態管理
 * MOCアーキテクチャの状態管理層
 */
class AppStore {
    constructor() {
        this.state = {
            // アプリケーション基本情報
            currentUser: null,
            currentDate: new Date().toISOString().slice(0, 10),
            currentTime: new Date().toTimeString().slice(0, 5),
            
            // システム設定
            settings: {
                theme: 'light',
                language: 'ja',
                currency: 'JPY',
                timezone: 'Asia/Tokyo'
            },
            
            // UI状態
            ui: {
                loading: false,
                notifications: [],
                modal: null,
                sidebarOpen: false
            },
            
            // キャッシュ
            cache: new Map(),
            cacheTimestamps: new Map(),
            cacheTTL: 5 * 60 * 1000 // 5分
        };
        
        this.listeners = [];
        this.middleware = [];
        
        // 初期化
        this.init();
    }

    /**
     * 初期化処理
     */
    init() {
        // LocalStorageからの設定読み込み
        this.loadSettings();
        
        // 時刻の定期更新
        this.startTimeUpdater();
        
        // ページ終了時の処理
        window.addEventListener('beforeunload', () => {
            this.saveSettings();
        });
    }

    /**
     * 設定をLocalStorageから読み込み
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('moc_app_settings');
            if (savedSettings) {
                this.state.settings = { ...this.state.settings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.warn('設定の読み込みに失敗しました:', error);
        }
    }

    /**
     * 設定をLocalStorageに保存
     */
    saveSettings() {
        try {
            localStorage.setItem('moc_app_settings', JSON.stringify(this.state.settings));
        } catch (error) {
            console.warn('設定の保存に失敗しました:', error);
        }
    }

    /**
     * 時刻の定期更新を開始
     */
    startTimeUpdater() {
        setInterval(() => {
            const now = new Date();
            const newDate = now.toISOString().slice(0, 10);
            const newTime = now.toTimeString().slice(0, 5);
            
            if (newDate !== this.state.currentDate || newTime !== this.state.currentTime) {
                this.setState({
                    currentDate: newDate,
                    currentTime: newTime
                });
            }
        }, 60000); // 1分ごと
    }

    /**
     * 状態変更リスナーを追加
     * @param {Function} listener - リスナー関数
     * @returns {Function} アンサブスクライブ関数
     */
    subscribe(listener) {
        this.listeners.push(listener);
        
        // アンサブスクライブ関数を返す
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * ミドルウェアを追加
     * @param {Function} middleware - ミドルウェア関数
     */
    use(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * 全リスナーに状態変更を通知
     * @param {Object} action - アクション情報
     */
    notify(action = {}) {
        this.listeners.forEach(listener => {
            try {
                listener(this.state, action);
            } catch (error) {
                console.error('リスナーエラー:', error);
            }
        });
    }

    /**
     * 状態を更新
     * @param {Object} newState - 新しい状態
     * @param {Object} action - アクション情報
     */
    setState(newState, action = {}) {
        const prevState = { ...this.state };
        
        // ミドルウェア実行
        let processedState = newState;
        for (const middleware of this.middleware) {
            try {
                processedState = middleware(processedState, prevState, action) || processedState;
            } catch (error) {
                console.error('ミドルウェアエラー:', error);
            }
        }
        
        // 状態更新
        this.state = this.mergeDeep(this.state, processedState);
        
        // リスナー通知
        this.notify(action);
        
        // デバッグログ
        if (this.state.settings.debug) {
            console.log('State updated:', { action, prevState, newState: this.state });
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
     * 現在の状態を取得
     * @param {string} path - 取得するパス (例: 'ui.loading')
     * @returns {any} 状態値
     */
    getState(path = null) {
        if (!path) return { ...this.state };
        
        return path.split('.').reduce((obj, key) => obj && obj[key], this.state);
    }

    /**
     * ローディング状態を設定
     * @param {boolean} loading - ローディング状態
     */
    setLoading(loading) {
        this.setState({ 
            ui: { loading } 
        }, { 
            type: 'SET_LOADING', 
            payload: loading 
        });
    }

    /**
     * 通知を追加
     * @param {Object} notification - 通知オブジェクト
     */
    addNotification(notification) {
        const newNotification = {
            id: Date.now() + Math.random(),
            timestamp: new Date(),
            ...notification
        };
        
        const notifications = [...this.state.ui.notifications, newNotification];
        
        this.setState({ 
            ui: { notifications } 
        }, { 
            type: 'ADD_NOTIFICATION', 
            payload: newNotification 
        });
        
        // 自動削除（デフォルト5秒）
        if (notification.autoRemove !== false) {
            setTimeout(() => {
                this.removeNotification(newNotification.id);
            }, notification.duration || 5000);
        }
    }

    /**
     * 通知を削除
     * @param {string} id - 通知ID
     */
    removeNotification(id) {
        const notifications = this.state.ui.notifications.filter(n => n.id !== id);
        
        this.setState({ 
            ui: { notifications } 
        }, { 
            type: 'REMOVE_NOTIFICATION', 
            payload: id 
        });
    }

    /**
     * モーダルを表示
     * @param {Object} modal - モーダル情報
     */
    showModal(modal) {
        this.setState({ 
            ui: { modal } 
        }, { 
            type: 'SHOW_MODAL', 
            payload: modal 
        });
    }

    /**
     * モーダルを非表示
     */
    hideModal() {
        this.setState({ 
            ui: { modal: null } 
        }, { 
            type: 'HIDE_MODAL' 
        });
    }

    /**
     * キャッシュにデータを保存
     * @param {string} key - キー
     * @param {any} data - データ
     * @param {number} ttl - TTL（ミリ秒）
     */
    setCache(key, data, ttl = null) {
        this.state.cache.set(key, data);
        this.state.cacheTimestamps.set(key, Date.now());
        
        // TTLが指定された場合、自動削除を設定
        if (ttl) {
            setTimeout(() => {
                this.removeCache(key);
            }, ttl);
        }
    }

    /**
     * キャッシュからデータを取得
     * @param {string} key - キー
     * @param {Function} fetcher - データ取得関数（キャッシュミス時）
     * @param {number} ttl - TTL（ミリ秒）
     * @returns {Promise<any>} データ
     */
    async getCache(key, fetcher = null, ttl = null) {
        const currentTTL = ttl || this.state.cacheTTL;
        const timestamp = this.state.cacheTimestamps.get(key);
        
        // キャッシュヒット && 有効期限内
        if (this.state.cache.has(key) && timestamp) {
            if (Date.now() - timestamp < currentTTL) {
                return this.state.cache.get(key);
            } else {
                // 期限切れのキャッシュを削除
                this.removeCache(key);
            }
        }
        
        // キャッシュミス時の処理
        if (fetcher && typeof fetcher === 'function') {
            try {
                const data = await fetcher();
                this.setCache(key, data, currentTTL);
                return data;
            } catch (error) {
                console.error('キャッシュデータの取得に失敗:', error);
                throw error;
            }
        }
        
        return null;
    }

    /**
     * キャッシュを削除
     * @param {string} key - キー
     */
    removeCache(key) {
        this.state.cache.delete(key);
        this.state.cacheTimestamps.delete(key);
    }

    /**
     * 全キャッシュをクリア
     */
    clearCache() {
        this.state.cache.clear();
        this.state.cacheTimestamps.clear();
        
        this.addNotification({
            type: 'info',
            message: 'キャッシュをクリアしました',
            duration: 3000
        });
    }

    /**
     * ユーザー情報を設定
     * @param {Object} user - ユーザー情報
     */
    setCurrentUser(user) {
        this.setState({ 
            currentUser: user 
        }, { 
            type: 'SET_USER', 
            payload: user 
        });
    }

    /**
     * 設定を更新
     * @param {Object} newSettings - 新しい設定
     */
    updateSettings(newSettings) {
        this.setState({ 
            settings: { ...this.state.settings, ...newSettings } 
        }, { 
            type: 'UPDATE_SETTINGS', 
            payload: newSettings 
        });
        
        // 即座に保存
        this.saveSettings();
    }

    /**
     * デバッグ情報を取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            stateSize: JSON.stringify(this.state).length,
            listenersCount: this.listeners.length,
            middlewareCount: this.middleware.length,
            cacheSize: this.state.cache.size,
            uptime: Date.now() - (window.appStartTime || Date.now())
        };
    }

    /**
     * 状態をリセット
     * @param {boolean} keepSettings - 設定を保持するか
     */
    reset(keepSettings = true) {
        const settings = keepSettings ? this.state.settings : {};
        
        this.state = {
            currentUser: null,
            currentDate: new Date().toISOString().slice(0, 10),
            currentTime: new Date().toTimeString().slice(0, 5),
            settings,
            ui: {
                loading: false,
                notifications: [],
                modal: null,
                sidebarOpen: false
            },
            cache: new Map(),
            cacheTimestamps: new Map(),
            cacheTTL: 5 * 60 * 1000
        };
        
        this.notify({ type: 'RESET' });
    }

    /**
     * ストアを破棄
     */
    destroy() {
        this.saveSettings();
        this.listeners = [];
        this.middleware = [];
        this.state.cache.clear();
        this.state.cacheTimestamps.clear();
    }
}

// シングルトンインスタンスを作成
const appStore = new AppStore();

// デバッグ用のミドルウェアを追加
if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
    appStore.updateSettings({ debug: true });
    
    appStore.use((newState, prevState, action) => {
        console.group(`🔄 Action: ${action.type || 'UNKNOWN'}`);
        console.log('Previous State:', prevState);
        console.log('New State:', newState);
        console.log('Action:', action);
        console.groupEnd();
        return newState;
    });
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppStore, appStore };
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.AppStore = AppStore;
    window.appStore = appStore;
    window.appStartTime = Date.now();
}