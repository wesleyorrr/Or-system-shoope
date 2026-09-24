/* =========================================================
   OR SHOPEE MANAGER — Clientes
   ========================================================= */

const Customers = (() => {

    let filters = {
        search: ''
    };

    // =========================================================
    // HELPERS
    // =========================================================
    function buildProductOptions(selectedId = '') {
        const products = Storage.getAll(Storage.KEYS.products);
        if (products.length === 0) {
            return `<option value="">Nenhum produto cadastrado</option>`;
        }
        return `<option value="">Nenhum</option>` +
            products
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                .map(p => `<option value="${p.id}" ${selectedId === p.id ? 'selected' : ''}>${Utils.escapeHTML(p.name)}</option>`)
                .join('');
    }

    function whatsappLink(phone) {
        if (!phone) return '#';
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 10) return '#';
        const full = digits.startsWith('55') ? digits : '55' + digits;
        return `https://wa.me/${full}`;
    }

    // =========================================================
    // RENDER
    // =========================================================
    function render() {
        const tbody = document.getElementById('tbl-customers');
        const empty = document.getElementById('customers-empty');
        if (!tbody) return;

        let customers = Storage.getAll(Storage.KEYS.customers);

        const search = filters.search.toLowerCase().trim();
        customers = customers.filter(c => {
            if (search) {
                const text = `${c.name || ''} ${c.whatsapp || ''} ${c.city || ''}`.toLowerCase();
                if (!text.includes(search)) return false;
            }
            return true;
        });

        // Ordena por nome
        customers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        tbody.innerHTML = '';

        if (customers.length === 0) {
            empty.classList.remove('hidden');
            const msg = empty.querySelector('h3');
            if (msg) {
                msg.textContent = Storage.count(Storage.KEYS.customers) === 0
                    ? 'Você ainda não possui clientes cadastrados'
                    : 'Nenhum cliente encontrado com esses filtros';
            }
            return;
        }
        empty.classList.add('hidden');

        customers.forEach(c => {
            const tr = document.createElement('tr');

            const waLink = whatsappLink(c.whatsapp);
            const waHTML = c.whatsapp
                ? `<a href="${waLink}" target="_blank" rel="noopener" class="link-external" title="Abrir no WhatsApp">
                       <i class="fab fa-whatsapp" style="color:#25D366;"></i> ${Utils.escapeHTML(c.whatsapp)}
                   </a>`
                : '—';

            tr.innerHTML = `
                <td>
                    <strong>${Utils.escapeHTML(c.name)}</strong>
                    ${c.purchaseCount > 1 ? `<br><small style="color:var(--verde);font-size:11px;"><i class="fas fa-star"></i> ${c.purchaseCount} compras</small>` : ''}
                </td>
                <td>${waHTML}</td>
                <td>${Utils.escapeHTML(c.city || '—')}</td>
                <td>${Utils.escapeHTML(c.lastProductName || '—')}</td>
                <td>${c.lastPurchaseDate ? Utils.formatDate(c.lastPurchaseDate) : '—'}</td>
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
        document.querySelectorAll('#tbl-customers [data-action]').forEach(btn => {
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
        const customers = Storage.getAll(Storage.KEYS.customers);

        const total = customers.length;

        // Novos nos últimos 30 dias
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);

        const newOnes = customers.filter(c => {
            const d = new Date(c.createdAt);
            return !isNaN(d.getTime()) && d >= cutoff;
        }).length;

        // Recorrentes = purchaseCount > 1
        const repeat = customers.filter(c => (c.purchaseCount || 0) > 1).length;

        setText('customers-kpi-total', Utils.formatNumber(total));
        setText('customers-kpi-new', Utils.formatNumber(newOnes));
        setText('customers-kpi-repeat', Utils.formatNumber(repeat));

        // Badge sidebar
        setText('badge-customers', total);
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    // =========================================================
    // FORMULÁRIO
    // =========================================================
    function openForm(id = null) {
        let customer = {
            id: null,
            name: '',
            whatsapp: '',
            city: '',
            lastProductId: '',
            lastProductName: '',
            lastPurchaseDate: '',
            lastValue: 0,
            notes: ''
        };

        if (id) {
            const found = Storage.getById(Storage.KEYS.customers, id);
            if (!found) {
                Utils.toast('Cliente não encontrado.', 'error');
                return;
            }
            customer = { ...customer, ...found };
        }

        const isEdit = !!id;

        // Formata data
        let dateValue = '';
        if (customer.lastPurchaseDate) {
            const d = new Date(customer.lastPurchaseDate);
            if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                dateValue = `${year}-${month}-${day}`;
            }
        }

        const bodyHTML = `
            <form id="form-customer" class="form-grid">
                <div class="form-group full">
                    <label><i class="fas fa-user"></i> Nome *</label>
                    <input type="text" id="cust-name" value="${Utils.escapeHTML(customer.name)}" required autocomplete="off">
                </div>

                <div class="form-group">
                    <label><i class="fab fa-whatsapp"></i> WhatsApp</label>
                    <input type="tel" id="cust-whatsapp" value="${Utils.escapeHTML(customer.whatsapp || '')}" placeholder="(00) 00000-0000">
                </div>

                <div class="form-group">
                    <label><i class="fas fa-map-marker-alt"></i> Cidade</label>
                    <input type="text" id="cust-city" value="${Utils.escapeHTML(customer.city || '')}" placeholder="Ex: São Paulo - SP">
                </div>

                <div class="form-group full">
                    <label><i class="fas fa-box"></i> Último Produto Comprado</label>
                    <select id="cust-product">
                        ${buildProductOptions(customer.lastProductId)}
                    </select>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-calendar"></i> Data da Última Compra</label>
                    <input type="date" id="cust-date" value="${dateValue}">
                </div>

                <div class="form-group">
                    <label><i class="fas fa-dollar-sign"></i> Valor da Última Compra</label>
                    <input type="number" id="cust-value" value="${customer.lastValue || 0}" min="0" step="0.01">
                </div>

                <div class="form-group full">
                    <label><i class="fas fa-align-left"></i> Observações</label>
                    <textarea id="cust-notes" rows="3" placeholder="Anotações sobre o cliente...">${Utils.escapeHTML(customer.notes || '')}</textarea>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-close-modal>Cancelar</button>
            <button type="button" class="btn btn-primary" id="btn-save-customer">
                <i class="fas fa-save"></i> ${isEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
        `;

        Utils.openModal({
            title: isEdit ? 'Editar Cliente' : 'Novo Cliente',
            body: bodyHTML,
            footer: footerHTML,
            size: 'lg',
            onOpen: () => {
                document.getElementById('btn-save-customer').onclick = () => save(id);
                document.getElementById('cust-name').focus();
            }
        });
    }

    // =========================================================
    // SALVAR
    // =========================================================
    function save(id = null) {
        try {
            const name = Utils.sanitizeText(document.getElementById('cust-name').value);
            const whatsapp = Utils.sanitizeText(document.getElementById('cust-whatsapp').value);
            const city = Utils.sanitizeText(document.getElementById('cust-city').value);
            const lastProductId = document.getElementById('cust-product').value;
            const lastPurchaseDateInput = document.getElementById('cust-date').value;
            const lastValue = parseFloat(document.getElementById('cust-value').value) || 0;
            const notes = Utils.sanitizeText(document.getElementById('cust-notes').value);

            // Validações
            if (!name) throw new Error('Informe o nome do cliente.');
            if (whatsapp && !Utils.isValidPhone(whatsapp)) throw new Error('WhatsApp inválido.');
            if (lastValue < 0) throw new Error('Valor inválido.');

            const product = lastProductId ? Storage.getById(Storage.KEYS.products, lastProductId) : null;
            const lastProductName = product ? product.name : '';

            const data = {
                name,
                whatsapp,
                city,
                lastProductId: lastProductId || null,
                lastProductName,
                lastPurchaseDate: lastPurchaseDateInput
                    ? new Date(lastPurchaseDateInput + 'T12:00:00').toISOString()
                    : '',
                lastValue,
                notes
            };

            if (id) {
                Storage.update(Storage.KEYS.customers, id, data);
                Utils.toast('Cliente atualizado com sucesso!', 'success');
            } else {
                data.purchaseCount = 1;
                Storage.add(Storage.KEYS.customers, data);
                Utils.toast('Cliente cadastrado com sucesso!', 'success');
            }

            Utils.closeModal();
            render();
            Dashboard.refresh();

        } catch (err) {
            console.error(err);
            Utils.toast(err.message || 'Erro ao salvar cliente.', 'error');
        }
    }

    // =========================================================
    // EXCLUIR
    // =========================================================
    async function confirmDelete(id) {
        const customer = Storage.getById(Storage.KEYS.customers, id);
        if (!customer) return;

        const sales = Storage.getAll(Storage.KEYS.sales);
        const linkedSales = sales.filter(s => s.customerId === id).length;

        const msg = linkedSales > 0
            ? `Este cliente possui ${linkedSales} venda(s) vinculada(s). As vendas serão mantidas mas ficarão SEM vínculo com este cliente.\n\nDeseja continuar?`
            : `Deseja realmente excluir o cliente "${customer.name}"?\n\nEsta ação NÃO pode ser desfeita.`;

        const ok = await Utils.confirm({
            title: 'Excluir Cliente',
            message: msg,
            confirmText: 'Excluir',
            danger: true
        });

        if (!ok) return;

        Storage.deleteCustomer(id);
        Utils.toast('Cliente excluído com sucesso!', 'success');
        render();
        Dashboard.refresh();
    }

    // =========================================================
    // FILTROS
    // =========================================================
    function bindFilters() {
        const search = document.getElementById('customers-search');
        if (search) {
            search.addEventListener('input', Utils.debounce(() => {
                filters.search = search.value;
                render();
            }, 200));
        }
    }

    // =========================================================
    // INIT
    // =========================================================
    function init() {
        document.getElementById('btn-new-customer')?.addEventListener('click', () => openForm());
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