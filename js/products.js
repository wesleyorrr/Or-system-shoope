/* =========================================================
   OR SHOPEE MANAGER — Produtos (CRUD completo)
   ========================================================= */

const Products = (() => {

    let filters = {
        search: '',
        category: '',
        status: ''
    };

    // =========================================================
    // HELPERS
    // =========================================================
    function getStatusInfo(status) {
        return Utils.PRODUCT_STATUS[status] || Utils.PRODUCT_STATUS.ativo;
    }

    function buildCategoryOptions(selected = '') {
        return Utils.CATEGORIES
            .map(c => `<option value="${c}" ${selected === c ? 'selected' : ''}>${c}</option>`)
            .join('');
    }

    function buildStatusOptions(selected = 'ativo') {
        return Object.entries(Utils.PRODUCT_STATUS)
            .map(([key, val]) => `<option value="${key}" ${selected === key ? 'selected' : ''}>${val.label}</option>`)
            .join('');
    }

    // =========================================================
    // RENDER
    // =========================================================
    function render() {
        const tbody = document.getElementById('tbl-products');
        const empty = document.getElementById('products-empty');
        if (!tbody) return;

        let products = Storage.getAll(Storage.KEYS.products);

        // Filtros
        const search = filters.search.toLowerCase().trim();
        products = products.filter(p => {
            if (search) {
                const text = `${p.name || ''} ${p.store || ''} ${p.category || ''}`.toLowerCase();
                if (!text.includes(search)) return false;
            }
            if (filters.category && p.category !== filters.category) return false;
            if (filters.status && p.status !== filters.status) return false;
            return true;
        });

        // Ordena por nome
        products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        tbody.innerHTML = '';

        if (products.length === 0) {
            empty.classList.remove('hidden');
            // Ajusta a mensagem se está filtrando
            const msg = empty.querySelector('h3');
            if (msg) {
                msg.textContent = Storage.count(Storage.KEYS.products) === 0
                    ? 'Você ainda não possui produtos cadastrados'
                    : 'Nenhum produto encontrado com esses filtros';
            }
            return;
        }
        empty.classList.add('hidden');

        products.forEach(p => {
            const statusInfo = getStatusInfo(p.status);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong>${Utils.escapeHTML(p.name)}</strong>
                    ${p.notes ? `<br><small style="color:var(--texto-terciario);font-size:11.5px;">${Utils.escapeHTML(p.notes.slice(0, 50))}${p.notes.length > 50 ? '...' : ''}</small>` : ''}
                </td>
                <td>${Utils.escapeHTML(p.category || '—')}</td>
                <td>${Utils.escapeHTML(p.store || '—')}</td>
                <td>${Utils.formatCurrency(p.price)}</td>
                <td>${p.commissionPercent ? `${p.commissionPercent}%` : '—'}</td>
                <td><span class="status-badge ${statusInfo.class}">${statusInfo.label}</span></td>
                <td class="actions">
                    <button class="btn-icon" title="Editar" data-action="edit" data-id="${p.id}">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-icon" title="Ver link" data-action="link" data-id="${p.id}">
                        <i class="fas fa-link"></i>
                    </button>
                    <button class="btn-icon danger" title="Excluir" data-action="delete" data-id="${p.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        bindRowActions();
    }

    function bindRowActions() {
        document.querySelectorAll('#tbl-products [data-action]').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const action = btn.dataset.action;

                if (action === 'edit') openForm(id);
                else if (action === 'delete') confirmDelete(id);
                else if (action === 'link') {
                    const p = Storage.getById(Storage.KEYS.products, id);
                    if (p && p.affiliateUrl) {
                        copyToClipboard(p.affiliateUrl);
                    } else {
                        Utils.toast('Este produto não possui link de afiliado cadastrado.', 'warning');
                    }
                }
            };
        });
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            Utils.toast('Link copiado para a área de transferência!', 'success', 'Copiado');
        } catch {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            Utils.toast('Link copiado!', 'success', 'Copiado');
        }
    }

    // =========================================================
    // FORMULÁRIO
    // =========================================================
    function openForm(id = null) {
        let product = {
            id: null,
            name: '',
            category: '',
            store: '',
            price: 0,
            shopeeUrl: '',
            affiliateUrl: '',
            commissionPercent: 0,
            status: 'ativo',
            notes: ''
        };

        if (id) {
            const found = Storage.getById(Storage.KEYS.products, id);
            if (!found) {
                Utils.toast('Produto não encontrado.', 'error');
                return;
            }
            product = { ...product, ...found };
        }

        const isEdit = !!id;

        const bodyHTML = `
            <form id="form-product" class="form-grid">
                <div class="form-group full">
                    <label><i class="fas fa-tag"></i> Nome do Produto *</label>
                    <input type="text" id="prod-name" value="${Utils.escapeHTML(product.name)}" required autocomplete="off">
                </div>

                <div class="form-group">
                    <label><i class="fas fa-folder"></i> Categoria *</label>
                    <select id="prod-category" required>
                        <option value="">Selecione...</option>
                        ${buildCategoryOptions(product.category)}
                    </select>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-store"></i> Loja</label>
                    <input type="text" id="prod-store" value="${Utils.escapeHTML(product.store || '')}" placeholder="Ex: TechStore BR">
                </div>

                <div class="form-group">
                    <label><i class="fas fa-dollar-sign"></i> Preço (R$)</label>
                    <input type="number" id="prod-price" value="${product.price || 0}" min="0" step="0.01">
                </div>

                <div class="form-group">
                    <label><i class="fas fa-percent"></i> Comissão (%)</label>
                    <input type="number" id="prod-commission" value="${product.commissionPercent || 0}" min="0" max="100" step="0.01">
                </div>

                <div class="form-group full">
                    <label><i class="fas fa-link"></i> Link da Shopee (produto original)</label>
                    <input type="url" id="prod-shopee-url" value="${Utils.escapeHTML(product.shopeeUrl || '')}" placeholder="https://shopee.com.br/product/...">
                </div>

                <div class="form-group full">
                    <label><i class="fas fa-share-nodes"></i> Link de Afiliado</label>
                    <input type="url" id="prod-affiliate-url" value="${Utils.escapeHTML(product.affiliateUrl || '')}" placeholder="https://s.shopee.com.br/...">
                </div>

                <div class="form-group">
                    <label><i class="fas fa-circle-info"></i> Status</label>
                    <select id="prod-status">
                        ${buildStatusOptions(product.status)}
                    </select>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-eye"></i> Comissão Estimada (calculada)</label>
                    <input type="text" id="prod-estimated" value="${Utils.formatCurrency(product.estimatedCommission || 0)}" readonly style="opacity:0.7;">
                </div>

                <div class="form-group full">
                    <label><i class="fas fa-align-left"></i> Observações</label>
                    <textarea id="prod-notes" rows="3" placeholder="Anotações sobre o produto...">${Utils.escapeHTML(product.notes || '')}</textarea>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-close-modal>Cancelar</button>
            <button type="button" class="btn btn-primary" id="btn-save-product">
                <i class="fas fa-save"></i> ${isEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </button>
        `;

        Utils.openModal({
            title: isEdit ? 'Editar Produto' : 'Novo Produto',
            body: bodyHTML,
            footer: footerHTML,
            size: 'lg',
            onOpen: () => {
                // Atualiza comissão estimada ao digitar preço ou %
                const priceInput = document.getElementById('prod-price');
                const commissionInput = document.getElementById('prod-commission');
                const estimatedInput = document.getElementById('prod-estimated');

                const updateEstimated = () => {
                    const price = parseFloat(priceInput.value) || 0;
                    const pct = parseFloat(commissionInput.value) || 0;
                    estimatedInput.value = Utils.formatCurrency(price * pct / 100);
                };

                priceInput.addEventListener('input', updateEstimated);
                commissionInput.addEventListener('input', updateEstimated);

                document.getElementById('btn-save-product').onclick = () => save(id);
                document.getElementById('prod-name').focus();
            }
        });
    }

    // =========================================================
    // SALVAR
    // =========================================================
    function save(id = null) {
        try {
            const name = Utils.sanitizeText(document.getElementById('prod-name').value);
            const category = document.getElementById('prod-category').value;
            const store = Utils.sanitizeText(document.getElementById('prod-store').value);
            const price = parseFloat(document.getElementById('prod-price').value) || 0;
            const commissionPercent = parseFloat(document.getElementById('prod-commission').value) || 0;
            const shopeeUrl = Utils.sanitizeText(document.getElementById('prod-shopee-url').value);
            const affiliateUrl = Utils.sanitizeText(document.getElementById('prod-affiliate-url').value);
            const status = document.getElementById('prod-status').value;
            const notes = Utils.sanitizeText(document.getElementById('prod-notes').value);

            // Validações
            if (!name) throw new Error('Informe o nome do produto.');
            if (!category) throw new Error('Selecione uma categoria.');
            if (price < 0) throw new Error('Preço inválido.');
            if (commissionPercent < 0 || commissionPercent > 100) throw new Error('Comissão deve estar entre 0 e 100.');
            if (shopeeUrl && !Utils.isValidUrl(shopeeUrl)) throw new Error('URL da Shopee inválida.');
            if (affiliateUrl && !Utils.isValidUrl(affiliateUrl)) throw new Error('URL de afiliado inválida.');

            const estimatedCommission = price * commissionPercent / 100;

            const data = {
                name,
                category,
                store,
                price,
                commissionPercent,
                estimatedCommission,
                shopeeUrl,
                affiliateUrl,
                status,
                notes
            };

            if (id) {
                Storage.update(Storage.KEYS.products, id, data);
                Utils.toast('Produto atualizado com sucesso!', 'success');
            } else {
                Storage.add(Storage.KEYS.products, data);
                Utils.toast('Produto cadastrado com sucesso!', 'success');
            }

            Utils.closeModal();
            render();
            Dashboard.refresh();

        } catch (err) {
            console.error(err);
            Utils.toast(err.message || 'Erro ao salvar produto.', 'error');
        }
    }

    // =========================================================
    // EXCLUIR
    // =========================================================
    async function confirmDelete(id) {
        const product = Storage.getById(Storage.KEYS.products, id);
        if (!product) return;

        const ok = await Utils.confirm({
            title: 'Excluir Produto',
            message: `Deseja realmente excluir "${product.name}"?\n\nEsta ação NÃO pode ser desfeita. Links, conteúdos e vendas vinculados serão desvinculados (não apagados).`,
            confirmText: 'Excluir',
            danger: true
        });

        if (!ok) return;

        Storage.deleteProduct(id);
        Utils.toast('Produto excluído com sucesso!', 'success');
        render();
        Dashboard.refresh();
    }

    // =========================================================
    // EXPORTAR CSV
    // =========================================================
    function exportCSV() {
        const products = Storage.getAll(Storage.KEYS.products);

        if (products.length === 0) {
            Utils.toast('Não há produtos para exportar.', 'warning');
            return;
        }

        const columns = [
            { label: 'Nome', key: 'name' },
            { label: 'Categoria', key: 'category' },
            { label: 'Loja', key: 'store' },
            { label: 'Preço', value: p => (Number(p.price) || 0).toFixed(2) },
            { label: 'Comissão (%)', key: 'commissionPercent' },
            { label: 'Comissão Estimada', value: p => (Number(p.estimatedCommission) || 0).toFixed(2) },
            { label: 'Link Shopee', key: 'shopeeUrl' },
            { label: 'Link Afiliado', key: 'affiliateUrl' },
            { label: 'Status', key: 'status' },
            { label: 'Observações', key: 'notes' }
        ];

        const csv = Utils.toCSV(products, columns);
        Utils.downloadFile(csv, `or-shopee-produtos-${Utils.todayISO()}.csv`, 'text/csv;charset=utf-8');
        Utils.toast('CSV exportado com sucesso!', 'success');
    }

    // =========================================================
    // FILTROS
    // =========================================================
    function bindFilters() {
        const search = document.getElementById('products-search');
        const categoryFilter = document.getElementById('products-filter-category');
        const statusFilter = document.getElementById('products-filter-status');

        // Popular categorias
        if (categoryFilter && categoryFilter.options.length <= 1) {
            Utils.CATEGORIES.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                categoryFilter.appendChild(opt);
            });
        }

        if (search) {
            search.addEventListener('input', Utils.debounce(() => {
                filters.search = search.value;
                render();
            }, 200));
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                filters.category = categoryFilter.value;
                render();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                filters.status = statusFilter.value;
                render();
            });
        }
    }

    // =========================================================
    // INIT
    // =========================================================
    function init() {
        document.getElementById('btn-new-product')?.addEventListener('click', () => openForm());
        document.getElementById('btn-first-product')?.addEventListener('click', () => openForm());
        document.getElementById('btn-export-products')?.addEventListener('click', exportCSV);

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