/**
 * Form Validation Module - Reusable validation logic for all forms
 * Provides consistent validation patterns across the application
 */

class FormValidator {
    constructor() {
        this.validationRules = new Map();
        this.errors = new Map();
        this.warnings = new Map();
        
        // Initialize default validation rules
        this.initializeDefaultRules();
    }

    /**
     * Initialize default validation rules
     */
    initializeDefaultRules() {
        // Loss rate validation (business rule: 5% threshold)
        this.addRule('lossRate', (value, context) => {
            const sales = parseFloat(context.sales) || 0;
            const waste = parseFloat(value) || 0;
            const total = sales + waste;
            
            if (total === 0) return { isValid: true };
            
            const lossRate = (waste / total) * 100;
            
            if (lossRate > 15) {
                return {
                    isValid: false,
                    level: 'error',
                    message: `ロス率が異常値です (${lossRate.toFixed(1)}%)`
                };
            } else if (lossRate > 5) {
                return {
                    isValid: false,
                    level: 'warning',
                    message: `ロス率が基準値を超えています (${lossRate.toFixed(1)}%)`
                };
            }
            
            return { isValid: true };
        });

        // Time format validation (HH:MM)
        this.addRule('timeFormat', (value) => {
            if (!value) return { isValid: true };
            
            const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            const isValid = timePattern.test(value);
            
            return {
                isValid,
                level: isValid ? 'success' : 'error',
                message: isValid ? '' : '時間の形式が正しくありません (HH:MM)'
            };
        });

        // Stock level validation (non-negative)
        this.addRule('stockLevel', (value, context) => {
            const prevStock = parseFloat(context.prevStock) || 0;
            const delivery = parseFloat(context.delivery) || 0;
            const movement = parseFloat(context.movement) || 0;
            const sales = parseFloat(context.sales) || 0;
            const waste = parseFloat(value) || 0;
            
            const currentStock = prevStock + delivery + movement - sales - waste;
            
            return {
                isValid: currentStock >= 0,
                level: currentStock >= 0 ? 'success' : 'error',
                message: currentStock >= 0 ? '' : '在庫がマイナスになっています'
            };
        });

        // Required field validation
        this.addRule('required', (value) => {
            const isValid = value !== null && value !== undefined && value.toString().trim() !== '';
            return {
                isValid,
                level: isValid ? 'success' : 'error',
                message: isValid ? '' : 'この項目は必須です'
            };
        });

        // Numeric validation
        this.addRule('numeric', (value) => {
            const numValue = parseFloat(value);
            const isValid = !isNaN(numValue) && isFinite(numValue);
            return {
                isValid,
                level: isValid ? 'success' : 'error',
                message: isValid ? '' : '数値を入力してください'
            };
        });

        // Min/Max validation
        this.addRule('range', (value, context) => {
            const numValue = parseFloat(value);
            const min = parseFloat(context.min);
            const max = parseFloat(context.max);
            
            if (isNaN(numValue)) {
                return {
                    isValid: false,
                    level: 'error',
                    message: '数値を入力してください'
                };
            }
            
            if (!isNaN(min) && numValue < min) {
                return {
                    isValid: false,
                    level: 'error',
                    message: `${min}以上の値を入力してください`
                };
            }
            
            if (!isNaN(max) && numValue > max) {
                return {
                    isValid: false,
                    level: 'error',
                    message: `${max}以下の値を入力してください`
                };
            }
            
            return { isValid: true };
        });

        // Order constraint validation (minimum order quantities and multiples)
        this.addRule('orderConstraint', (value, context) => {
            const orderQty = parseFloat(value) || 0;
            const minQty = parseFloat(context.minOrder) || 0;
            const stepQty = parseFloat(context.orderStep) || 1;
            
            if (orderQty < minQty) {
                return {
                    isValid: false,
                    level: 'error',
                    message: `最小発注数${minQty}個以上で入力してください`
                };
            }
            
            if (orderQty % stepQty !== 0) {
                return {
                    isValid: false,
                    level: 'warning',
                    message: `発注単位${stepQty}個の倍数で入力してください`
                };
            }
            
            return { isValid: true };
        });

        // Composition total validation (should sum to 100%)
        this.addRule('compositionTotal', (values) => {
            const total = values.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            const tolerance = 0.1; // 0.1% tolerance
            
            if (Math.abs(total - 100) <= tolerance) {
                return { isValid: true };
            }
            
            return {
                isValid: false,
                level: 'warning',
                message: `構成比の合計が100%ではありません (${total.toFixed(1)}%)`
            };
        });
    }

    /**
     * Add custom validation rule
     * @param {string} ruleName - Name of the rule
     * @param {Function} validator - Validation function
     */
    addRule(ruleName, validator) {
        this.validationRules.set(ruleName, validator);
    }

    /**
     * Validate single field
     * @param {string} fieldId - Field element ID
     * @param {Array} rules - Array of rule names to apply
     * @param {Object} context - Additional context for validation
     * @returns {Object} Validation result
     */
    validateField(fieldId, rules, context = {}) {
        const element = document.getElementById(fieldId);
        if (!element) {
            return { isValid: false, message: 'Field not found' };
        }

        const value = element.value;
        let overallResult = { isValid: true, level: 'success', messages: [] };

        for (const ruleName of rules) {
            const rule = this.validationRules.get(ruleName);
            if (rule) {
                const result = rule(value, { ...context, element });
                
                if (!result.isValid) {
                    overallResult.isValid = false;
                    if (result.level === 'error') {
                        overallResult.level = 'error';
                    } else if (result.level === 'warning' && overallResult.level !== 'error') {
                        overallResult.level = 'warning';
                    }
                    overallResult.messages.push(result.message);
                }
            }
        }

        // Apply visual feedback
        this.applyValidationFeedback(element, overallResult);
        
        // Store result
        if (!overallResult.isValid) {
            if (overallResult.level === 'error') {
                this.errors.set(fieldId, overallResult);
            } else {
                this.warnings.set(fieldId, overallResult);
            }
        } else {
            this.errors.delete(fieldId);
            this.warnings.delete(fieldId);
        }

        return overallResult;
    }

    /**
     * Validate entire form
     * @param {string} formId - Form element ID
     * @param {Object} fieldRules - Field validation rules mapping
     * @param {Object} globalContext - Global context for all validations
     * @returns {Object} Form validation result
     */
    validateForm(formId, fieldRules, globalContext = {}) {
        const form = document.getElementById(formId);
        if (!form) {
            return { isValid: false, message: 'Form not found' };
        }

        this.errors.clear();
        this.warnings.clear();

        let hasErrors = false;
        let hasWarnings = false;

        // Validate individual fields
        for (const [fieldId, rules] of Object.entries(fieldRules)) {
            const result = this.validateField(fieldId, rules, globalContext);
            if (!result.isValid) {
                if (result.level === 'error') {
                    hasErrors = true;
                } else {
                    hasWarnings = true;
                }
            }
        }

        return {
            isValid: !hasErrors,
            hasWarnings,
            errorCount: this.errors.size,
            warningCount: this.warnings.size,
            errors: Array.from(this.errors.values()),
            warnings: Array.from(this.warnings.values())
        };
    }

    /**
     * Apply visual feedback to form element
     * @param {HTMLElement} element - Form element
     * @param {Object} result - Validation result
     */
    applyValidationFeedback(element, result) {
        // Remove existing validation classes
        element.classList.remove('validation-error', 'validation-warning', 'validation-success');
        
        // Apply appropriate class
        if (!result.isValid) {
            const className = result.level === 'error' ? 'validation-error' : 'validation-warning';
            element.classList.add(className);
        } else {
            element.classList.add('validation-success');
        }

        // Update tooltip or help text if available
        const helpElement = element.parentNode.querySelector('.validation-help');
        if (helpElement) {
            helpElement.textContent = result.messages.join(', ');
            helpElement.className = `validation-help validation-help-${result.level}`;
        }
    }

    /**
     * Create validation summary
     * @param {string} containerId - Container element ID
     * @param {Object} validationResult - Form validation result
     */
    createValidationSummary(containerId, validationResult) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        if (validationResult.isValid && !validationResult.hasWarnings) {
            const successAlert = this.createAlert('success', '✓ 検証完了', 'すべての入力項目が正常です。');
            container.appendChild(successAlert);
            return;
        }

        // Add errors
        if (validationResult.errorCount > 0) {
            const errorAlert = this.createAlert(
                'error', 
                '🚨 入力エラー', 
                `${validationResult.errorCount}件のエラーがあります。修正してください。`
            );
            container.appendChild(errorAlert);
        }

        // Add warnings
        if (validationResult.warningCount > 0) {
            const warningAlert = this.createAlert(
                'warning',
                '⚠️ 注意事項',
                `${validationResult.warningCount}件の警告があります。確認してください。`
            );
            container.appendChild(warningAlert);
        }
    }

    /**
     * Create alert element
     * @param {string} type - Alert type
     * @param {string} title - Alert title
     * @param {string} message - Alert message
     * @returns {HTMLElement} Alert element
     */
    createAlert(type, title, message) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        
        const titleElement = document.createElement('strong');
        titleElement.textContent = title;
        
        const messageElement = document.createElement('span');
        messageElement.textContent = ' ' + message;
        
        alert.appendChild(titleElement);
        alert.appendChild(messageElement);
        
        return alert;
    }

    /**
     * Get all current errors
     * @returns {Array} Array of error objects
     */
    getErrors() {
        return Array.from(this.errors.values());
    }

    /**
     * Get all current warnings
     * @returns {Array} Array of warning objects
     */
    getWarnings() {
        return Array.from(this.warnings.values());
    }

    /**
     * Clear all validation states
     */
    clearAll() {
        this.errors.clear();
        this.warnings.clear();
        
        // Remove validation classes from all elements
        document.querySelectorAll('.validation-error, .validation-warning, .validation-success').forEach(element => {
            element.classList.remove('validation-error', 'validation-warning', 'validation-success');
        });
    }

    /**
     * Real-time validation setup for form
     * @param {string} formId - Form element ID
     * @param {Object} fieldRules - Field validation rules
     * @param {Object} options - Validation options
     */
    setupRealTimeValidation(formId, fieldRules, options = {}) {
        const form = document.getElementById(formId);
        if (!form) return;

        const debounceDelay = options.debounceDelay || 300;
        const validateOnBlur = options.validateOnBlur !== false;
        const validateOnInput = options.validateOnInput !== false;

        // Create debounced validation function
        const debouncedValidate = this.debounce((fieldId, rules, context) => {
            this.validateField(fieldId, rules, context);
        }, debounceDelay);

        // Add event listeners
        for (const fieldId of Object.keys(fieldRules)) {
            const element = document.getElementById(fieldId);
            if (element) {
                if (validateOnInput) {
                    element.addEventListener('input', () => {
                        debouncedValidate(fieldId, fieldRules[fieldId], options.context || {});
                    });
                }
                
                if (validateOnBlur) {
                    element.addEventListener('blur', () => {
                        this.validateField(fieldId, fieldRules[fieldId], options.context || {});
                    });
                }
            }
        }
    }

    /**
     * Debounce utility function
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
}

// Export validator for use in other scripts
window.FormValidator = FormValidator;