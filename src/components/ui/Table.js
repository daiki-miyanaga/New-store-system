/**
 * Table Component - 高機能テーブルコンポーネント
 * MOCアーキテクチャの基本UIコンポーネント
 */
class Table {
    constructor(options = {}) {
        this.columns = options.columns || [];
        this.data = options.data || [];
        this.editable = options.editable || false;
        this.sortable = options.sortable || false;
        this.selectable = options.selectable || false;
        this.pagination = options.pagination || null;
        this.className = options.className || '';
        this.id = options.id || `table-${Date.now()}`;
        this.onRowUpdate = options.onRowUpdate || null;
        this.onRowDelete = options.onRowDelete || null;
        this.onRowAdd = options.onRowAdd || null;
        this.validators = options.validators || {};
        
        // 内部状態
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.selectedRows = new Set();
        this.currentPage = 1;
        this.pageSize = options.pageSize || 10;
    }

    /**
     * テーブルのHTML構造を生成
     * @returns {string} HTML文字列
     */
    render() {
        const paginatedData = this.getPaginatedData();
        
        return `
            <div id="${this.id}" class="table-container ${this.className}">
                ${this.renderControls()}
                <div class="table-wrapper">
                    <table class="data-table">
                        ${this.renderHeader()}
                        ${this.renderBody(paginatedData)}
                        ${this.renderFooter()}
                    </table>
                </div>
                ${this.renderPagination()}
            </div>
        `;
    }

    /**
     * テーブルコントロールを生成
     * @returns {string} HTML文字列
     */
    renderControls() {
        if (!this.editable) return '';
        
        return `
            <div class="table-controls">
                <button class="btn btn-primary" onclick="window.table_${this.id}.addRow()">
                    ➕ 行追加
                </button>
                <button class="btn btn-secondary" onclick="window.table_${this.id}.exportCSV()">
                    💾 CSV出力
                </button>
                ${this.selectable ? `
                    <button class="btn btn-danger" onclick="window.table_${this.id}.deleteSelected()">
                        🗑️ 選択削除
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * テーブルヘッダーを生成
     * @returns {string} HTML文字列
     */
    renderHeader() {
        const selectAllHeader = this.selectable ? 
            `<th><input type="checkbox" onchange="window.table_${this.id}.selectAll(this.checked)"></th>` : '';
        
        const columnHeaders = this.columns.map(col => {
            const sortClass = this.sortColumn === col.key ? `sorted-${this.sortDirection}` : '';
            const sortable = this.sortable && col.sortable !== false;
            const onclick = sortable ? `onclick="window.table_${this.id}.sort('${col.key}')"` : '';
            
            return `
                <th class="column-${col.key} ${sortClass}" ${onclick}>
                    ${col.label}
                    ${sortable ? '<span class="sort-indicator">⇅</span>' : ''}
                </th>
            `;
        }).join('');

        const actionsHeader = this.editable ? '<th class="actions-column">操作</th>' : '';

        return `
            <thead>
                <tr>
                    ${selectAllHeader}
                    ${columnHeaders}
                    ${actionsHeader}
                </tr>
            </thead>
        `;
    }

    /**
     * テーブルボディを生成
     * @param {Array} data - 表示データ
     * @returns {string} HTML文字列
     */
    renderBody(data) {
        if (data.length === 0) {
            const colSpan = this.columns.length + (this.selectable ? 1 : 0) + (this.editable ? 1 : 0);
            return `
                <tbody>
                    <tr>
                        <td colspan="${colSpan}" class="no-data">データがありません</td>
                    </tr>
                </tbody>
            `;
        }

        const rows = data.map((row, index) => this.renderRow(row, index)).join('');
        
        return `<tbody>${rows}</tbody>`;
    }

    /**
     * データ行を生成
     * @param {Object} row - 行データ
     * @param {number} index - 行インデックス
     * @returns {string} HTML文字列
     */
    renderRow(row, index) {
        const rowId = row.id || index;
        const selectCell = this.selectable ? 
            `<td><input type="checkbox" value="${rowId}" onchange="window.table_${this.id}.selectRow('${rowId}', this.checked)"></td>` : '';
        
        const dataCells = this.columns.map(col => {
            const value = row[col.key];
            const displayValue = this.formatCellValue(value, col);
            const editable = this.editable && col.editable !== false;
            const validator = this.validators[col.key];
            
            if (editable) {
                const inputType = col.type || 'text';
                return `
                    <td class="column-${col.key}">
                        <input type="${inputType}" 
                               value="${value || ''}" 
                               data-row="${rowId}" 
                               data-col="${col.key}"
                               onchange="window.table_${this.id}.updateCell(this)"
                               onblur="window.table_${this.id}.validateCell(this)"
                               ${col.required ? 'required' : ''}
                               ${col.min ? `min="${col.min}"` : ''}
                               ${col.max ? `max="${col.max}"` : ''}>
                        <div class="validation-error" style="display:none;"></div>
                    </td>
                `;
            } else {
                return `<td class="column-${col.key}">${displayValue}</td>`;
            }
        }).join('');

        const actionsCell = this.editable ? `
            <td class="actions-column">
                <button class="btn-icon btn-edit" onclick="window.table_${this.id}.editRow('${rowId}')" title="編集">✏️</button>
                <button class="btn-icon btn-delete" onclick="window.table_${this.id}.deleteRow('${rowId}')" title="削除">🗑️</button>
            </td>
        ` : '';

        return `
            <tr data-row-id="${rowId}" class="${this.selectedRows.has(rowId) ? 'selected' : ''}">
                ${selectCell}
                ${dataCells}
                ${actionsCell}
            </tr>
        `;
    }

    /**
     * テーブルフッターを生成
     * @returns {string} HTML文字列
     */
    renderFooter() {
        if (!this.columns.some(col => col.footer)) return '';
        
        const footerCells = this.columns.map(col => {
            if (col.footer === 'sum') {
                const sum = this.data.reduce((total, row) => total + (parseFloat(row[col.key]) || 0), 0);
                return `<td class="footer-sum">${this.formatCellValue(sum, col)}</td>`;
            } else if (col.footer === 'avg') {
                const avg = this.data.reduce((total, row) => total + (parseFloat(row[col.key]) || 0), 0) / this.data.length;
                return `<td class="footer-avg">${this.formatCellValue(avg, col)}</td>`;
            } else if (typeof col.footer === 'function') {
                return `<td>${col.footer(this.data)}</td>`;
            }
            return '<td></td>';
        }).join('');

        const selectFooter = this.selectable ? '<td></td>' : '';
        const actionsFooter = this.editable ? '<td></td>' : '';

        return `
            <tfoot>
                <tr class="footer-row">
                    ${selectFooter}
                    ${footerCells}
                    ${actionsFooter}
                </tr>
            </tfoot>
        `;
    }

    /**
     * ページネーション部分を生成
     * @returns {string} HTML文字列
     */
    renderPagination() {
        if (!this.pagination) return '';
        
        const totalPages = Math.ceil(this.data.length / this.pageSize);
        if (totalPages <= 1) return '';

        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(`
                <button class="page-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="window.table_${this.id}.goToPage(${i})">
                    ${i}
                </button>
            `);
        }

        return `
            <div class="pagination">
                <button class="page-btn" onclick="window.table_${this.id}.goToPage(${this.currentPage - 1})" 
                        ${this.currentPage === 1 ? 'disabled' : ''}>
                    ← 前
                </button>
                ${pages.join('')}
                <button class="page-btn" onclick="window.table_${this.id}.goToPage(${this.currentPage + 1})" 
                        ${this.currentPage === totalPages ? 'disabled' : ''}>
                    次 →
                </button>
            </div>
        `;
    }

    /**
     * セル値のフォーマット
     * @param {any} value - セル値
     * @param {Object} column - カラム定義
     * @returns {string} フォーマットされた値
     */
    formatCellValue(value, column) {
        if (value === null || value === undefined) return '';
        
        switch (column.type) {
            case 'currency':
                return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(value);
            case 'number':
                return new Intl.NumberFormat('ja-JP').format(value);
            case 'date':
                return new Date(value).toLocaleDateString('ja-JP');
            case 'time':
                return value; // HH:MM format
            default:
                return value.toString();
        }
    }

    /**
     * ページ分割されたデータを取得
     * @returns {Array} ページ分割されたデータ
     */
    getPaginatedData() {
        if (!this.pagination) return this.data;
        
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        return this.data.slice(startIndex, endIndex);
    }

    // ========== パブリックメソッド ==========

    /**
     * DOM要素に挿入
     * @param {string|HTMLElement} target - 挿入先
     */
    mount(target) {
        const container = typeof target === 'string' ? document.querySelector(target) : target;
        if (container) {
            container.innerHTML = this.render();
            this.element = container.querySelector(`#${this.id}`);
            
            // グローバル参照を設定
            window[`table_${this.id}`] = this;
            
            this.attachEventListeners();
        }
        return this.element;
    }

    /**
     * イベントリスナーを設定
     */
    attachEventListeners() {
        // 必要に応じて追加のイベントリスナーを設定
    }

    /**
     * ソート実行
     * @param {string} columnKey - ソート対象カラム
     */
    sort(columnKey) {
        if (this.sortColumn === columnKey) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = columnKey;
            this.sortDirection = 'asc';
        }

        this.data.sort((a, b) => {
            const aVal = a[columnKey];
            const bVal = b[columnKey];
            const modifier = this.sortDirection === 'asc' ? 1 : -1;

            if (aVal < bVal) return -1 * modifier;
            if (aVal > bVal) return 1 * modifier;
            return 0;
        });

        this.refresh();
    }

    /**
     * 行を追加
     */
    addRow() {
        const newRow = {};
        this.columns.forEach(col => {
            newRow[col.key] = col.defaultValue || '';
        });
        newRow.id = Date.now();
        
        this.data.push(newRow);
        this.refresh();
        
        if (this.onRowAdd) {
            this.onRowAdd(newRow);
        }
    }

    /**
     * 行を削除
     * @param {string} rowId - 行ID
     */
    deleteRow(rowId) {
        const index = this.data.findIndex(row => row.id === rowId);
        if (index !== -1) {
            const deletedRow = this.data.splice(index, 1)[0];
            this.refresh();
            
            if (this.onRowDelete) {
                this.onRowDelete(deletedRow);
            }
        }
    }

    /**
     * セルを更新
     * @param {HTMLElement} input - 入力要素
     */
    updateCell(input) {
        const rowId = input.dataset.row;
        const colKey = input.dataset.col;
        const value = input.value;
        
        const row = this.data.find(row => row.id == rowId);
        if (row) {
            row[colKey] = value;
            
            if (this.onRowUpdate) {
                this.onRowUpdate(row, colKey, value);
            }
        }
    }

    /**
     * セルをバリデーション
     * @param {HTMLElement} input - 入力要素
     */
    validateCell(input) {
        const colKey = input.dataset.col;
        const validator = this.validators[colKey];
        const errorDiv = input.nextElementSibling;
        
        if (validator) {
            const result = validator(input.value);
            if (result.valid) {
                input.classList.remove('error');
                errorDiv.style.display = 'none';
            } else {
                input.classList.add('error');
                errorDiv.textContent = result.message;
                errorDiv.style.display = 'block';
            }
        }
    }

    /**
     * 全行選択/解除
     * @param {boolean} checked - 選択状態
     */
    selectAll(checked) {
        if (checked) {
            this.data.forEach(row => this.selectedRows.add(row.id));
        } else {
            this.selectedRows.clear();
        }
        this.refresh();
    }

    /**
     * 行の選択状態を変更
     * @param {string} rowId - 行ID
     * @param {boolean} checked - 選択状態
     */
    selectRow(rowId, checked) {
        if (checked) {
            this.selectedRows.add(rowId);
        } else {
            this.selectedRows.delete(rowId);
        }
        
        // 該当行の表示を更新
        const row = this.element.querySelector(`tr[data-row-id="${rowId}"]`);
        if (row) {
            row.classList.toggle('selected', checked);
        }
    }

    /**
     * 選択された行を削除
     */
    deleteSelected() {
        if (this.selectedRows.size === 0) return;
        
        if (confirm(`${this.selectedRows.size}行を削除しますか？`)) {
            this.data = this.data.filter(row => !this.selectedRows.has(row.id));
            this.selectedRows.clear();
            this.refresh();
        }
    }

    /**
     * ページ移動
     * @param {number} page - ページ番号
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.data.length / this.pageSize);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.refresh();
    }

    /**
     * CSV出力
     */
    exportCSV() {
        const headers = this.columns.map(col => col.label).join(',');
        const rows = this.data.map(row => 
            this.columns.map(col => `"${row[col.key] || ''}"`).join(',')
        ).join('\n');
        
        const csv = headers + '\n' + rows;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `table_${this.id}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * テーブルを再描画
     */
    refresh() {
        if (this.element) {
            const container = this.element.parentNode;
            container.innerHTML = this.render();
            this.element = container.querySelector(`#${this.id}`);
        }
    }

    /**
     * データを更新
     * @param {Array} newData - 新しいデータ
     */
    updateData(newData) {
        this.data = newData;
        this.selectedRows.clear();
        this.currentPage = 1;
        this.refresh();
    }

    /**
     * 破棄
     */
    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        delete window[`table_${this.id}`];
    }
}

// ES6モジュールエクスポート対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Table;
}

// グローバルスコープでも利用可能
if (typeof window !== 'undefined') {
    window.Table = Table;
}