/* =========================================================
   OR SHOPEE MANAGER — Links de Afiliado
   ========================================================= */

const Links = (() => {

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

    function buildPlatformOptions(selected = '') {
        return `<option value="">Selecione...</option>` +
            Object.entries(Utils.PLATFORMS)
                .map(([key, val]) => `<option value="${key}" ${selected === key ? 'selected' : ''}>${val.label}</option>`)
                .join('');
    }

    function calcConversion(link) {
        const c = Number(link.clicks) || 0;
        const s = Number(link.sales) || 0;
        if (c === 0) return 0;
        return (s / c) * 100;
    }

    function truncate(str, len = 40) {
        if (!str) return '—';
        return str.length > len ? str.slice(0, len) + '...' : str;
    }

    // =========================================================
    // RENDER
    // =========================================================
    function render() {
        const tbody = document.getElementById('tbl-links');
        const empty = document.getElementById('links-empty');
        if (!tbody) return;

        let links = Storage.getAll(Storage.KEYS.links);

        // Filtros
        const search = filters.search.toLowerCase().trim();
        links = links.filter(l => {
            if (search) {
                const text = `${l.productName || ''} ${l.url || ''}`.toLowerCase();
                if (!text.includes(search)) return false;
            }
            if (filters.platform && l.platform !== filters.platform) return false;
            return true;
        });

        // Ordena por data (mais recente primeiro)
        links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        tbody.innerHTML = '';

        if (links.length === 0) {
            empty.classList.remove('hidden');
            const msg = empty.querySelector('h3');
            if (msg) {
                msg.textContent = Storage.count(Storage.KEYS.links) === 0
                    ? 'Você ainda não possui links cadastrados'
                    : 'Nenhum link encontrado com esses filtros';
            }
            return;
        }
        empty.classList.add('hidden');

        links.forEach(l => {
            const platform = Utils.getPlatformInfo(l.platform);
            const conversion = calcConversion(l);
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td><strong>${Utils.escapeHTML(l.productName || '—')}</strong></td>
                <td>
                    <a href="${Utils.escapeHTML(l.url)}" target="_blank" rel="noopener noreferrer" class="link-external" title="${Utils.escapeHTML(l.url)}">
                        ${Utils.escapeHTML(truncate(l.url, 35))}
                    </a>
                </td>
                <td>
                    <span class="status-badge info">
                        <i class="fab ${platform.icon}"></i> ${platform.label}
                    </span>
                </td>
                <td>${Utils.formatNumber(l.clicks)}</td>
                <td>${Utils.formatNumber(l.sales)}</td>
                <td>${Utils.formatPercent(conversion)}</td>
                <td class="actions">
                    <button class="btn-icon" title="Copiar link" data-action="copy" data-id="${l.id}">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn-icon" title="Abrir" data-action="open" data-id="${l.id}">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                    <button class="btn-icon" title="Editar" data-action="edit" data-id="${l.id}">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-icon danger" title="Excluir" data-action="delete" data-id="${l.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        bindRowActions();
    }

    function bindRowActions() {
        document.querySelectorAll('#tbl-links [data-action]').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                const action = btn.dataset.action;
                const link = Storage.getById(Storage.KEYS.links, id);
                if (!link) return;

                if (action === 'copy') {
                    await copyToClipboard(link.url);
                } else if (action === 'open') {
                    window.open(link.url, '_blank', 'noopener');
                } else if (action === 'edit') {
                    openForm(id);
                } else if (action === 'delete') {
                    confirmDelete(id);
                }
            };
        });
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            Utils.toast('Link copiado para a área de transferência!', 'success', 'Copiado');
        } catch {
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
        let link = {
            id: null,
            productId: '',
            productName: '',
            url: '',
            platform: 'instagram',
            clicks: 0,
            sales: 0,
            status: 'ativo'
        };

        if (id) {
            const found = Storage.getById(Storage.KEYS.links, id);
            if (!found) {
                Utils.toast('Link não encontrado.', 'error');
                return;
            }
            link = { ...link, ...found };
        }

        const isEdit = !!id;

        const bodyHTML = `
            <form id="form-link" class="form-grid">
                <div class="form-group full">
                    <label><i class="fas fa-box"></i> Produto Vinculado *</label>
                    <select id="link-product" required>
                        ${buildProductOptions(link.productId)}
                    </select>
                </div>

                <div class="form-group full">
                    <label><i class="fas fa-link"></i> URL do Link de Afiliado *</label>
                    <input type="url" id="link-url" value="${Utils.escapeHTML(link.url)}" placeholder="https://s.shopee.com.br/..." required>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-share-nodes"></i> Plataforma *</label>
                    <select id="link-platform" required>
                        ${buildPlatformOptions(link.platform)}
                    </select>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-circle-info"></i> Status</label>
                    <select id="link-status">
                        <option value="ativo" ${link.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                        <option value="pausado" ${link.status === 'pausado' ? 'selected' : ''}>Pausado</option>
                        <option value="encerrado" ${link.status === 'encerrado' ? 'selected' : ''}>Encerrado</option>
                    </select>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-mouse-pointer"></i> Cliques</label>
                    <input type="number" id="link-clicks" value="${link.clicks || 0}" min="0" step="1">
                </div>

                <div class="form-group">
                    <label><i class="fas fa-cart-shopping"></i> Vendas</label>
                    <input type="number" id="link-sales" value="${link.sales || 0}" min="0" step="1">
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-close-modal>Cancelar</button>
            <button type="button" class="btn btn-primary" id="btn-save-link">
                <i class="fas fa-save"></i> ${isEdit ? 'Salvar Alterações' : 'Cadastrar Link'}
            </button>
        `;

        Utils.openModal({
            title: isEdit ? 'Editar Link' : 'Novo Link',
            body: bodyHTML,
            footer: footerHTML,
            size: 'lg',
            onOpen: () => {
                document.getElementById('btn-save-link').onclick = () => save(id);
                document.getElementById('link-url').focus();
            }
        });
    }

    // =========================================================
    // SALVAR
    // =========================================================
    function save(id = null) {
        try {
            const productId = document.getElementById('link-product').value;
            const url = Utils.sanitizeText(document.getElementById('link-url').value);
            const platform = document.getElementById('link-platform').value;
            const status = document.getElementById('link-status').value;
            const clicks = parseInt(document.getElementById('link-clicks').value) || 0;
            const sales = parseInt(document.getElementById('link-sales').value) || 0;

            // Validações
            if (!productId) throw new Error('Selecione um produto.');
            if (!url) throw new Error('Informe a URL do link.');
            if (!Utils.isValidUrl(url)) throw new Error('URL inválida.');
            if (!platform) throw new Error('Selecione uma plataforma.');
            if (clicks < 0) throw new Error('Cliques inválidos.');
            if (sales < 0) throw new Error('Vendas inválidas.');

            const product = Storage.getById(Storage.KEYS.products, productId);
            const productName = product ? product.name : '';

            const data = {
                productId,
                productName,
                url,
                platform,
                status,
                clicks,
                sales
            };

            if (id) {
                Storage.update(Storage.KEYS.links, id, data);
                Utils.toast('Link atualizado com sucesso!', 'success');
            } else {
                Storage.add(Storage.KEYS.links, data);
                Utils.toast('Link cadastrado com sucesso!', 'success');
            }

            Utils.closeModal();
            render();
            Dashboard.refresh();

        } catch (err) {
            console.error(err);
            Utils.toast(err.message || 'Erro ao salvar link.', 'error');
        }
    }

    // =========================================================
    // EXCLUIR
    // =========================================================
    async function confirmDelete(id) {
        const link = Storage.getById(Storage.KEYS.links, id);
        if (!link) return;

        const ok = await Utils.confirm({
            title: 'Excluir Link',
            message: `Deseja realmente excluir este link de "${link.productName}"?\n\nEsta ação NÃO pode ser desfeita.`,
            confirmText: 'Excluir',
            danger: true
        });

        if (!ok) return;

        Storage.remove(Storage.KEYS.links, id);
        Utils.toast('Link excluído com sucesso!', 'success');
        render();
        Dashboard.refresh();
    }

    // =========================================================
    // FILTROS
    // =========================================================
    function bindFilters() {
        const search = document.getElementById('links-search');
        const platformFilter = document.getElementById('links-filter-platform');

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
        document.getElementById('btn-new-link')?.addEventListener('click', () => openForm());
        bindFilters();
    }

    // =========================================================
    // EXPORT
    // =========================================================
    return {
        init,
        render,
        openForm
    };
})();