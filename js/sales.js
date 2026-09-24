/* =========================================================
   OR SHOPEE MANAGER — Vendas
   ========================================================= */

const Sales = (() => {

    let filters = {
        search: '',
        platform: ''
    };

    // =========================================================
    // HELPERS
    // =========================================================
    function buildProductOptions(selectedId = '') {
        const products = Storage.getAll(Storage.KEYS.products);
        if (products.length === 0) {
            return `<option value="">Nenhum produto cadastrado</option>`;
        }
        return `<option value="">Selecione...</option>` +
            products
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                .map(p => `<option value="${p.id}" ${selectedId === p.id ? 'selected' : ''}>${Utils.escapeHTML(p.name)}</option>`)
                .join('');
    }

    function buildCustomerOptions(selectedId = '') {
        const customers = Storage.getAll(Storage.KEYS.customers);
        if (customers.length === 0) {
            return `<option value="">Nenhum cliente cadastrado</option>`;
        }
        return `<option value="">Nenhum</option>` +
            customers
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                .map(c => `<option value="${c.id}" ${selectedId === c.id ? 'selected' : ''}>${Utils.escapeHTML(c.name)}</option>`)
                .join('');
    }

    function buildPlatformOptions(selected = 'shopee') {
        return Object.entries(Utils.PLATFORMS)
            .map(([key, val]) => `<option value="${key}" ${selected === key ? 'selected' : ''}>${val.label}</option>`)
            .join('');
    }

    // =========================================================
    // RENDER
    // =========================================================
    function render() {
        const tbody = document.getElementById('tbl-sales');
        const empty = document.getElementById('sales-empty');
        if (!tbody) return;

        let sales = Storage.getAll(Storage.KEYS.sales);

        // Filtros
        const search = filters.search.toLowerCase().trim();
        sales = sales.filter(s => {
            if (search) {
                const text = `${s.productName || ''} ${s.customerName || ''}`.toLowerCase();
                if (!text.includes(search)) return false;
            }
            if (filters.platform && s.platform !== filters.platform) return false;
            return true;
        });

        // Ordena por data (mais recente primeiro)
        sales.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

        tbody.innerHTML = '';

        if (sales.length === 0) {
            empty.classList.remove('hidden');
            const msg = empty.querySelector('h3');
            if (msg) {
                msg.textContent = Storage.count(Storage.KEYS.sales) === 0
                    ? 'Você ainda não registrou vendas'
                    : 'Nenhuma venda encontrada com esses filtros';
            }
            return;
        }
        empty.classList.add('hidden');

        sales.forEach(s => {
            const platform = Utils.getPlatformInfo(s.platform);
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${Utils.formatDate(s.date || s.createdAt)}</td>
                <td>
                    <strong>${Utils.escapeHTML(s.productName || '—')}</strong>
                    ${s.customerName ? `<br><small style="color:var(--texto-terciario);font-size:11px;"><i class="fas fa-user"></i> ${Utils.escapeHTML(s.customerName)}</small>` : ''}
                </td>
                <td>${Utils.formatNumber(s.quantity)}</td>
                <td><strong>${Utils.formatCurrency(s.saleValue)}</strong></td>
                <td class="text-success"><strong>${Utils.formatCurrency(s.commissionValue)}</strong></td>
                <td>
                    <span class="status-badge info">
                        <i class="fab ${platform.icon}"></i> ${platform.label}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn-icon" title="Editar" data-action="edit" data-id="${s.id}">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-icon danger" title="Excluir" data-action="delete" data-id="${s.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        bindRowActions();
        updateKPIs();
    }

    function bindRowActions() {
        document.querySelectorAll('#tbl-sales [data-action]').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const action = btn.dataset.action;

                if (action === 'edit') openForm(id);
                else if (action === 'delete') confirmDelete(id);
            };
        });
    }

    // =========================================================
    // KPIs
    // =========================================================
    function updateKPIs() {
        const sales = Storage.getAll(Storage.KEYS.sales);

        const count = sales.length;
        const revenue = sales.reduce((sum, s) => sum + (Number(s.saleValue) || 0), 0);
        const commission = sales.reduce((sum, s) => sum + (Number(s.commissionValue) || 0), 0);
        const ticket = count > 0 ? revenue / count : 0;

        setText('sales-kpi-count', Utils.formatNumber(count));
        setText('sales-kpi-revenue', Utils.formatCurrency(revenue));
        setText('sales-kpi-commission', Utils.formatCurrency(commission));
        setText('sales-kpi-ticket', Utils.formatCurrency(ticket));
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    // =========================================================
    // FORMULÁRIO
    // =========================================================
    function openForm(id = null) {
        let sale = {
            id: null,
            date: Utils.todayISO(),
            productId: '',
            productName: '',
            quantity: 1,
            saleValue: 0,
            commissionPercent: 0,
            commissionValue: 0,
            platform: 'shopee',
            customerId: '',
            customerName: '',
            notes: ''
        };

        if (id) {
            const found = Storage.getById(Storage.KEYS.sales, id);
            if (!found) {
                Utils.toast('Venda não encontrada.', 'error');
                return;
            }
            sale = { ...sale, ...found };
            // Formata data para input date
            if (sale.date) {
                const d = new Date(sale.date);
                if (!isNaN(d.getTime())) {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    sale.date = `${year}-${month}-${day}`;
                }
            }
        }

        const isEdit = !!id;

        const bodyHTML = `
            <form id="form-sale" class="form-grid">
                <div class="form-group">
                    <label><i class="fas fa-calendar"></i> Data *</label>
                    <input type="date" id="sale-date" value="${sale.date}" required>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-share-nodes"></i> Plataforma *</label>
                    <select id="sale-platform" required>
                        ${buildPlatformOptions(sale.platform)}
                    </select>
                </div>

                <div class="form-group full">
                    <label><i class="fas fa-box"></i> Produto *</label>
                    <select id="sale-product" required>
                        ${buildProductOptions(sale.productId)}
                    </select>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-hashtag"></i> Quantidade *</label>
                    <input type="number" id="sale-quantity" value="${sale.quantity}" min="1" step="1" required>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-dollar-sign"></i> Valor Total (R$) *</label>
                    <input type="number" id="sale-value" value="${sale.saleValue}" min="0" step="0.01" required>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-percent"></i> Comissão (%)</label>
                    <input type="number" id="sale-commission-percent" value="${sale.commissionPercent}" min="0" max="100" step="0.01">
                </div>

                <div class="form-group">
                    <label><i class="fas fa-hand-holding-dollar"></i> Comissão (R$) — Calculada</label>
                    <input type="text" id="sale-commission-value" value="${Utils.formatCurrency(sale.commissionValue)}" readonly style="opacity:0.7;">
                </div>

                <div class="form-group full">
                    <label><i class="fas fa-user"></i> Cliente</label>
                    <select id="sale-customer">
                        ${buildCustomerOptions(sale.customerId)}
                    </select>
                </div>

                <div class="form-group full">
                    <label><i class="fas fa-align-left"></i> Observações</label>
                    <textarea id="sale-notes" rows="3" placeholder="Anotações sobre a venda...">${Utils.escapeHTML(sale.notes || '')}</textarea>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-close-modal>Cancelar</button>
            <button type="button" class="btn btn-primary" id="btn-save-sale">
                <i class="fas fa-save"></i> ${isEdit ? 'Salvar Alterações' : 'Registrar Venda'}
            </button>
        `;

        Utils.openModal({
            title: isEdit ? 'Editar Venda' : 'Nova Venda',
            body: bodyHTML,
            footer: footerHTML,
            size: 'lg',
            onOpen: () => {
                const productSelect = document.getElementById('sale-product');
                const quantityInput = document.getElementById('sale-quantity');
                const valueInput = document.getElementById('sale-value');
                const percentInput = document.getElementById('sale-commission-percent');
                const commissionValueInput = document.getElementById('sale-commission-value');

                const recalcCommission = () => {
                    const value = parseFloat(valueInput.value) || 0;
                    const pct = parseFloat(percentInput.value) || 0;
                    commissionValueInput.value = Utils.formatCurrency(value * pct / 100);
                };

                // Ao mudar produto, auto-preenche % de comissão
                productSelect.addEventListener('change', () => {
                    const pid = productSelect.value;
                    if (!pid) return;
                    const p = Storage.getById(Storage.KEYS.products, pid);
                    if (p) {
                        percentInput.value = p.commissionPercent || 0;
                        // Se o valor ainda não foi preenchido, sugere valor do produto * qtd
                        if (!valueInput.value || parseFloat(valueInput.value) === 0) {
                            const qty = parseInt(quantityInput.value) || 1;
                            valueInput.value = ((Number(p.price) || 0) * qty).toFixed(2);
                        }
                        recalcCommission();
                    }
                });

                quantityInput.addEventListener('input', recalcCommission);
                valueInput.addEventListener('input', recalcCommission);
                percentInput.addEventListener('input', recalcCommission);

                document.getElementById('btn-save-sale').onclick = () => save(id);
            }
        });
    }

    // =========================================================
    // SALVAR
    // =========================================================
    function save(id = null) {
        try {
            const date = document.getElementById('sale-date').value;
            const platform = document.getElementById('sale-platform').value;
            const productId = document.getElementById('sale-product').value;
            const quantity = parseInt(document.getElementById('sale-quantity').value) || 1;
            const saleValue = parseFloat(document.getElementById('sale-value').value) || 0;
            const commissionPercent = parseFloat(document.getElementById('sale-commission-percent').value) || 0;
            const customerId = document.getElementById('sale-customer').value;
            const notes = Utils.sanitizeText(document.getElementById('sale-notes').value);

            // Validações
            if (!date) throw new Error('Informe a data.');
            if (!platform) throw new Error('Selecione a plataforma.');
            if (!productId) throw new Error('Selecione um produto.');
            if (quantity <= 0) throw new Error('Quantidade deve ser maior que zero.');
            if (saleValue < 0) throw new Error('Valor inválido.');
            if (commissionPercent < 0 || commissionPercent > 100) throw new Error('Comissão deve estar entre 0 e 100.');

            const product = Storage.getById(Storage.KEYS.products, productId);
            const productName = product ? product.name : '';

            const customer = customerId ? Storage.getById(Storage.KEYS.customers, customerId) : null;
            const customerName = customer ? customer.name : '';

            const commissionValue = saleValue * commissionPercent / 100;

            // Converte data para ISO no meio-dia para evitar problema de fuso
            const isoDate = new Date(date + 'T12:00:00').toISOString();

            const data = {
                date: isoDate,
                platform,
                productId,
                productName,
                quantity,
                saleValue,
                commissionPercent,
                commissionValue,
                customerId: customerId || null,
                customerName,
                notes
            };

            if (id) {
                Storage.update(Storage.KEYS.sales, id, data);
                Utils.toast('Venda atualizada com sucesso!', 'success');
            } else {
                const sale = Storage.add(Storage.KEYS.sales, data);
                Utils.toast('Venda registrada com sucesso!', 'success');

                // Se tem cliente, atualiza informações dele
                if (customer) {
                    Storage.update(Storage.KEYS.customers, customer.id, {
                        lastProductId: productId,
                        lastProductName: productName,
                        lastPurchaseDate: isoDate,
                        lastValue: saleValue,
                        purchaseCount: (customer.purchaseCount || 0) + 1
                    });
                }
            }

            Utils.closeModal();
            render();
            Dashboard.refresh();
            if (typeof Commissions !== 'undefined' && Commissions.render) Commissions.render();
            if (typeof Customers !== 'undefined' && Customers.render) Customers.render();
            if (typeof Analytics !== 'undefined' && Analytics.render) Analytics.render();

        } catch (err) {
            console.error(err);
            Utils.toast(err.message || 'Erro ao registrar venda.', 'error');
        }
    }

    // =========================================================
    // EXCLUIR
    // =========================================================
    async function confirmDelete(id) {
        const sale = Storage.getById(Storage.KEYS.sales, id);
        if (!sale) return;

        const ok = await Utils.confirm({
            title: 'Excluir Venda',
            message: `Deseja realmente excluir a venda de "${sale.productName}" no valor de ${Utils.formatCurrency(sale.saleValue)}?\n\nEsta ação NÃO pode ser desfeita.`,
            confirmText: 'Excluir',
            danger: true
        });

        if (!ok) return;

        Storage.remove(Storage.KEYS.sales, id);
        Utils.toast('Venda excluída com sucesso!', 'success');
        render();
        Dashboard.refresh();
        if (typeof Commissions !== 'undefined' && Commissions.render) Commissions.render();
        if (typeof Analytics !== 'undefined' && Analytics.render) Analytics.render();
    }

    // =========================================================
    // EXPORTAR CSV
    // =========================================================
    function exportCSV() {
        const sales = Storage.getAll(Storage.KEYS.sales);

        if (sales.length === 0) {
            Utils.toast('Não há vendas para exportar.', 'warning');
            return;
        }

        const columns = [
            { label: 'Data', value: s => Utils.formatDate(s.date || s.createdAt) },
            { label: 'Produto', key: 'productName' },
            { label: 'Quantidade', key: 'quantity' },
            { label: 'Valor Venda', value: s => (Number(s.saleValue) || 0).toFixed(2) },
            { label: 'Comissão (%)', key: 'commissionPercent' },
            { label: 'Comissão (R$)', value: s => (Number(s.commissionValue) || 0).toFixed(2) },
            { label: 'Plataforma', value: s => Utils.getPlatformLabel(s.platform) },
            { label: 'Cliente', key: 'customerName' },
            { label: 'Observações', key: 'notes' }
        ];

        const csv = Utils.toCSV(sales, columns);
        Utils.downloadFile(csv, `or-shopee-vendas-${Utils.todayISO()}.csv`, 'text/csv;charset=utf-8');
        Utils.toast('CSV exportado com sucesso!', 'success');
    }

    // =========================================================
    // FILTROS
    // =========================================================
    function bindFilters() {
        const search = document.getElementById('sales-search');
        const platformFilter = document.getElementById('sales-filter-platform');

        if (search) {
            search.addEventListener('input', Utils.debounce(() => {
                filters.search = search.value;
                render();
            }, 200));
        }

        if (platformFilter) {
            platformFilter.addEventListener('change', () => {
                filters.platform = platformFilter.value;
                render();
            });
        }
    }

    // =========================================================
    // INIT
    // =========================================================
    function init() {
        document.getElementById('btn-new-sale')?.addEventListener('click', () => openForm());
        document.getElementById('btn-export-sales')?.addEventListener('click', exportCSV);
        bindFilters();
    }

    // =========================================================
    // EXPORT
    // =========================================================
    return {
        init,
        render,
        openForm,
        exportCSV
    };
})();