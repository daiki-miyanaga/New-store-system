/**
 * Header Component - ヘッダーレイアウトコンポーネント
 * MOCアーキテクチャのレイアウトコンポーネント
 */
class Header {
    constructor(options = {}) {
        this.title = options.title || '在庫管理システム';
        this.subtitle = options.subtitle || '';
        this.showUserInfo = options.showUserInfo !== false;
        this.showDateTime = options.showDateTime !== false;
        this.showNotifications = options.showNotifications !== false;
        this.className = options.className || '';
        this.id = options.id || `header-${Date.now()}`;
        this.user = options.user || null;
        
        this.element = null;
        this.timeInterval = null;
        this.notificationCount = 0;
        
        // メニュー項目
        this.menuItems = options.menuItems || [];
        this.showMobileMenu = false;
    }

    /**
     * ヘッダーのHTML構造を生成
     * @returns {string} HTML文字列
     */
    render() {
        return `
            <header id="${this.id}" class="header ${this.className}">
                <div class="header-container">
                    <div class="header-left">
                        <button class="header-mobile-toggle" onclick="window.header_${this.id}.toggleMobileMenu()">
                            <span class="mobile-menu-icon"></span>
                        </button>
                        <div class="header-title">
                            <h1 class="header-main-title">${this.title}</h1>
                            ${this.subtitle ? `<div class="header-subtitle">${this.subtitle}</div>` : ''}
                        </div>
                    </div>
                    
                    <div class="header-center">
                        ${this.renderNavigation()}
                    </div>
                    
                    <div class="header-right">
                        ${this.showDateTime ? this.renderDateTime() : ''}
                        ${this.showNotifications ? this.renderNotifications() : ''}
                        ${this.showUserInfo ? this.renderUserInfo() : ''}
                    </div>
                </div>
                
                ${this.renderMobileMenu()}
            </header>
        `;
    }

    /**
     * ナビゲーションを生成
     * @returns {string} HTML文字列
     */
    renderNavigation() {
        if (this.menuItems.length === 0) return '';
        
        const menuHtml = this.menuItems.map(item => `
            <a href="${item.href || '#'}" 
               class="header-nav-item ${item.active ? 'active' : ''}"
               ${item.onClick ? `onclick="${item.onClick}"` : ''}>
                ${item.icon ? `<span class="nav-icon">${item.icon}</span>` : ''}
                <span class="nav-label">${item.label}</span>
            </a>
        `).join('');
        
        return `
            <nav class="header-navigation">
                ${menuHtml}
            </nav>
        `;
    }

    /**
     * 日時表示を生成
     * @returns {string} HTML文字列
     */
    renderDateTime() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        });
        const timeStr = now.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="header-datetime">
                <div class="header-date">${dateStr}</div>
                <div class="header-time">${timeStr}</div>
            </div>
        `;
    }

    /**
     * 通知アイコンを生成
     * @returns {string} HTML文字列
     */
    renderNotifications() {
        const badgeHtml = this.notificationCount > 0 ? 
            `<span class="notification-badge">${this.notificationCount}</span>` : '';
        
        return `
            <button class="header-notifications" onclick="window.header_${this.id}.showNotifications()">
                <span class="notification-icon">🔔</span>
                ${badgeHtml}
            </button>
        `;
    }

    /**
     * ユーザー情報を生成
     * @returns {string} HTML文字列
     */
    renderUserInfo() {
        const userName = this.user?.name || 'ユーザー';
        const userAvatar = this.user?.avatar || '👤';
        const userRole = this.user?.role || '';
        
        return `
            <div class="header-user" onclick="window.header_${this.id}.toggleUserMenu()">
                <div class="user-avatar">${userAvatar}</div>
                <div class="user-info">
                    <div class="user-name">${userName}</div>
                    ${userRole ? `<div class="user-role">${userRole}</div>` : ''}
                </div>
                <span class="user-dropdown-arrow">▼</span>
                
                <div class="user-dropdown" style="display: none;">
                    <a href="#" class="user-dropdown-item">設定</a>
                    <a href="#" class="user-dropdown-item">プロフィール</a>
                    <div class="user-dropdown-divider"></div>
                    <a href="#" class="user-dropdown-item">ログアウト</a>
                </div>
            </div>
        `;
    }

    /**
     * モバイルメニューを生成
     * @returns {string} HTML文字列
     */
    renderMobileMenu() {
        if (this.menuItems.length === 0) return '';
        
        const menuHtml = this.menuItems.map(item => `
            <a href="${item.href || '#'}" 
               class="mobile-menu-item ${item.active ? 'active' : ''}"
               onclick="window.header_${this.id}.hideMobileMenu(); ${item.onClick || ''}">
                ${item.icon ? `<span class="nav-icon">${item.icon}</span>` : ''}
                <span class="nav-label">${item.label}</span>
            </a>
        `).join('');
        
        return `
            <div class="mobile-menu ${this.showMobileMenu ? 'show' : ''}" 
                 onclick="window.header_${this.id}.hideMobileMenu()">
                <div class="mobile-menu-content" onclick="event.stopPropagation()">
                    <div class="mobile-menu-header">
                        <span class="mobile-menu-title">メニュー</span>
                        <button class="mobile-menu-close" onclick="window.header_${this.id}.hideMobileMenu()">×</button>
                    </div>
                    <nav class="mobile-menu-nav">
                        ${menuHtml}
                    </nav>
                </div>
            </div>
        `;
    }

    /**
     * DOM要素に挿入・初期化
     * @param {string|HTMLElement} target - 挿入先
     * @returns {HTMLElement} ヘッダー要素
     */
    mount(target) {
        const container = typeof target === 'string' ? document.querySelector(target) : target;
        if (!container) {
            throw new Error('Header mount target not found');
        }

        container.innerHTML = this.render();
        this.element = container.querySelector(`#${this.id}`);
        
        // グローバル参照を設定
        window[`header_${this.id}`] = this;
        
        // イベントリスナーを設定
        this.attachEventListeners();
        
        // 時刻の定期更新を開始
        if (this.showDateTime) {
            this.startTimeUpdate();
        }
        
        return this.element;
    }

    /**
     * イベントリスナーを設定
     */
    attachEventListeners() {
        if (!this.element) return;

        // ユーザードロップダウンの外クリック監視
        document.addEventListener('click', (e) => {
            const userMenu = this.element.querySelector('.user-dropdown');
            const userInfo = this.element.querySelector('.header-user');
            
            if (userMenu && !userInfo.contains(e.target)) {
                userMenu.style.display = 'none';
            }
        });

        // ESCキーでモバイルメニューを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.showMobileMenu) {
                this.hideMobileMenu();
            }
        });

        // レスポンシブ監視
        this.setupResponsiveHandlers();
    }

    /**
     * レスポンシブハンドラーを設定
     */
    setupResponsiveHandlers() {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        
        const handleResize = (mq) => {
            if (!mq.matches && this.showMobileMenu) {
                this.hideMobileMenu();
            }
        };
        
        mediaQuery.addListener(handleResize);
        handleResize(mediaQuery);
    }

    /**
     * 時刻の定期更新を開始
     */
    startTimeUpdate() {
        this.updateDateTime();
        this.timeInterval = setInterval(() => {
            this.updateDateTime();
        }, 60000); // 1分ごとに更新
    }

    /**
     * 日時表示を更新
     */
    updateDateTime() {
        if (!this.element) return;
        
        const datetimeElement = this.element.querySelector('.header-datetime');
        if (!datetimeElement) return;
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        });
        const timeStr = now.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        datetimeElement.querySelector('.header-date').textContent = dateStr;
        datetimeElement.querySelector('.header-time').textContent = timeStr;
    }

    /**
     * モバイルメニューの表示切り替え
     */
    toggleMobileMenu() {
        this.showMobileMenu = !this.showMobileMenu;
        
        const mobileMenu = this.element.querySelector('.mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('show', this.showMobileMenu);
        }
        
        // bodyのスクロールを制御
        if (this.showMobileMenu) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    /**
     * モバイルメニューを非表示
     */
    hideMobileMenu() {
        this.showMobileMenu = false;
        
        const mobileMenu = this.element.querySelector('.mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.remove('show');
        }
        
        document.body.style.overflow = '';
    }

    /**
     * ユーザーメニューの表示切り替え
     */
    toggleUserMenu() {
        const userDropdown = this.element.querySelector('.user-dropdown');
        if (!userDropdown) return;
        
        const isVisible = userDropdown.style.display !== 'none';
        userDropdown.style.display = isVisible ? 'none' : 'block';
    }

    /**
     * 通知パネルを表示
     */
    showNotifications() {
        if (window.eventBus) {
            window.eventBus.emit('header.notifications.show');
        }
        
        // 通知件数をリセット
        this.setNotificationCount(0);
    }

    /**
     * 通知件数を設定
     * @param {number} count - 通知件数
     */
    setNotificationCount(count) {
        this.notificationCount = count;
        
        const badge = this.element?.querySelector('.notification-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    /**
     * メニュー項目を更新
     * @param {Array} menuItems - メニュー項目
     */
    updateMenuItems(menuItems) {
        this.menuItems = menuItems;
        
        if (this.element) {
            const navigation = this.element.querySelector('.header-navigation');
            if (navigation) {
                navigation.innerHTML = this.renderNavigation().match(/<nav[^>]*>(.*)<\/nav>/s)?.[1] || '';
            }
            
            const mobileNav = this.element.querySelector('.mobile-menu-nav');
            if (mobileNav) {
                mobileNav.innerHTML = this.menuItems.map(item => `
                    <a href="${item.href || '#'}" 
                       class="mobile-menu-item ${item.active ? 'active' : ''}"
                       onclick="window.header_${this.id}.hideMobileMenu(); ${item.onClick || ''}">
                        ${item.icon ? `<span class="nav-icon">${item.icon}</span>` : ''}
                        <span class="nav-label">${item.label}</span>
                    </a>
                `).join('');
            }
        }
    }

    /**
     * アクティブメニュー項目を設定
     * @param {string} href - アクティブにするメニューのhref
     */
    setActiveMenuItem(href) {
        this.menuItems = this.menuItems.map(item => ({
            ...item,
            active: item.href === href
        }));
        
        this.updateMenuItems(this.menuItems);
    }

    /**
     * ユーザー情報を更新
     * @param {Object} user - ユーザー情報
     */
    updateUser(user) {
        this.user = user;
        
        if (this.element) {
            const userInfo = this.element.querySelector('.header-user');
            if (userInfo) {
                userInfo.outerHTML = this.renderUserInfo();
            }
        }
    }

    /**
     * タイトルを更新
     * @param {string} title - メインタイトル
     * @param {string} subtitle - サブタイトル
     */
    updateTitle(title, subtitle = '') {
        this.title = title;
        this.subtitle = subtitle;
        
        if (this.element) {
            const titleElement = this.element.querySelector('.header-main-title');
            const subtitleElement = this.element.querySelector('.header-subtitle');
            
            if (titleElement) titleElement.textContent = title;
            
            if (subtitle) {
                if (subtitleElement) {
                    subtitleElement.textContent = subtitle;
                } else {
                    titleElement.parentNode.innerHTML += `<div class="header-subtitle">${subtitle}</div>`;
                }
            } else if (subtitleElement) {
                subtitleElement.remove();
            }
        }
    }

    /**
     * ヘッダーを破棄
     */
    destroy() {
        // 時刻更新を停止
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
        
        // bodyスタイルをリセット
        document.body.style.overflow = '';
        
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        
        delete window[`header_${this.id}`];
    }

    // ========== 静的ファクトリーメソッド ==========

    /**
     * デフォルト設定のヘッダーを作成
     * @param {Object} options - オプション
     * @returns {Header} ヘッダーインスタンス
     */
    static createDefault(options = {}) {
        return new Header({
            title: '在庫管理システム',
            menuItems: [
                { label: 'ダッシュボード', icon: '📊', href: 'index.html', active: true },
                { label: '実績入力', icon: '📝', href: 'performance-input.html' },
                { label: '発注シミュレーション', icon: '🔄', href: 'order-simulation.html' },
                { label: '洋生ノート', icon: '🧁', href: 'western-confection-note.html' },
                { label: '過去データ', icon: '📈', href: 'historical-performance.html' }
            ],
            user: {
                name: '管理者',
                role: 'システム管理者',
                avatar: '👤'
            },
            ...options
        });
    }

    /**
     * シンプルなヘッダーを作成
     * @param {string} title - タイトル
     * @param {Object} options - オプション
     * @returns {Header} ヘッダーインスタンス
     */
    static createSimple(title, options = {}) {
        return new Header({
            title,
            showUserInfo: false,
            showNotifications: false,
            showDateTime: false,
            ...options
        });
    }
}

// AppStoreとの連携
if (typeof window !== 'undefined' && window.appStore) {
    // ユーザー情報の変更を監視
    window.appStore.subscribe((state, action) => {
        if (action.type === 'SET_USER') {
            // 全ヘッダーのユーザー情報を更新
            Object.keys(window).forEach(key => {
                if (key.startsWith('header_') && window[key].updateUser) {
                    window[key].updateUser(action.payload);
                }
            });
        }
    });
}

// EventBusとの連携
if (typeof window !== 'undefined' && window.eventBus) {
    // 通知件数の変更を監視
    window.eventBus.on('notifications.count.changed', (count) => {
        Object.keys(window).forEach(key => {
            if (key.startsWith('header_') && window[key].setNotificationCount) {
                window[key].setNotificationCount(count);
            }
        });
    });
    
    // ページ変更を監視してアクティブメニューを更新
    window.eventBus.on('page.changed', (href) => {
        Object.keys(window).forEach(key => {
            if (key.startsWith('header_') && window[key].setActiveMenuItem) {
                window[key].setActiveMenuItem(href);
            }
        });
    });
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Header;
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.Header = Header;
}