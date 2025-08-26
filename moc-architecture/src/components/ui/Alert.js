/**
 * Alert Component - 通知・アラート表示コンポーネント
 * MOCアーキテクチャの基本UIコンポーネント
 */
class Alert {
    constructor(options = {}) {
        this.type = options.type || 'info'; // info, success, warning, error
        this.title = options.title || '';
        this.message = options.message || '';
        this.closable = options.closable !== false;
        this.autoClose = options.autoClose || null;
        this.position = options.position || 'top-right';
        this.className = options.className || '';
        this.id = options.id || `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.onClose = options.onClose || null;
        this.actions = options.actions || [];
        
        this.element = null;
        this.autoCloseTimer = null;
        
        // アイコンマッピング
        this.icons = {
            info: '💡',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
    }

    /**
     * アラートのHTML構造を生成
     * @returns {string} HTML文字列
     */
    render() {
        const icon = this.icons[this.type] || this.icons.info;
        const closeButton = this.closable ? 
            `<button class="alert-close" onclick="window.alert_${this.id}.close()" aria-label="閉じる">×</button>` : '';
        
        const actionsHtml = this.actions.length > 0 ? `
            <div class="alert-actions">
                ${this.actions.map(action => `
                    <button class="alert-action-btn alert-action-${action.type || 'primary'}" 
                            onclick="${action.onClick}">
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        ` : '';

        return `
            <div id="${this.id}" 
                 class="alert alert-${this.type} ${this.className}" 
                 role="alert" 
                 aria-live="polite">
                <div class="alert-content">
                    <div class="alert-icon">${icon}</div>
                    <div class="alert-body">
                        ${this.title ? `<div class="alert-title">${this.title}</div>` : ''}
                        <div class="alert-message">${this.message}</div>
                        ${actionsHtml}
                    </div>
                </div>
                ${closeButton}
            </div>
        `;
    }

    /**
     * DOM要素に挿入
     * @param {string|HTMLElement} target - 挿入先
     */
    mount(target = null) {
        // デフォルトでは専用のコンテナに挿入
        if (!target) {
            target = this.getOrCreateContainer();
        }

        const container = typeof target === 'string' ? document.querySelector(target) : target;
        if (!container) {
            console.error('Alert mount target not found');
            return null;
        }

        // HTMLを挿入
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.render();
        this.element = tempDiv.firstElementChild;
        
        container.appendChild(this.element);
        
        // グローバル参照を設定
        window[`alert_${this.id}`] = this;
        
        // イベントリスナーを設定
        this.attachEventListeners();
        
        // アニメーション開始
        setTimeout(() => {
            this.element.classList.add('alert-show');
        }, 10);
        
        // 自動クローズ設定
        if (this.autoClose) {
            this.setAutoClose(this.autoClose);
        }
        
        return this.element;
    }

    /**
     * アラートコンテナを取得または作成
     * @returns {HTMLElement} コンテナ要素
     */
    getOrCreateContainer() {
        let container = document.getElementById(`alert-container-${this.position}`);
        
        if (!container) {
            container = document.createElement('div');
            container.id = `alert-container-${this.position}`;
            container.className = `alert-container alert-position-${this.position}`;
            document.body.appendChild(container);
        }
        
        return container;
    }

    /**
     * イベントリスナーを設定
     */
    attachEventListeners() {
        if (!this.element) return;

        // キーボードアクセシビリティ
        this.element.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.closable) {
                this.close();
            }
        });

        // フォーカス管理
        if (this.type === 'error') {
            this.element.setAttribute('tabindex', '-1');
            this.element.focus();
        }
    }

    /**
     * 自動クローズを設定
     * @param {number} duration - ミリ秒
     */
    setAutoClose(duration) {
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
        }
        
        this.autoCloseTimer = setTimeout(() => {
            this.close();
        }, duration);
    }

    /**
     * アラートを閉じる
     * @param {boolean} animate - アニメーション有無
     */
    close(animate = true) {
        if (!this.element) return;

        // 自動クローズタイマーをクリア
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
        }

        // コールバック実行
        if (this.onClose) {
            this.onClose(this);
        }

        if (animate) {
            this.element.classList.add('alert-hide');
            
            setTimeout(() => {
                this.destroy();
            }, 300);
        } else {
            this.destroy();
        }
    }

    /**
     * DOM要素を破棄
     */
    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        
        // グローバル参照を削除
        delete window[`alert_${this.id}`];
        
        // コンテナが空になったら削除
        const container = document.getElementById(`alert-container-${this.position}`);
        if (container && container.children.length === 0) {
            container.remove();
        }
    }

    /**
     * アラート内容を更新
     * @param {Object} options - 更新オプション
     */
    update(options) {
        Object.assign(this, options);
        
        if (this.element) {
            const parent = this.element.parentNode;
            const newElement = document.createElement('div');
            newElement.innerHTML = this.render();
            
            parent.replaceChild(newElement.firstElementChild, this.element);
            this.element = parent.lastElementChild;
            this.attachEventListeners();
        }
    }

    // ========== 静的ファクトリーメソッド ==========

    /**
     * 情報アラートを作成
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {Alert} アラートインスタンス
     */
    static info(message, options = {}) {
        return new Alert({
            type: 'info',
            message,
            autoClose: 5000,
            ...options
        });
    }

    /**
     * 成功アラートを作成
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {Alert} アラートインスタンス
     */
    static success(message, options = {}) {
        return new Alert({
            type: 'success',
            message,
            autoClose: 4000,
            ...options
        });
    }

    /**
     * 警告アラートを作成
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {Alert} アラートインスタンス
     */
    static warning(message, options = {}) {
        return new Alert({
            type: 'warning',
            message,
            autoClose: 6000,
            ...options
        });
    }

    /**
     * エラーアラートを作成
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {Alert} アラートインスタンス
     */
    static error(message, options = {}) {
        return new Alert({
            type: 'error',
            message,
            closable: true,
            autoClose: null, // エラーは手動で閉じる
            ...options
        });
    }

    /**
     * 確認ダイアログアラートを作成
     * @param {string} message - メッセージ
     * @param {Object} callbacks - コールバック {onConfirm, onCancel}
     * @param {Object} options - オプション
     * @returns {Alert} アラートインスタンス
     */
    static confirm(message, callbacks = {}, options = {}) {
        const alertId = `confirm-${Date.now()}`;
        
        return new Alert({
            type: 'warning',
            title: options.title || '確認',
            message,
            closable: false,
            actions: [
                {
                    label: options.confirmLabel || 'はい',
                    type: 'primary',
                    onClick: `window.alert_${alertId}.handleConfirm()`
                },
                {
                    label: options.cancelLabel || 'キャンセル',
                    type: 'secondary',
                    onClick: `window.alert_${alertId}.handleCancel()`
                }
            ],
            id: alertId,
            onConfirm: callbacks.onConfirm,
            onCancel: callbacks.onCancel,
            ...options
        });
    }

    /**
     * 確認ボタンのハンドラー
     */
    handleConfirm() {
        if (this.onConfirm) {
            this.onConfirm();
        }
        this.close();
    }

    /**
     * キャンセルボタンのハンドラー
     */
    handleCancel() {
        if (this.onCancel) {
            this.onCancel();
        }
        this.close();
    }

    /**
     * バリデーションエラーアラートを作成
     * @param {Array} errors - エラー配列
     * @param {Object} options - オプション
     * @returns {Alert} アラートインスタンス
     */
    static validationErrors(errors, options = {}) {
        const errorList = errors.map(error => `• ${error}`).join('\n');
        
        return new Alert({
            type: 'error',
            title: 'バリデーションエラー',
            message: `<pre class="alert-error-list">${errorList}</pre>`,
            ...options
        });
    }

    /**
     * 進行状況アラートを作成
     * @param {string} message - メッセージ
     * @param {number} progress - 進行率(0-100)
     * @param {Object} options - オプション
     * @returns {Alert} アラートインスタンス
     */
    static progress(message, progress = 0, options = {}) {
        const progressBar = `
            <div class="alert-progress">
                <div class="alert-progress-bar" style="width: ${progress}%"></div>
                <div class="alert-progress-text">${progress}%</div>
            </div>
        `;
        
        return new Alert({
            type: 'info',
            message: `${message}${progressBar}`,
            closable: false,
            ...options
        });
    }

    /**
     * 全てのアラートを閉じる
     * @param {string} type - 特定のタイプのみ閉じる場合
     */
    static closeAll(type = null) {
        const containers = document.querySelectorAll('[id^="alert-container-"]');
        
        containers.forEach(container => {
            const alerts = container.querySelectorAll('.alert');
            alerts.forEach(alertElement => {
                if (!type || alertElement.classList.contains(`alert-${type}`)) {
                    const alertId = alertElement.id;
                    const alertInstance = window[`alert_${alertId}`];
                    if (alertInstance) {
                        alertInstance.close(false);
                    }
                }
            });
        });
    }

    /**
     * アクティブなアラート数を取得
     * @returns {number} アラート数
     */
    static getActiveCount() {
        return document.querySelectorAll('.alert').length;
    }
}

// AppStoreとの連携
if (typeof window !== 'undefined' && window.appStore) {
    // AppStoreの通知システムと統合
    window.appStore.subscribe((state, action) => {
        if (action.type === 'ADD_NOTIFICATION') {
            const notification = action.payload;
            const alert = new Alert({
                type: notification.type || 'info',
                title: notification.title,
                message: notification.message,
                autoClose: notification.duration || 5000
            });
            alert.mount();
        }
    });
}

// EventBusとの連携
if (typeof window !== 'undefined' && window.eventBus) {
    // システムイベントを監視してアラート表示
    window.eventBus.on('validation.error', (errors) => {
        Alert.validationErrors(errors).mount();
    });
    
    window.eventBus.on('operation.success', (message) => {
        Alert.success(message).mount();
    });
    
    window.eventBus.on('operation.error', (message) => {
        Alert.error(message).mount();
    });
    
    window.eventBus.on('system.warning', (message) => {
        Alert.warning(message).mount();
    });
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Alert;
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.Alert = Alert;
}