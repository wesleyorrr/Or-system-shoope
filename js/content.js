/* =========================================================
   OR SHOPEE MANAGER — Conteúdos
   ========================================================= */

const Content = (() => {

    let filters = {
        search: '',
        platform: '',
        status: ''
    };

    // =========================================================
    // HELPERS
    // =========================================================
    function buildProductOptions(selectedId = '', includeEmpty = true) {
        const products = Storage.getAll(Storage.KEYS.products);
        const emptyOpt = includeEmpty ? `<option value="">Nenhum</option>` : `<option value="">Selecione...</option>`;

        if (products.length === 0) return emptyOpt;

        return emptyOpt + products
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            .map(p => `<option value="${p.id}" ${selectedId === p.id ? 'selected' : ''}>${Utils.escapeHTML(p.name)}</option>`)
            .join('');
    }

    function buildPlatformOptions(selected = '') {
        return `<option value="">Selecione...</option>` +
            Object.entries(Utils.PLATFORMS)
                .filter(([key]) => key !== 'shopee') // conteúdo não é na shopee
                .map(([key, val]) => `<option value="${key}" ${selected === key ? 'selected' : ''}>${val.label}</option>`)
                .join('');
    }

    function buildTypeOptions(selected = '') {
        return `<option value="">Selecione...</option>` +
            Utils.CONTENT_TYPES.map(t => `<option value="${t}" ${selected === t ? 'selected' : ''}>${t}</option>`).join('');
    }

    function buildStatusOptions(selected = 'ideia') {
        return Object.entries(Utils.CONTENT_STATUS)
            .map(([key, val]) => `<option value="${key}" ${selected === key ? 'selected' : ''}>${val.label}</option>`)
            .join('');
    }

    function getStatusInfo(status) {
        return Utils.CONTENT_STATUS[status] || Utils.CONTENT_STATUS.ideia;
    }

    function getPlatformInfo(platform) {
        return Utils.getPlatformInfo(platform);
    }

    function calcConversion(content) {
        const c = Number(content.clicks) || 0;
        const s = Number(content.sales) || 0;
        if (c === 0) return 0;
        return (s / c) * 100;
    }

    // =========================================================
    // RENDER
    // =========================================================
    function render() {
        const tbody = document.getElementById('tbl-content');
        const empty = document.getElementById('content-empty');
        if (!tbody) return;

        let contents = Storage.getAll(Storage.KEYS.contents);

        // Filtros
        const search = filters.search.toLowerCase().trim();
        contents = contents.filter(c => {
            if (search) {
                const text = `${c.name || ''} ${c.productName || ''}`.toLowerCase();
                if (!text.includes(search)) return false;
            }
            if (filters.platform && c.platform !== filters.platform) return false;
            if (filters.status && c.status !== filters.status) return false;
            return true;
        });

        // Ordena por data de publicação (mais recente primeiro)
        contents.sort((a, b) => {
            const da = new Date(a.publishDate || a.createdAt);
            const db = new Date(b.publishDate || b.createdAt);
            return db - da;
        });

        tbody.innerHTML = '';

        if (contents.length === 0) {
            empty.classList.remove('hidden');
            const msg = empty.querySelector('h3');
            if (msg) {
                msg.textContent = Storage.count(Storage.KEYS.contents) === 0
                    ? 'Você ainda não possui conteúdos cadastrados'
                    : 'Nenhum conteúdo encontrado com esses filtros';
            }
            return;
        }
        empty.classList.add('hidden');

        contents.forEach(c => {
            const statusInfo = getStatusInfo(c.status);
            const platform = getPlatformInfo(c.platform);
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>
                    <strong>${Utils.escapeHTML(c.name)}</strong>
                    ${c.publishDate ? `<br><small style="color:var(--texto-terciario);font-size:11px;"><i class="fas fa-calendar"></i> ${Utils.formatDateTime(c.publishDate)}</small>` : ''}
                </td>
                <td>${Utils.escapeHTML(c.productName || '—')}</td>
                <td>
                    <span class="status-badge info">
                        <i class="fab ${platform.icon}"></i> ${platform.label}
                    </span>
                </td>
                <td>${Utils.escapeHTML(c.type || '—')}</td>
                <td><span class="status-badge ${statusInfo.class}">${statusInfo.label}</span></td>
                <td>${Utils.formatNumber(c.clicks)}</td>
                <td>${Utils.formatNumber(c.sales)}</td>
                <td class="actions">
                    <button class="btn-icon" title="Editar" data-action="edit" data-id="${c.id}">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-icon danger" title="Excluir" data-action="delete" data-id="${c.id}">
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
        document.querySelectorAll('#tbl-content [data-action]').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const action = btn.dataset.action;

                if (action === 'edit') openForm(id);
                else if (action === 'delete') confirmDelete(id);
            };
        });
    }

    // =========================================================
    // MINI KPIs
    // =========================================================
    function updateKPIs() {
        const contents = Storage.getAll(Storage.KEYS.contents);

        const counts = {
            ideia: 0,
            producao: 0,
            agendado: 0,
            publicado: 0
        };

        contents.forEach(c => {
            if (counts[c.status] !== undefined) counts[c.status]++;
        });

        setText('content-kpi-ideas', counts.ideia);
        setText('content-kpi-producing', counts.producao);
        setText('content-kpi-scheduled', counts.agendado);
        setText('content-kpi-published', counts.publicado);

        // Badge sidebar
        setText('badge-contents', contents.length);
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    // =========================================================
    // FORMULÁRIO
    // =========================================================
    function openForm(id = null) {
        let content = {
            id: null,
            name: '',
            productId: '',
            productName: '',
            platform: 'instagram',
            type: 'Reels',
            status: 'ideia',
            publishDate: '',
            clicks: 0,
            sales: 0,
            commission: 0,
            notes: ''
        };

        if (id) {
            const found = Storage.getById(Storage.KEYS.contents, id);
            if (!found) {
                Utils.toast('Conteúdo não encontrado.', 'error');
                return;
            }
            content = { ...content, ...found };
        }

        const isEdit = !!id;

        // Formata datetime-local
        let publishValue = '';
        if (content.publishDate) {
            const d = new Date(content.publishDate);
            if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                publishValue = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
        }

        const bodyHTML = `
            <form id="form-content" class="form-grid">
                <div class="form-group full">
                    <label><i class="fas fa-video"></i> Nome do Conteúdo *</label>
                    <input type="text" id="cont-name" value="${Utils.escapeHTML(content.name)}" placeholder="Ex: Unboxing Fone TWS - Reels" required autocomplete="off">
                </div>

                <div class="form-group full">
                    <label><i class="fas fa-box"></i> Produto Vinculado</label>
                    <select id="cont-product">
                        ${buildProductOptions(content.productId)}
                    </select>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-share-nodes"></i> Plataforma *</label>
                    <select id="cont-platform" required>
                        ${buildPlatformOptions(content.platform)}
                    </select>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-photo-film"></i> Tipo *</label>
                    <select id="cont-type" required>
                        ${buildTypeOptions(content.type)}
                    </select>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-circle-info"></i> Status</label>
                    <select id="cont-status">
                        ${buildStatusOptions(content.status)}
                    </select>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-calendar"></i> Data de Publicação</label>
                    <input type="datetime-local" id="cont-publish-date" value="${publishValue}">
                </div>

                <div class="form-group">
                    <label><i class="fas fa-mouse-pointer"></i> Cliques</label>
                    <input type="number" id="cont-clicks" value="${content.clicks || 0}" min="0" step="1">
                </div>

                <div class="form-group">
                    <label><i class="fas fa-cart-shopping"></i> Vendas</label>
                    <input type="number" id="cont-sales" value="${content.sales || 0}" min="0" step="1">
                </div>

                <div class="form-group">
                    <label><i class="fas fa-dollar-sign"></i> Comissão (R$)</label>
                    <input type="number" id="cont-commission" value="${content.commission || 0}" min="0" step="0.01">
                </div>

                <div class="form-group full">
                    <label><i class="fas fa-align-left"></i> Observações</label>
                    <textarea id="cont-notes" rows="3" placeholder="Anotações sobre o conteúdo...">${Utils.escapeHTML(content.notes || '')}</textarea>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-close-modal>Cancelar</button>
            <button type="button" class="btn btn-primary" id="btn-save-content">
                <i class="fas fa-save"></i> ${isEdit ? 'Salvar Alterações' : 'Cadastrar Conteúdo'}
            </button>
        `;

        Utils.openModal({
            title: isEdit ? 'Editar Conteúdo' : 'Novo Conteúdo',
            body: bodyHTML,
            footer: footerHTML,
            size: 'lg',
            onOpen: () => {
                document.getElementById('btn-save-content').onclick = () => save(id);
                document.getElementById('cont-name').focus();

                // Ao mudar o produto, preenche comissão estimada se estiver vazio
                const productSelect = document.getElementById('cont-product');
                const commissionInput = document.getElementById('cont-commission');
                const salesInput = document.getElementById('cont-sales');

                productSelect.addEventListener('change', () => {
                    const pid = productSelect.value;
                    if (!pid) return;
                    const p = Storage.getById(Storage.KEYS.products, pid);
                    if (p && (!commissionInput.value || commissionInput.value === '0')) {
                        const pct = Number(p.commissionPercent) || 0;
                        const price = Number(p.price) || 0;
                        // Estimativa: comissão por venda * quantidade
                        const salesQty = parseInt(salesInput.value) || 0;
                        if (salesQty > 0) {
                            commissionInput.value = (price * pct / 100 * salesQty).toFixed(2);
                        }
                    }
                });
            }
        });
    }

    // =========================================================
    // SALVAR
    // =========================================================
    function save(id = null) {
        try {
            const name = Utils.sanitizeText(document.getElementById('cont-name').value);
            const productId = document.getElementById('cont-product').value;
            const platform = document.getElementById('cont-platform').value;
            const type = document.getElementById('cont-type').value;
            const status = document.getElementById('cont-status').value;
            const publishDate = document.getElementById('cont-publish-date').value;
            const clicks = parseInt(document.getElementById('cont-clicks').value) || 0;
            const sales = parseInt(document.getElementById('cont-sales').value) || 0;
            const commission = parseFloat(document.getElementById('cont-commission').value) || 0;
            const notes = Utils.sanitizeText(document.getElementById('cont-notes').value);

            // Validações
            if (!name) throw new Error('Informe o nome do conteúdo.');
            if (!platform) throw new Error('Selecione uma plataforma.');
            if (!type) throw new Error('Selecione o tipo de conteúdo.');
            if (clicks < 0) throw new Error('Cliques inválidos.');
            if (sales < 0) throw new Error('Vendas inválidas.');
            if (commission < 0) throw new Error('Comissão inválida.');

            const product = productId ? Storage.getById(Storage.KEYS.products, productId) : null;
            const productName = product ? product.name : '';

            const data = {
                name,
                productId: productId || null,
                productName,
                platform,
                type,
                status,
                publishDate: publishDate ? new Date(publishDate).toISOString() : '',
                clicks,
                sales,
                commission,
                notes
            };

            if (id) {
                Storage.update(Storage.KEYS.contents, id, data);
                Utils.toast('Conteúdo atualizado com sucesso!', 'success');
            } else {
                Storage.add(Storage.KEYS.contents, data);
                Utils.toast('Conteúdo cadastrado com sucesso!', 'success');
            }

            Utils.closeModal();
            render();
            Dashboard.refresh();
            // Calendário precisa re-renderizar
            if (typeof Calendar !== 'undefined' && Calendar.render) Calendar.render();

        } catch (err) {
            console.error(err);
            Utils.toast(err.message || 'Erro ao salvar conteúdo.', 'error');
        }
    }

    // =========================================================
    // EXCLUIR
    // =========================================================
    async function confirmDelete(id) {
        const content = Storage.getById(Storage.KEYS.contents, id);
        if (!content) return;

        const ok = await Utils.confirm({
            title: 'Excluir Conteúdo',
            message: `Deseja realmente excluir "${content.name}"?\n\nEsta ação NÃO pode ser desfeita.`,
            confirmText: 'Excluir',
            danger: true
        });

        if (!ok) return;

        Storage.remove(Storage.KEYS.contents, id);
        Utils.toast('Conteúdo excluído com sucesso!', 'success');
        render();
        Dashboard.refresh();
        if (typeof Calendar !== 'undefined' && Calendar.render) Calendar.render();
    }

    // =========================================================
    // EXPORTAR CSV
    // =========================================================
    function exportCSV() {
        const contents = Storage.getAll(Storage.KEYS.contents);

        if (contents.length === 0) {
            Utils.toast('Não há conteúdos para exportar.', 'warning');
            return;
        }

        const columns = [
            { label: 'Nome', key: 'name' },
            { label: 'Produto', key: 'productName' },
            { label: 'Plataforma', value: c => Utils.getPlatformLabel(c.platform) },
            { label: 'Tipo', key: 'type' },
            { label: 'Status', value: c => Utils.CONTENT_STATUS[c.status]?.label || c.status },
            { label: 'Data Publicação', value: c => c.publishDate ? Utils.formatDateTime(c.publishDate) : '' },
            { label: 'Cliques', key: 'clicks' },
            { label: 'Vendas', key: 'sales' },
            { label: 'Comissão', value: c => (Number(c.commission) || 0).toFixed(2) },
            { label: 'Observações', key: 'notes' }
        ];

        const csv = Utils.toCSV(contents, columns);
        Utils.downloadFile(csv, `or-shopee-conteudos-${Utils.todayISO()}.csv`, 'text/csv;charset=utf-8');
        Utils.toast('CSV exportado com sucesso!', 'success');
    }

    // =========================================================
    // FILTROS
    // =========================================================
    function bindFilters() {
        const search = document.getElementById('content-search');
        const platformFilter = document.getElementById('content-filter-platform');
        const statusFilter = document.getElementById('content-filter-status');

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
        document.getElementById('btn-new-content')?.addEventListener('click', () => openForm());
        document.getElementById('btn-export-contents')?.addEventListener('click', exportCSV);
        bindFilters();
    }

    // =========================================================
    // EXPORT
    // =========================================================
    return {
        init,
        render,
        openForm,
        exportCSV,
        updateKPIs
    };
})();