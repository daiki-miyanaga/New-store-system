/**
 * Common Utility Functions - Extracted from HTML files for better maintainability
 * This file contains shared utilities for form validation, calculations, and DOM manipulation
 */

// Validation utilities
const ValidationUtils = {
    /**
     * Validates loss rate according to business rules
     * @param {number} waste - Waste quantity
     * @param {number} total - Total handled quantity
     * @returns {object} Validation result with status and message
     */
    validateLossRate(waste, total) {
        if (total === 0) return { isValid: true, level: 'info', message: '' };
        
        const wasteRate = (waste / total) * 100;
        
        if (wasteRate > 15.0) {
            return {
                isValid: false,
                level: 'error',
                message: `ロス率が異常に高値です (${wasteRate.toFixed(1)}%)`
            };
        } else if (wasteRate > 5.0) {
            return {
                isValid: false,
                level: 'warning',
                message: `ロス率が基準値(5%)を超えています (${wasteRate.toFixed(1)}%)`
            };
        }
        
        return { isValid: true, level: 'success', message: 'ロス率は正常範囲内です' };
    },

    /**
     * Validates time format (HH:MM)
     * @param {string} time - Time string to validate
     * @returns {object} Validation result
     */
    validateTimeFormat(time) {
        if (!time) return { isValid: true, message: '' };
        
        const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        const isValid = timePattern.test(time);
        
        return {
            isValid,
            level: isValid ? 'success' : 'error',
            message: isValid ? '' : '時間の形式が正しくありません (HH:MM形式で入力してください)'
        };
    },

    /**
     * Validates stock levels (should not be negative)
     * @param {number} stock - Stock level to validate
     * @returns {object} Validation result
     */
    validateStockLevel(stock) {
        const isValid = stock >= 0;
        return {
            isValid,
            level: isValid ? 'success' : 'error',
            message: isValid ? '' : '在庫がマイナスになっています'
        };
    }
};

// Calculation utilities
const CalculationUtils = {
    /**
     * Calculates current stock using the standard formula
     * @param {number} prevStock - Previous stock
     * @param {number} delivery - Delivery quantity
     * @param {number} movement - Movement quantity
     * @param {number} sales - Sales quantity
     * @param {number} waste - Waste quantity
     * @returns {number} Current stock
     */
    calculateCurrentStock(prevStock, delivery, movement, sales, waste) {
        return Math.max(0, prevStock + delivery + movement - sales - waste);
    },

    /**
     * Calculates composition percentage
     * @param {number} amount - Individual amount
     * @param {number} total - Total amount
     * @returns {string} Percentage string with 1 decimal place
     */
    calculateComposition(amount, total) {
        if (total === 0) return '0.0';
        return ((amount / total) * 100).toFixed(1);
    },

    /**
     * Calculates loss rate percentage
     * @param {number} waste - Waste quantity
     * @param {number} handled - Total handled quantity
     * @returns {number} Loss rate as percentage
     */
    calculateLossRate(waste, handled) {
        if (handled === 0) return 0;
        return (waste / handled) * 100;
    },

    /**
     * Formats currency with Japanese Yen symbol
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        return '¥' + amount.toLocaleString();
    },

    /**
     * Calculates budget usage percentage
     * @param {number} used - Used amount
     * @param {number} budget - Total budget
     * @returns {number} Usage percentage
     */
    calculateBudgetUsage(used, budget) {
        if (budget === 0) return 0;
        return Math.min((used / budget) * 100, 100);
    }
};

// DOM manipulation utilities
const DOMUtils = {
    /**
     * Safely gets element by ID
     * @param {string} id - Element ID
     * @returns {Element|null} Element or null if not found
     */
    getElementById(id) {
        return document.getElementById(id);
    },

    /**
     * Updates element text content safely
     * @param {string} id - Element ID
     * @param {string} content - Content to set
     */
    updateTextContent(id, content) {
        const element = this.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    },

    /**
     * Updates element HTML content safely
     * @param {string} id - Element ID
     * @param {string} html - HTML content to set
     */
    updateInnerHTML(id, html) {
        const element = this.getElementById(id);
        if (element) {
            element.innerHTML = html;
        }
    },

    /**
     * Adds CSS class to element
     * @param {string} id - Element ID
     * @param {string} className - Class name to add
     */
    addClass(id, className) {
        const element = this.getElementById(id);
        if (element) {
            element.classList.add(className);
        }
    },

    /**
     * Removes CSS class from element
     * @param {string} id - Element ID
     * @param {string} className - Class name to remove
     */
    removeClass(id, className) {
        const element = this.getElementById(id);
        if (element) {
            element.classList.remove(className);
        }
    },

    /**
     * Toggles CSS class on element
     * @param {string} id - Element ID
     * @param {string} className - Class name to toggle
     */
    toggleClass(id, className) {
        const element = this.getElementById(id);
        if (element) {
            element.classList.toggle(className);
        }
    },

    /**
     * Sets element style property
     * @param {string} id - Element ID
     * @param {string} property - CSS property name
     * @param {string} value - CSS property value
     */
    setStyle(id, property, value) {
        const element = this.getElementById(id);
        if (element) {
            element.style[property] = value;
        }
    }
};

// Form utilities
const FormUtils = {
    /**
     * Gets numeric value from input element
     * @param {string} id - Input element ID
     * @param {number} defaultValue - Default value if empty or invalid
     * @returns {number} Numeric value
     */
    getNumericValue(id, defaultValue = 0) {
        const element = DOMUtils.getElementById(id);
        if (element) {
            const value = parseInt(element.value) || defaultValue;
            return Math.max(0, value); // Ensure non-negative
        }
        return defaultValue;
    },

    /**
     * Gets text value from input element
     * @param {string} id - Input element ID
     * @param {string} defaultValue - Default value if empty
     * @returns {string} Text value
     */
    getTextValue(id, defaultValue = '') {
        const element = DOMUtils.getElementById(id);
        return element ? element.value.trim() : defaultValue;
    },

    /**
     * Sets input element value
     * @param {string} id - Input element ID
     * @param {string|number} value - Value to set
     */
    setInputValue(id, value) {
        const element = DOMUtils.getElementById(id);
        if (element) {
            element.value = value;
        }
    },

    /**
     * Applies validation styling to input element
     * @param {string} id - Input element ID
     * @param {object} validationResult - Validation result object
     */
    applyValidationStyle(id, validationResult) {
        const element = DOMUtils.getElementById(id);
        if (element) {
            // Remove existing validation classes
            element.classList.remove('validation-error', 'validation-warning', 'validation-success');
            
            // Apply appropriate class based on validation result
            if (!validationResult.isValid) {
                const className = validationResult.level === 'error' ? 'validation-error' : 'validation-warning';
                element.classList.add(className);
            } else if (validationResult.level === 'success') {
                element.classList.add('validation-success');
            }
        }
    }
};

// Event handling utilities
const EventUtils = {
    /**
     * Debounces function calls
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
    },

    /**
     * Throttles function calls
     * @param {Function} func - Function to throttle
     * @param {number} interval - Interval in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, interval) {
        let isThrottled = false;
        return function (...args) {
            if (!isThrottled) {
                func.apply(this, args);
                isThrottled = true;
                setTimeout(() => isThrottled = false, interval);
            }
        };
    },

    /**
     * Adds event listener with automatic cleanup
     * @param {string} id - Element ID
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @returns {Function} Cleanup function
     */
    addListener(id, event, handler) {
        const element = DOMUtils.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
            return () => element.removeEventListener(event, handler);
        }
        return () => {}; // No-op cleanup function
    }
};

// Data transformation utilities
const DataUtils = {
    /**
     * Groups array items by a specified key
     * @param {Array} array - Array to group
     * @param {string} key - Key to group by
     * @returns {Object} Grouped object
     */
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const groupKey = item[key];
            groups[groupKey] = groups[groupKey] || [];
            groups[groupKey].push(item);
            return groups;
        }, {});
    },

    /**
     * Sums array items by a specified numeric property
     * @param {Array} array - Array to sum
     * @param {string} property - Property to sum
     * @returns {number} Sum
     */
    sumBy(array, property) {
        return array.reduce((sum, item) => sum + (parseFloat(item[property]) || 0), 0);
    },

    /**
     * Finds item with maximum value for specified property
     * @param {Array} array - Array to search
     * @param {string} property - Property to compare
     * @returns {Object|null} Item with maximum value
     */
    maxBy(array, property) {
        if (array.length === 0) return null;
        
        return array.reduce((max, item) => {
            return (parseFloat(item[property]) || 0) > (parseFloat(max[property]) || 0) ? item : max;
        });
    }
};

// Alert and notification utilities
const AlertUtils = {
    /**
     * Creates alert element
     * @param {string} type - Alert type (success, warning, error, info)
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
    },

    /**
     * Shows alert in specified container
     * @param {string} containerId - Container element ID
     * @param {string} type - Alert type
     * @param {string} title - Alert title
     * @param {string} message - Alert message
     */
    showAlert(containerId, type, title, message) {
        const container = DOMUtils.getElementById(containerId);
        if (container) {
            const alert = this.createAlert(type, title, message);
            container.appendChild(alert);
            
            // Auto-remove after 5 seconds for non-error alerts
            if (type !== 'error') {
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.parentNode.removeChild(alert);
                    }
                }, 5000);
            }
        }
    },

    /**
     * Clears all alerts from container
     * @param {string} containerId - Container element ID
     */
    clearAlerts(containerId) {
        const container = DOMUtils.getElementById(containerId);
        if (container) {
            const alerts = container.querySelectorAll('.alert');
            alerts.forEach(alert => alert.remove());
        }
    }
};

// Export utilities for use in other scripts
window.CommonUtils = {
    ValidationUtils,
    CalculationUtils,
    DOMUtils,
    FormUtils,
    EventUtils,
    DataUtils,
    AlertUtils
};