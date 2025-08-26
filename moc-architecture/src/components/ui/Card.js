/**
 * Card Component - 再利用可能なカードUI
 * MOCアーキテクチャの基本UIコンポーネント
 */
class Card {
    constructor(options = {}) {
        this.title = options.title || '';
        this.content = options.content || '';
        this.className = options.className || '';
        this.icon = options.icon || '';
        this.footer = options.footer || '';
        this.actions = options.actions || [];
        this.id = options.id || `card-${Date.now()}`;
    }

    /**
     * カードのHTML構造を生成
     * @returns {string} HTML文字列
     */
    render() {
        const iconHtml = this.icon ? `<div class="card-icon">${this.icon}</div>` : '';
        const footerHtml = this.footer ? `<div class="card-footer">${this.footer}</div>` : '';
        const actionsHtml = this.actions.length > 0 ? 
            `<div class="card-actions">${this.actions.map(action => 
                `<button class="card-action-btn" onclick="${action.onClick}">${action.label}</button>`
            ).join('')}</div>` : '';

        return `
            <div id="${this.id}" class="card ${this.className}">
                ${iconHtml}
                ${this.title ? `<h3 class="card-title">${this.title}</h3>` : ''}
                <div class="card-content">${this.content}</div>
                ${footerHtml}
                ${actionsHtml}
            </div>
        `;
    }

    /**
     * DOM要素に挿入
     * @param {string|HTMLElement} target - 挿入先
     */
    mount(target) {
        const container = typeof target === 'string' ? document.querySelector(target) : target;
        if (container) {
            container.innerHTML = this.render();
            this.element = container.querySelector(`#${this.id}`);
            this.attachEventListeners();
        }
        return this.element;
    }

    /**
     * イベントリスナーを設定
     */
    attachEventListeners() {
        if (this.element) {
            // カスタムイベント処理の基盤
            this.element.addEventListener('click', (e) => {
                if (e.target.classList.contains('card-action-btn')) {
                    e.stopPropagation();
                }
            });
        }
    }

    /**
     * カードの内容を更新
     * @param {Object} options - 更新オプション
     */
    update(options) {
        Object.assign(this, options);
        if (this.element) {
            const parent = this.element.parentNode;
            parent.innerHTML = this.render();
            this.element = parent.querySelector(`#${this.id}`);
            this.attachEventListeners();
        }
    }

    /**
     * カードを破棄
     */
    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    /**
     * KPIカード用の特殊化
     * @param {Object} kpi - KPI データ
     * @returns {Card} KPIカードインスタンス
     */
    static createKPICard(kpi) {
        const trendClass = kpi.trend > 0 ? 'up' : kpi.trend < 0 ? 'down' : 'neutral';
        const trendSymbol = kpi.trend > 0 ? '↑' : kpi.trend < 0 ? '↓' : '→';
        
        return new Card({
            className: 'kpi-card',
            icon: kpi.icon,
            title: kpi.label,
            content: `
                <div class="kpi-value">${kpi.value}</div>
                <div class="kpi-trend ${trendClass}">
                    ${trendSymbol} ${Math.abs(kpi.trend)}%
                </div>
            `,
            id: `kpi-${kpi.key}`
        });
    }

    /**
     * ナビゲーションカード用の特殊化
     * @param {Object} nav - ナビゲーションデータ
     * @returns {Card} ナビゲーションカードインスタンス
     */
    static createNavCard(nav) {
        return new Card({
            className: 'nav-card',
            icon: nav.icon,
            title: nav.title,
            content: nav.description,
            actions: [{
                label: '開く',
                onClick: `location.href='${nav.href}'`
            }],
            id: `nav-${nav.key}`
        });
    }
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Card;
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.Card = Card;
}