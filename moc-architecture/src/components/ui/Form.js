/**
 * Form Component - 高機能フォームコンポーネント
 * MOCアーキテクチャの基本UIコンポーネント
 */
class Form {
    constructor(options = {}) {
        this.fields = options.fields || [];
        this.data = options.data || {};
        this.validators = options.validators || {};
        this.onSubmit = options.onSubmit || null;
        this.onChange = options.onChange || null;
        this.className = options.className || '';
        this.id = options.id || `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        this.element = null;
        this.errors = {};
        this.touched = new Set();
        this.isSubmitting = false;
        
        // フィールドタイプのデフォルト設定
        this.fieldDefaults = {
            text: { type: 'text', required: false },
            email: { type: 'email', required: false },
            password: { type: 'password', required: false },
            number: { type: 'number', required: false },
            tel: { type: 'tel', required: false },
            url: { type: 'url', required: false },
            date: { type: 'date', required: false },
            time: { type: 'time', required: false },
            datetime: { type: 'datetime-local', required: false },
            textarea: { tag: 'textarea', required: false },
            select: { tag: 'select', required: false },
            checkbox: { type: 'checkbox', required: false },
            radio: { type: 'radio', required: false },
            hidden: { type: 'hidden', required: false }
        };
    }

    /**
     * フォームのHTML構造を生成
     * @returns {string} HTML文字列
     */
    render() {
        const fieldsHtml = this.fields.map(field => this.renderField(field)).join('');
        
        return `
            <form id="${this.id}" class="form ${this.className}" novalidate>
                ${fieldsHtml}
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary form-submit">
                        <span class="form-submit-text">送信</span>
                        <div class="form-submit-spinner" style="display: none;">⟳</div>
                    </button>
                    <button type="button" class="btn btn-secondary form-reset">リセット</button>
                </div>
                <div class="form-errors" style="display: none;">
                    <div class="form-errors-title">入力エラーがあります：</div>
                    <ul class="form-errors-list"></ul>
                </div>
            </form>
        `;
    }

    /**
     * フィールドのHTML構造を生成
     * @param {Object} field - フィールド定義
     * @returns {string} HTML文字列
     */
    renderField(field) {
        const fieldConfig = { ...this.fieldDefaults[field.type] || {}, ...field };
        const value = this.data[field.name] || fieldConfig.defaultValue || '';
        const error = this.errors[field.name];
        const hasError = error && this.touched.has(field.name);
        
        // ラッパークラス
        const wrapperClass = `form-field ${field.wrapperClass || ''} ${hasError ? 'has-error' : ''}`.trim();
        
        // フィールド固有の属性
        const commonAttrs = this.getCommonAttributes(fieldConfig);
        const specificAttrs = this.getSpecificAttributes(fieldConfig);
        
        // ラベル
        const label = fieldConfig.label ? 
            `<label class="form-label" for="${fieldConfig.name}">
                ${fieldConfig.label}
                ${fieldConfig.required ? '<span class="form-required">*</span>' : ''}
            </label>` : '';
        
        // ヘルプテキスト
        const help = fieldConfig.help ? 
            `<div class="form-help">${fieldConfig.help}</div>` : '';
        
        // エラーメッセージ
        const errorMsg = hasError ? 
            `<div class="form-error">${error}</div>` : '';
        
        // フィールド要素
        let fieldElement;
        
        switch (fieldConfig.type) {
            case 'textarea':
                fieldElement = `<textarea ${commonAttrs} ${specificAttrs}>${value}</textarea>`;
                break;
                
            case 'select':
                const options = (fieldConfig.options || []).map(option => {
                    const optValue = typeof option === 'object' ? option.value : option;
                    const optLabel = typeof option === 'object' ? option.label : option;
                    const selected = optValue == value ? 'selected' : '';
                    return `<option value="${optValue}" ${selected}>${optLabel}</option>`;
                }).join('');
                fieldElement = `<select ${commonAttrs} ${specificAttrs}>${options}</select>`;
                break;
                
            case 'radio':
                const radioOptions = (fieldConfig.options || []).map(option => {
                    const optValue = typeof option === 'object' ? option.value : option;
                    const optLabel = typeof option === 'object' ? option.label : option;
                    const checked = optValue == value ? 'checked' : '';
                    const radioId = `${fieldConfig.name}_${optValue}`;
                    return `
                        <div class="form-radio-item">
                            <input type="radio" ${commonAttrs} id="${radioId}" value="${optValue}" ${checked}>
                            <label for="${radioId}" class="form-radio-label">${optLabel}</label>
                        </div>
                    `;
                }).join('');
                fieldElement = `<div class="form-radio-group">${radioOptions}</div>`;
                break;
                
            case 'checkbox':
                if (fieldConfig.options) {
                    // 複数チェックボックス
                    const checkboxOptions = fieldConfig.options.map(option => {
                        const optValue = typeof option === 'object' ? option.value : option;
                        const optLabel = typeof option === 'object' ? option.label : option;
                        const checked = Array.isArray(value) && value.includes(optValue) ? 'checked' : '';
                        const checkboxId = `${fieldConfig.name}_${optValue}`;
                        return `
                            <div class="form-checkbox-item">
                                <input type="checkbox" ${commonAttrs} id="${checkboxId}" value="${optValue}" ${checked}>
                                <label for="${checkboxId}" class="form-checkbox-label">${optLabel}</label>
                            </div>
                        `;
                    }).join('');
                    fieldElement = `<div class="form-checkbox-group">${checkboxOptions}</div>`;
                } else {
                    // 単一チェックボックス
                    const checked = value ? 'checked' : '';
                    fieldElement = `
                        <div class="form-checkbox-single">
                            <input type="checkbox" ${commonAttrs} ${checked} ${specificAttrs}>
                            <label for="${fieldConfig.name}" class="form-checkbox-label">${fieldConfig.checkboxLabel || ''}</label>
                        </div>
                    `;
                }
                break;
                
            default:
                fieldElement = `<input ${commonAttrs} value="${value}" ${specificAttrs}>`;
                break;
        }
        
        return `
            <div class="${wrapperClass}">
                ${label}
                <div class="form-input-wrapper">
                    ${fieldElement}
                </div>
                ${help}
                ${errorMsg}
            </div>
        `;
    }

    /**
     * 共通属性を取得
     * @param {Object} field - フィールド設定
     * @returns {string} 属性文字列
     */
    getCommonAttributes(field) {
        const attrs = [];
        
        attrs.push(`name="${field.name}"`);
        attrs.push(`id="${field.name}"`);
        attrs.push(`class="form-input ${field.className || ''}"`);
        
        if (field.required) attrs.push('required');
        if (field.disabled) attrs.push('disabled');
        if (field.readonly) attrs.push('readonly');
        if (field.placeholder) attrs.push(`placeholder="${field.placeholder}"`);
        
        return attrs.join(' ');
    }

    /**
     * フィールド固有の属性を取得
     * @param {Object} field - フィールド設定
     * @returns {string} 属性文字列
     */
    getSpecificAttributes(field) {
        const attrs = [];
        
        if (field.type && field.type !== 'textarea' && field.type !== 'select') {
            attrs.push(`type="${field.type}"`);
        }
        
        if (field.min !== undefined) attrs.push(`min="${field.min}"`);
        if (field.max !== undefined) attrs.push(`max="${field.max}"`);
        if (field.step !== undefined) attrs.push(`step="${field.step}"`);
        if (field.pattern) attrs.push(`pattern="${field.pattern}"`);
        if (field.maxlength) attrs.push(`maxlength="${field.maxlength}"`);
        if (field.rows) attrs.push(`rows="${field.rows}"`);
        if (field.cols) attrs.push(`cols="${field.cols}"`);
        
        return attrs.join(' ');
    }

    /**
     * DOM要素に挿入・初期化
     * @param {string|HTMLElement} target - 挿入先
     * @returns {HTMLElement} フォーム要素
     */
    mount(target) {
        const container = typeof target === 'string' ? document.querySelector(target) : target;
        if (!container) {
            throw new Error('Form mount target not found');
        }

        container.innerHTML = this.render();
        this.element = container.querySelector(`#${this.id}`);
        
        // グローバル参照を設定
        window[`form_${this.id}`] = this;
        
        // イベントリスナーを設定
        this.attachEventListeners();
        
        return this.element;
    }

    /**
     * イベントリスナーを設定
     */
    attachEventListeners() {
        if (!this.element) return;

        // フォーム送信
        this.element.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // リセットボタン
        const resetBtn = this.element.querySelector('.form-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.reset();
            });
        }

        // フィールド変更監視
        this.element.addEventListener('input', (e) => {
            this.handleFieldChange(e);
        });

        this.element.addEventListener('change', (e) => {
            this.handleFieldChange(e);
        });

        // フィールドのフォーカス離脱時バリデーション
        this.element.addEventListener('blur', (e) => {
            if (e.target.matches('.form-input')) {
                this.touched.add(e.target.name);
                this.validateField(e.target.name);
            }
        }, true);
    }

    /**
     * フィールド変更ハンドラー
     * @param {Event} event - イベント
     */
    handleFieldChange(event) {
        const field = event.target;
        if (!field.matches('.form-input')) return;

        const fieldName = field.name;
        let value;

        // フィールドタイプに応じて値を取得
        if (field.type === 'checkbox') {
            if (field.parentElement.classList.contains('form-checkbox-group')) {
                // 複数チェックボックス
                const checkboxes = this.element.querySelectorAll(`input[name="${fieldName}"]:checked`);
                value = Array.from(checkboxes).map(cb => cb.value);
            } else {
                // 単一チェックボックス
                value = field.checked;
            }
        } else if (field.type === 'radio') {
            value = field.value;
        } else {
            value = field.value;
        }

        // データを更新
        this.data[fieldName] = value;
        
        // onChangeコールバック実行
        if (this.onChange) {
            this.onChange(fieldName, value, this.data);
        }

        // リアルタイムバリデーション（touchedなフィールドのみ）
        if (this.touched.has(fieldName)) {
            this.validateField(fieldName);
        }

        // エラー表示を更新
        this.updateErrorDisplay();
    }

    /**
     * フォーム送信ハンドラー
     */
    async handleSubmit() {
        if (this.isSubmitting) return;

        // 全フィールドをtouchedにマーク
        this.fields.forEach(field => this.touched.add(field.name));

        // バリデーション実行
        const isValid = this.validate();
        
        if (!isValid) {
            this.updateErrorDisplay();
            return;
        }

        if (!this.onSubmit) return;

        try {
            this.setSubmitting(true);
            await this.onSubmit(this.data, this);
            
            // 送信成功時の処理
            if (window.eventBus) {
                window.eventBus.emit('form.submit.success', {
                    formId: this.id,
                    data: this.data
                });
            }
            
        } catch (error) {
            console.error('Form submit error:', error);
            
            // サーバーエラーの表示
            this.setFormError('送信エラーが発生しました。再度お試しください。');
            
            if (window.eventBus) {
                window.eventBus.emit('form.submit.error', {
                    formId: this.id,
                    error: error.message
                });
            }
        } finally {
            this.setSubmitting(false);
        }
    }

    /**
     * 単一フィールドのバリデーション
     * @param {string} fieldName - フィールド名
     * @returns {boolean} バリデーション結果
     */
    validateField(fieldName) {
        const field = this.fields.find(f => f.name === fieldName);
        if (!field) return true;

        const value = this.data[fieldName];
        let error = null;

        // 必須チェック
        if (field.required) {
            if (value === undefined || value === null || value === '' || 
                (Array.isArray(value) && value.length === 0)) {
                error = `${field.label || fieldName}は必須です`;
            }
        }

        // カスタムバリデーター
        if (!error && this.validators[fieldName] && value !== undefined && value !== '') {
            const result = this.validators[fieldName](value, this.data);
            if (result && !result.valid) {
                error = result.message;
            }
        }

        // 内蔵バリデーション
        if (!error && value && field.type) {
            error = this.runBuiltinValidation(field, value);
        }

        // エラー状態を更新
        if (error) {
            this.errors[fieldName] = error;
        } else {
            delete this.errors[fieldName];
        }

        // UI更新
        this.updateFieldError(fieldName);

        return !error;
    }

    /**
     * 内蔵バリデーション
     * @param {Object} field - フィールド設定
     * @param {any} value - 値
     * @returns {string|null} エラーメッセージ
     */
    runBuiltinValidation(field, value) {
        switch (field.type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    return 'メールアドレスの形式が正しくありません';
                }
                break;
                
            case 'url':
                try {
                    new URL(value);
                } catch {
                    return 'URLの形式が正しくありません';
                }
                break;
                
            case 'number':
                if (isNaN(value)) {
                    return '数値を入力してください';
                }
                if (field.min !== undefined && Number(value) < field.min) {
                    return `${field.min}以上の値を入力してください`;
                }
                if (field.max !== undefined && Number(value) > field.max) {
                    return `${field.max}以下の値を入力してください`;
                }
                break;
                
            case 'tel':
                const telRegex = /^[\d\-\+\(\)\s]+$/;
                if (!telRegex.test(value)) {
                    return '電話番号の形式が正しくありません';
                }
                break;
        }

        // 文字列長チェック
        if (field.maxlength && value.length > field.maxlength) {
            return `${field.maxlength}文字以内で入力してください`;
        }

        // パターンチェック
        if (field.pattern) {
            const regex = new RegExp(field.pattern);
            if (!regex.test(value)) {
                return field.patternMessage || '入力形式が正しくありません';
            }
        }

        return null;
    }

    /**
     * フォーム全体のバリデーション
     * @returns {boolean} バリデーション結果
     */
    validate() {
        this.errors = {};
        
        for (const field of this.fields) {
            this.validateField(field.name);
        }
        
        return Object.keys(this.errors).length === 0;
    }

    /**
     * フィールドエラー表示を更新
     * @param {string} fieldName - フィールド名
     */
    updateFieldError(fieldName) {
        const fieldWrapper = this.element.querySelector(`.form-field:has([name="${fieldName}"])`);
        if (!fieldWrapper) return;

        const errorElement = fieldWrapper.querySelector('.form-error');
        const error = this.errors[fieldName];
        const hasError = error && this.touched.has(fieldName);

        if (hasError) {
            fieldWrapper.classList.add('has-error');
            if (errorElement) {
                errorElement.textContent = error;
            }
        } else {
            fieldWrapper.classList.remove('has-error');
            if (errorElement) {
                errorElement.textContent = '';
            }
        }
    }

    /**
     * エラー表示を更新
     */
    updateErrorDisplay() {
        // 各フィールドのエラー表示を更新
        this.fields.forEach(field => this.updateFieldError(field.name));

        // フォーム全体のエラー表示
        const formErrors = this.element.querySelector('.form-errors');
        const errorsList = this.element.querySelector('.form-errors-list');
        const touchedErrors = Object.keys(this.errors).filter(key => this.touched.has(key));

        if (touchedErrors.length > 0) {
            errorsList.innerHTML = touchedErrors.map(key => 
                `<li>${this.errors[key]}</li>`
            ).join('');
            formErrors.style.display = 'block';
        } else {
            formErrors.style.display = 'none';
        }
    }

    /**
     * 送信状態を設定
     * @param {boolean} submitting - 送信中フラグ
     */
    setSubmitting(submitting) {
        this.isSubmitting = submitting;
        const submitBtn = this.element.querySelector('.form-submit');
        const submitText = submitBtn.querySelector('.form-submit-text');
        const submitSpinner = submitBtn.querySelector('.form-submit-spinner');

        if (submitting) {
            submitBtn.disabled = true;
            submitText.style.display = 'none';
            submitSpinner.style.display = 'inline-block';
        } else {
            submitBtn.disabled = false;
            submitText.style.display = 'inline';
            submitSpinner.style.display = 'none';
        }
    }

    /**
     * フォームエラーを設定
     * @param {string} message - エラーメッセージ
     */
    setFormError(message) {
        const formErrors = this.element.querySelector('.form-errors');
        const errorsList = this.element.querySelector('.form-errors-list');
        
        errorsList.innerHTML = `<li>${message}</li>`;
        formErrors.style.display = 'block';
    }

    /**
     * フォームデータを設定
     * @param {Object} data - フォームデータ
     */
    setData(data) {
        this.data = { ...this.data, ...data };
        
        // UI更新
        Object.keys(data).forEach(fieldName => {
            const field = this.element.querySelector(`[name="${fieldName}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = data[fieldName];
                } else if (field.type === 'radio') {
                    const radio = this.element.querySelector(`[name="${fieldName}"][value="${data[fieldName]}"]`);
                    if (radio) radio.checked = true;
                } else {
                    field.value = data[fieldName];
                }
            }
        });
    }

    /**
     * フォームをリセット
     */
    reset() {
        this.data = {};
        this.errors = {};
        this.touched.clear();
        
        this.element.reset();
        this.updateErrorDisplay();
    }

    /**
     * フォームを破棄
     */
    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        
        delete window[`form_${this.id}`];
    }
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Form;
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.Form = Form;
}