/**
 * MasterMaintenance Page - マスタメンテナンスページコンポーネント
 * MOCアーキテクチャのページレベルコンポーネント
 */
class MasterMaintenance {
    constructor(options = {}) {
        this.container = options.container || 'body';
        this.header = null;
        this.tabNavigation = null;
        this.activeTab = 'products';
        this.tables = {};
        this.forms = {};
        
        // データ
        this.masterData = {
            products: [],
            categories: [],
            suppliers: [],
            settings: {},
            users: []
        };
        
        // サービス
        this.masterService = null;
    }

    /**
     * マスタメンテナンスシステムを初期化
     * @returns {Promise<void>}
     */
    async init() {
        try {
            // サービスの初期化
            this.masterService = new MasterMaintenanceService();
            
            // レイアウトの構築
            this.buildLayout();
            
            // ヘッダーの初期化
            this.initHeader();
            
            // タブナビゲーションの構築
            this.buildTabNavigation();
            
            // データの初期読み込み
            await this.loadAllMasterData();
            
            // アクティブタブの表示
            this.showTab(this.activeTab);
            
            // イベントリスナーの設定
            this.attachEventListeners();
            
            // ページ読み込み完了イベント
            if (window.eventBus) {
                window.eventBus.emit('masterMaintenance.loaded');
            }
            
        } catch (error) {
            console.error('MasterMaintenance initialization failed:', error);
            Alert.error('マスタメンテナンスの初期化に失敗しました').mount();
        }
    }

    /**
     * レイアウトの基本構造を構築
     */
    buildLayout() {
        const container = typeof this.container === 'string' ? 
            document.querySelector(this.container) : this.container;
            
        container.innerHTML = `
            <div class="master-maintenance-layout">
                <div id="master-header"></div>
                
                <main class="master-main">
                    <div class="master-content">
                        <!-- Tab Navigation -->
                        <section class="master-tabs">
                            <div class="container">
                                <div id="tab-navigation" class="tab-navigation"></div>
                            </div>
                        </section>
                        
                        <!-- Tab Contents -->
                        <section class="master-tab-content">
                            <div class="container">
                                <!-- Products Master -->
                                <div id="products-tab" class="tab-content">
                                    <div class="tab-header">
                                        <h2 class="tab-title">🛍️ 商品マスタ管理</h2>
                                        <div class="tab-actions">
                                            <button id="add-product-btn" class="btn btn-primary">➕ 商品追加</button>
                                            <button id="import-products-btn" class="btn btn-secondary">📤 CSV取込</button>
                                            <button id="export-products-btn" class="btn btn-secondary">📥 CSV出力</button>
                                        </div>
                                    </div>
                                    <div id="products-table-container"></div>
                                </div>
                                
                                <!-- Categories Master -->
                                <div id="categories-tab" class="tab-content" style="display: none;">
                                    <div class="tab-header">
                                        <h2 class="tab-title">🏷️ カテゴリマスタ管理</h2>
                                        <div class="tab-actions">
                                            <button id="add-category-btn" class="btn btn-primary">➕ カテゴリ追加</button>
                                        </div>
                                    </div>
                                    <div id="categories-table-container"></div>
                                </div>
                                
                                <!-- Suppliers Master -->
                                <div id="suppliers-tab" class="tab-content" style="display: none;">
                                    <div class="tab-header">
                                        <h2 class="tab-title">🚚 仕入先マスタ管理</h2>
                                        <div class="tab-actions">
                                            <button id="add-supplier-btn" class="btn btn-primary">➕ 仕入先追加</button>
                                        </div>
                                    </div>
                                    <div id="suppliers-table-container"></div>
                                </div>
                                
                                <!-- System Settings -->
                                <div id="settings-tab" class="tab-content" style="display: none;">
                                    <div class="tab-header">
                                        <h2 class="tab-title">⚙️ システム設定</h2>
                                        <div class="tab-actions">
                                            <button id="save-settings-btn" class="btn btn-primary">💾 設定保存</button>
                                            <button id="reset-settings-btn" class="btn btn-warning">🔄 初期化</button>
                                        </div>
                                    </div>
                                    <div id="settings-form-container"></div>
                                </div>
                                
                                <!-- Users Management -->
                                <div id="users-tab" class="tab-content" style="display: none;">
                                    <div class="tab-header">
                                        <h2 class="tab-title">👥 ユーザー管理</h2>
                                        <div class="tab-actions">
                                            <button id="add-user-btn" class="btn btn-primary">➕ ユーザー追加</button>
                                        </div>
                                    </div>
                                    <div id="users-table-container"></div>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
            
            <!-- Modal for Add/Edit -->
            <div id="master-modal" class="modal" style="display: none;">
                <div class="modal-backdrop"></div>
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3 id="modal-title" class="modal-title"></h3>
                        <button id="modal-close-btn" class="modal-close">✕</button>
                    </div>
                    <div class="modal-body">
                        <div id="modal-form-container"></div>
                    </div>
                    <div class="modal-footer">
                        <button id="modal-save-btn" class="btn btn-primary">💾 保存</button>
                        <button id="modal-cancel-btn" class="btn btn-secondary">❌ キャンセル</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * ヘッダーを初期化
     */
    initHeader() {
        this.header = Header.createDefault({
            title: '在庫管理システム',
            subtitle: 'マスタメンテナンス',
            menuItems: [
                { label: 'ダッシュボード', icon: '📊', href: 'index.html' },
                { label: '実績入力', icon: '📝', href: 'performance-input.html' },
                { label: '発注シミュレーション', icon: '🔄', href: 'order-simulation.html' },
                { label: '洋生ノート', icon: '🧁', href: 'western-confection-note.html' },
                { label: '過去データ分析', icon: '📈', href: 'historical-analysis.html' },
                { label: 'マスタメンテナンス', icon: '🔧', href: 'master-maintenance.html', active: true }
            ]
        });
        
        this.header.mount('#master-header');
    }

    /**
     * タブナビゲーションを構築
     */
    buildTabNavigation() {
        const container = document.getElementById('tab-navigation');
        if (!container) return;
        
        const tabs = [
            { id: 'products', label: '🛍️ 商品マスタ', active: true },
            { id: 'categories', label: '🏷️ カテゴリマスタ' },
            { id: 'suppliers', label: '🚚 仕入先マスタ' },
            { id: 'settings', label: '⚙️ システム設定' },
            { id: 'users', label: '👥 ユーザー管理' }
        ];
        
        container.innerHTML = tabs.map(tab => `
            <button class="tab-button ${tab.active ? 'active' : ''}" data-tab="${tab.id}">
                ${tab.label}
            </button>
        `).join('');
    }

    /**
     * 全マスタデータの読み込み
     * @returns {Promise<void>}
     */
    async loadAllMasterData() {
        try {
            const [products, categories, suppliers, settings, users] = await Promise.all([
                this.masterService.getProducts(),
                this.masterService.getCategories(),
                this.masterService.getSuppliers(),
                this.masterService.getSettings(),
                this.masterService.getUsers()
            ]);
            
            this.masterData.products = products;
            this.masterData.categories = categories;
            this.masterData.suppliers = suppliers;
            this.masterData.settings = settings;
            this.masterData.users = users;
            
        } catch (error) {
            console.error('Master data load failed:', error);
            throw error;
        }
    }

    /**
     * タブ表示
     * @param {string} tabId - タブID
     */
    showTab(tabId) {
        // タブボタンの状態更新
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // タブコンテンツの表示切替
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = content.id === `${tabId}-tab` ? 'block' : 'none';
        });
        
        this.activeTab = tabId;
        
        // タブ固有の初期化
        switch (tabId) {
            case 'products':
                this.initProductsTab();
                break;
            case 'categories':
                this.initCategoriesTab();
                break;
            case 'suppliers':
                this.initSuppliersTab();
                break;
            case 'settings':
                this.initSettingsTab();
                break;
            case 'users':
                this.initUsersTab();
                break;
        }
    }

    /**
     * 商品マスタタブ初期化
     */
    initProductsTab() {
        if (this.tables.products) return;
        
        const columns = [
            { key: 'code', label: '商品コード', type: 'text', width: '100px', required: true },
            { key: 'name', label: '商品名', type: 'text', width: '150px', required: true },
            { key: 'categoryId', label: 'カテゴリ', type: 'select', width: '120px', 
              options: this.masterData.categories.map(c => ({ value: c.id, label: c.name })) },
            { key: 'price', label: '単価', type: 'currency', width: '100px', required: true },
            { key: 'cost', label: '仕入価格', type: 'currency', width: '100px' },
            { key: 'supplierId', label: '仕入先', type: 'select', width: '120px',
              options: this.masterData.suppliers.map(s => ({ value: s.id, label: s.name })) },
            { key: 'minOrder', label: '最小発注数', type: 'number', width: '100px' },
            { key: 'orderUnit', label: '発注単位', type: 'number', width: '100px' },
            { key: 'status', label: 'ステータス', type: 'select', width: '100px',
              options: [
                  { value: 'active', label: '有効' },
                  { value: 'inactive', label: '無効' },
                  { value: 'discontinued', label: '廃止' }
              ]},
            { key: 'actions', label: '操作', type: 'actions', width: '120px' }
        ];
        
        this.tables.products = new Table({
            columns: columns,
            data: this.masterData.products,
            editable: false,
            sortable: true,
            paginated: true,
            pageSize: 20,
            onRowAction: this.handleProductAction.bind(this),
            className: 'master-table'
        });
        
        this.tables.products.mount('#products-table-container');
    }

    /**
     * カテゴリマスタタブ初期化
     */
    initCategoriesTab() {
        if (this.tables.categories) return;
        
        const columns = [
            { key: 'id', label: 'ID', type: 'text', width: '80px' },
            { key: 'name', label: 'カテゴリ名', type: 'text', width: '150px', required: true },
            { key: 'description', label: '説明', type: 'text', width: '200px' },
            { key: 'sortOrder', label: '表示順', type: 'number', width: '100px' },
            { key: 'status', label: 'ステータス', type: 'select', width: '100px',
              options: [
                  { value: 'active', label: '有効' },
                  { value: 'inactive', label: '無効' }
              ]},
            { key: 'actions', label: '操作', type: 'actions', width: '120px' }
        ];
        
        this.tables.categories = new Table({
            columns: columns,
            data: this.masterData.categories,
            editable: false,
            sortable: true,
            onRowAction: this.handleCategoryAction.bind(this),
            className: 'master-table'
        });
        
        this.tables.categories.mount('#categories-table-container');
    }

    /**
     * 仕入先マスタタブ初期化
     */
    initSuppliersTab() {
        if (this.tables.suppliers) return;
        
        const columns = [
            { key: 'id', label: 'ID', type: 'text', width: '80px' },
            { key: 'code', label: '仕入先コード', type: 'text', width: '120px', required: true },
            { key: 'name', label: '仕入先名', type: 'text', width: '150px', required: true },
            { key: 'contactName', label: '担当者', type: 'text', width: '120px' },
            { key: 'phone', label: '電話番号', type: 'tel', width: '130px' },
            { key: 'email', label: 'メール', type: 'email', width: '150px' },
            { key: 'address', label: '住所', type: 'text', width: '200px' },
            { key: 'paymentTerms', label: '支払条件', type: 'text', width: '100px' },
            { key: 'status', label: 'ステータス', type: 'select', width: '100px',
              options: [
                  { value: 'active', label: '有効' },
                  { value: 'inactive', label: '無効' }
              ]},
            { key: 'actions', label: '操作', type: 'actions', width: '120px' }
        ];
        
        this.tables.suppliers = new Table({
            columns: columns,
            data: this.masterData.suppliers,
            editable: false,
            sortable: true,
            onRowAction: this.handleSupplierAction.bind(this),
            className: 'master-table'
        });
        
        this.tables.suppliers.mount('#suppliers-table-container');
    }

    /**
     * システム設定タブ初期化
     */
    initSettingsTab() {
        if (this.forms.settings) return;
        
        const formConfig = {
            fields: [
                {
                    key: 'companyName',
                    type: 'text',
                    label: '会社名',
                    value: this.masterData.settings.companyName || '',
                    required: true
                },
                {
                    key: 'storeName',
                    type: 'text',
                    label: '店舗名',
                    value: this.masterData.settings.storeName || '',
                    required: true
                },
                {
                    key: 'defaultBudget',
                    type: 'number',
                    label: 'デフォルト予算',
                    value: this.masterData.settings.defaultBudget || 60000,
                    required: true
                },
                {
                    key: 'wasteRateThreshold',
                    type: 'number',
                    label: 'ロス率しきい値（%）',
                    value: this.masterData.settings.wasteRateThreshold || 5,
                    min: 0,
                    max: 100,
                    step: 0.1
                },
                {
                    key: 'autoSaveInterval',
                    type: 'number',
                    label: '自動保存間隔（秒）',
                    value: this.masterData.settings.autoSaveInterval || 30,
                    min: 10,
                    max: 300
                },
                {
                    key: 'workingHours',
                    type: 'text',
                    label: '営業時間',
                    value: this.masterData.settings.workingHours || '09:00-21:00',
                    placeholder: 'HH:MM-HH:MM'
                },
                {
                    key: 'timezone',
                    type: 'select',
                    label: 'タイムゾーン',
                    options: [
                        { value: 'Asia/Tokyo', label: '日本標準時（JST）' },
                        { value: 'UTC', label: '協定世界時（UTC）' }
                    ],
                    value: this.masterData.settings.timezone || 'Asia/Tokyo'
                },
                {
                    key: 'enableDebugMode',
                    type: 'checkbox',
                    label: 'デバッグモード有効',
                    value: this.masterData.settings.enableDebugMode || false
                },
                {
                    key: 'enableAutoRefresh',
                    type: 'checkbox',
                    label: '自動更新有効',
                    value: this.masterData.settings.enableAutoRefresh !== false
                }
            ]
        };
        
        this.forms.settings = new Form(formConfig);
        this.forms.settings.mount('#settings-form-container');
    }

    /**
     * ユーザー管理タブ初期化
     */
    initUsersTab() {
        if (this.tables.users) return;
        
        const columns = [
            { key: 'id', label: 'ID', type: 'text', width: '80px' },
            { key: 'username', label: 'ユーザー名', type: 'text', width: '120px', required: true },
            { key: 'email', label: 'メール', type: 'email', width: '150px', required: true },
            { key: 'displayName', label: '表示名', type: 'text', width: '120px' },
            { key: 'role', label: '権限', type: 'select', width: '100px',
              options: [
                  { value: 'admin', label: '管理者' },
                  { value: 'manager', label: 'マネージャー' },
                  { value: 'staff', label: 'スタッフ' },
                  { value: 'readonly', label: '参照のみ' }
              ]},
            { key: 'lastLogin', label: '最終ログイン', type: 'datetime', width: '140px' },
            { key: 'status', label: 'ステータス', type: 'select', width: '100px',
              options: [
                  { value: 'active', label: '有効' },
                  { value: 'inactive', label: '無効' },
                  { value: 'suspended', label: '停止' }
              ]},
            { key: 'actions', label: '操作', type: 'actions', width: '120px' }
        ];
        
        this.tables.users = new Table({
            columns: columns,
            data: this.masterData.users,
            editable: false,
            sortable: true,
            onRowAction: this.handleUserAction.bind(this),
            className: 'master-table'
        });
        
        this.tables.users.mount('#users-table-container');
    }

    /**
     * 商品アクションハンドラー
     * @param {string} action - アクション
     * @param {Object} row - 行データ
     */
    handleProductAction(action, row) {
        switch (action) {
            case 'edit':
                this.showProductModal(row);
                break;
            case 'delete':
                this.deleteProduct(row);
                break;
            case 'copy':
                this.copyProduct(row);
                break;
        }
    }

    /**
     * カテゴリアクションハンドラー
     * @param {string} action - アクション
     * @param {Object} row - 行データ
     */
    handleCategoryAction(action, row) {
        switch (action) {
            case 'edit':
                this.showCategoryModal(row);
                break;
            case 'delete':
                this.deleteCategory(row);
                break;
        }
    }

    /**
     * 仕入先アクションハンドラー
     * @param {string} action - アクション
     * @param {Object} row - 行データ
     */
    handleSupplierAction(action, row) {
        switch (action) {
            case 'edit':
                this.showSupplierModal(row);
                break;
            case 'delete':
                this.deleteSupplier(row);
                break;
        }
    }

    /**
     * ユーザーアクションハンドラー
     * @param {string} action - アクション
     * @param {Object} row - 行データ
     */
    handleUserAction(action, row) {
        switch (action) {
            case 'edit':
                this.showUserModal(row);
                break;
            case 'delete':
                this.deleteUser(row);
                break;
            case 'resetPassword':
                this.resetUserPassword(row);
                break;
        }
    }

    /**
     * 商品モーダル表示
     * @param {Object} product - 商品データ（編集時）
     */
    showProductModal(product = null) {
        const isEdit = !!product;
        const modal = document.getElementById('master-modal');
        const title = document.getElementById('modal-title');
        const formContainer = document.getElementById('modal-form-container');
        
        title.textContent = isEdit ? '商品編集' : '商品追加';
        
        const formConfig = {
            fields: [
                {
                    key: 'code',
                    type: 'text',
                    label: '商品コード',
                    value: product?.code || '',
                    required: true,
                    disabled: isEdit
                },
                {
                    key: 'name',
                    type: 'text',
                    label: '商品名',
                    value: product?.name || '',
                    required: true
                },
                {
                    key: 'categoryId',
                    type: 'select',
                    label: 'カテゴリ',
                    options: this.masterData.categories.map(c => ({ value: c.id, label: c.name })),
                    value: product?.categoryId || ''
                },
                {
                    key: 'price',
                    type: 'number',
                    label: '単価',
                    value: product?.price || 0,
                    required: true,
                    min: 0
                },
                {
                    key: 'cost',
                    type: 'number',
                    label: '仕入価格',
                    value: product?.cost || 0,
                    min: 0
                },
                {
                    key: 'supplierId',
                    type: 'select',
                    label: '仕入先',
                    options: this.masterData.suppliers.map(s => ({ value: s.id, label: s.name })),
                    value: product?.supplierId || ''
                },
                {
                    key: 'minOrder',
                    type: 'number',
                    label: '最小発注数',
                    value: product?.minOrder || 1,
                    min: 1
                },
                {
                    key: 'orderUnit',
                    type: 'number',
                    label: '発注単位',
                    value: product?.orderUnit || 1,
                    min: 1
                },
                {
                    key: 'status',
                    type: 'select',
                    label: 'ステータス',
                    options: [
                        { value: 'active', label: '有効' },
                        { value: 'inactive', label: '無効' },
                        { value: 'discontinued', label: '廃止' }
                    ],
                    value: product?.status || 'active'
                }
            ]
        };
        
        const form = new Form(formConfig);
        form.mount(formContainer);
        
        modal.style.display = 'block';
        this.currentForm = form;
        this.currentData = product;
    }

    /**
     * CSV取込み処理
     */
    async importProducts() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const products = this.parseCSV(text);
                
                Alert.confirm(`${products.length}件の商品データを取り込みますか？`, {
                    onConfirm: async () => {
                        await this.masterService.importProducts(products);
                        await this.loadAllMasterData();
                        this.initProductsTab();
                        Alert.success('商品データを取り込みました').mount();
                    }
                }).mount();
                
            } catch (error) {
                console.error('Import failed:', error);
                Alert.error('CSV取り込みに失敗しました').mount();
            }
        };
        
        input.click();
    }

    /**
     * CSV解析
     * @param {string} csvText - CSV文字列
     * @returns {Array} パース済みデータ
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            
            data.push(row);
        }
        
        return data;
    }

    /**
     * イベントリスナーの設定
     */
    attachEventListeners() {
        // タブ切替
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showTab(e.target.dataset.tab);
            });
        });
        
        // 商品マスタアクション
        document.getElementById('add-product-btn')?.addEventListener('click', () => {
            this.showProductModal();
        });
        
        document.getElementById('import-products-btn')?.addEventListener('click', () => {
            this.importProducts();
        });
        
        document.getElementById('export-products-btn')?.addEventListener('click', () => {
            this.exportProducts();
        });
        
        // カテゴリマスタアクション
        document.getElementById('add-category-btn')?.addEventListener('click', () => {
            this.showCategoryModal();
        });
        
        // 仕入先マスタアクション
        document.getElementById('add-supplier-btn')?.addEventListener('click', () => {
            this.showSupplierModal();
        });
        
        // システム設定アクション
        document.getElementById('save-settings-btn')?.addEventListener('click', () => {
            this.saveSettings();
        });
        
        document.getElementById('reset-settings-btn')?.addEventListener('click', () => {
            this.resetSettings();
        });
        
        // ユーザー管理アクション
        document.getElementById('add-user-btn')?.addEventListener('click', () => {
            this.showUserModal();
        });
        
        // モーダル制御
        document.getElementById('modal-save-btn')?.addEventListener('click', () => {
            this.saveModalData();
        });
        
        document.getElementById('modal-cancel-btn')?.addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('modal-close-btn')?.addEventListener('click', () => {
            this.closeModal();
        });
        
        // モーダル背景クリックで閉じる
        document.querySelector('.modal-backdrop')?.addEventListener('click', () => {
            this.closeModal();
        });
    }

    /**
     * モーダル保存
     */
    async saveModalData() {
        if (!this.currentForm) return;
        
        try {
            const formData = this.currentForm.getData();
            const isEdit = !!this.currentData;
            
            if (this.activeTab === 'products') {
                if (isEdit) {
                    await this.masterService.updateProduct(this.currentData.id, formData);
                } else {
                    await this.masterService.createProduct(formData);
                }
                await this.loadAllMasterData();
                this.tables.products.updateData(this.masterData.products);
            }
            // 他のタブも同様に処理...
            
            this.closeModal();
            Alert.success(isEdit ? '更新しました' : '追加しました').mount();
            
        } catch (error) {
            console.error('Save failed:', error);
            Alert.error('保存に失敗しました').mount();
        }
    }

    /**
     * モーダル閉じる
     */
    closeModal() {
        const modal = document.getElementById('master-modal');
        modal.style.display = 'none';
        this.currentForm = null;
        this.currentData = null;
    }

    /**
     * CSV出力（商品）
     */
    exportProducts() {
        try {
            const csvData = this.masterService.exportProductsToCSV(this.masterData.products);
            
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `products_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            Alert.success('商品マスタをCSV出力しました').mount();
            
        } catch (error) {
            console.error('Export failed:', error);
            Alert.error('CSV出力に失敗しました').mount();
        }
    }

    /**
     * システム破棄
     */
    destroy() {
        // ヘッダー破棄
        if (this.header) {
            this.header.destroy();
        }
        
        // テーブル破棄
        Object.values(this.tables).forEach(table => {
            if (table) table.destroy();
        });
        
        // フォーム破棄
        Object.values(this.forms).forEach(form => {
            if (form) form.destroy();
        });
    }
}

/**
 * MasterMaintenanceService - マスタメンテナンス用サービス
 */
class MasterMaintenanceService {
    constructor() {
        this.baseURL = '/api/master';
    }

    // 商品マスタ
    async getProducts() {
        return [
            { id: 1, code: '2408', name: 'デンマークCC', categoryId: 'denmark', price: 1200, cost: 800, supplierId: 'supplier1', minOrder: 5, orderUnit: 1, status: 'active' },
            { id: 2, code: '1001', name: 'レアチーズC', categoryId: 'denmark', price: 1000, cost: 650, supplierId: 'supplier1', minOrder: 3, orderUnit: 1, status: 'active' },
            { id: 3, code: '3201', name: 'カスタードプリン', categoryId: 'confection', price: 480, cost: 320, supplierId: 'supplier2', minOrder: 10, orderUnit: 2, status: 'active' }
        ];
    }

    // カテゴリマスタ
    async getCategories() {
        return [
            { id: 'denmark', name: 'デンマーク関連', description: 'デンマーク系商品', sortOrder: 1, status: 'active' },
            { id: 'confection', name: '洋菓子限定', description: 'プリン・マフィン等', sortOrder: 2, status: 'active' },
            { id: 'jelly', name: 'ゼリー', description: 'ゼリー系商品', sortOrder: 3, status: 'active' }
        ];
    }

    // 仕入先マスタ
    async getSuppliers() {
        return [
            { id: 'supplier1', code: 'S001', name: '洋菓子工房ABC', contactName: '田中太郎', phone: '03-1234-5678', email: 'tanaka@abc.com', address: '東京都渋谷区...', paymentTerms: '月末締め翌月末払い', status: 'active' },
            { id: 'supplier2', code: 'S002', name: 'スイーツファクトリー', contactName: '佐藤花子', phone: '03-9876-5432', email: 'sato@factory.com', address: '東京都新宿区...', paymentTerms: '15日締め当月末払い', status: 'active' }
        ];
    }

    // システム設定
    async getSettings() {
        return {
            companyName: '株式会社サンプル',
            storeName: '本店',
            defaultBudget: 60000,
            wasteRateThreshold: 5.0,
            autoSaveInterval: 30,
            workingHours: '09:00-21:00',
            timezone: 'Asia/Tokyo',
            enableDebugMode: false,
            enableAutoRefresh: true
        };
    }

    // ユーザー管理
    async getUsers() {
        return [
            { id: 1, username: 'admin', email: 'admin@company.com', displayName: '管理者', role: 'admin', lastLogin: '2024-01-15 14:30:00', status: 'active' },
            { id: 2, username: 'manager', email: 'manager@company.com', displayName: 'マネージャー', role: 'manager', lastLogin: '2024-01-15 09:15:00', status: 'active' },
            { id: 3, username: 'staff1', email: 'staff1@company.com', displayName: 'スタッフ1', role: 'staff', lastLogin: '2024-01-14 18:45:00', status: 'active' }
        ];
    }

    // CRUD操作
    async createProduct(data) {
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    async updateProduct(id, data) {
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    async deleteProduct(id) {
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    async importProducts(products) {
        return new Promise(resolve => setTimeout(resolve, 1000));
    }

    exportProductsToCSV(products) {
        const headers = ['商品コード', '商品名', 'カテゴリID', '単価', '仕入価格', '仕入先ID', '最小発注数', '発注単位', 'ステータス'];
        const csvContent = [
            headers.join(','),
            ...products.map(product => [
                product.code,
                `"${product.name}"`,
                product.categoryId,
                product.price,
                product.cost,
                product.supplierId,
                product.minOrder,
                product.orderUnit,
                product.status
            ].join(','))
        ].join('\n');
        
        return csvContent;
    }
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MasterMaintenance, MasterMaintenanceService };
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.MasterMaintenance = MasterMaintenance;
    window.MasterMaintenanceService = MasterMaintenanceService;
}