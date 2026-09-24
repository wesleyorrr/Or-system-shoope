/* =========================================================
   OR SHOPEE MANAGER — Camada de Armazenamento (LocalStorage)
   Abstração de acesso a dados — preparada para futura migração
   para backend sem alterar as regras de negócio.
   ========================================================= */

const Storage = (() => {

    // Prefixo para todas as chaves (evita conflitos)
    const PREFIX = 'orsm_';
    const VERSION = 1;

    // Nomes das "tabelas"
    const KEYS = {
        products: 'products',
        links: 'links',
        contents: 'contents',
        sales: 'sales',
        customers: 'customers',
        settings: 'settings',
        version: 'version'
    };

    // =========================================================
    // HELPERS INTERNOS
    // =========================================================

    function fullKey(key) {
        return PREFIX + key;
    }

    function read(key, defaultValue = []) {
        try {
            const raw = localStorage.getItem(fullKey(key));
            if (raw === null) return defaultValue;
            return JSON.parse(raw);
        } catch (err) {
            console.error(`[Storage] Erro ao ler "${key}":`, err);
            return defaultValue;
        }
    }

    function write(key, value) {
        try {
            localStorage.setItem(fullKey(key), JSON.stringify(value));
            return true;
        } catch (err) {
            console.error(`[Storage] Erro ao gravar "${key}":`, err);
            Utils.toast('Erro ao salvar dados. Verifique se o navegador não está com armazenamento cheio.', 'error');
            return false;
        }
    }

    function removeKey(key) {
        try {
            localStorage.removeItem(fullKey(key));
            return true;
        } catch (err) {
            console.error(`[Storage] Erro ao remover "${key}":`, err);
            return false;
        }
    }

    // =========================================================
    // CRUD GENÉRICO
    // =========================================================

    function getAll(table) {
        return read(table, []);
    }

    function getById(table, id) {
        const all = read(table, []);
        return all.find(item => item.id === id);
    }

    function add(table, data) {
        const all = read(table, []);
        const now = Utils.nowISO();

        const item = {
            ...data,
            id: data.id || Utils.uid(),
            createdAt: data.createdAt || now,
            updatedAt: now
        };

        all.push(item);
        write(table, all);
        return item;
    }

    function update(table, id, changes) {
        const all = read(table, []);
        const index = all.findIndex(item => item.id === id);
        if (index === -1) return null;

        const updated = {
            ...all[index],
            ...changes,
            id, // protege o id
            updatedAt: Utils.nowISO()
        };

        all[index] = updated;
        write(table, all);
        return updated;
    }

    function remove(table, id) {
        const all = read(table, []);
        const filtered = all.filter(item => item.id !== id);
        if (filtered.length === all.length) return false;
        write(table, filtered);
        return true;
    }

    function clear(table) {
        write(table, []);
        return true;
    }

    function count(table) {
        return read(table, []).length;
    }

    function exists(table, id) {
        return !!getById(table, id);
    }

    // =========================================================
    // BUSCAS ESPECÍFICAS
    // =========================================================

    function find(table, predicate) {
        const all = read(table, []);
        return all.find(predicate);
    }

    function filter(table, predicate) {
        const all = read(table, []);
        return all.filter(predicate);
    }

    function findMany(table, predicate) {
        return filter(table, predicate);
    }

    // =========================================================
    // SETTINGS (objeto único)
    // =========================================================

    function getSettings() {
        return read(KEYS.settings, {}) || {};
    }

    function saveSettings(settings) {
        const current = getSettings();
        const merged = { ...current, ...settings, updatedAt: Utils.nowISO() };
        write(KEYS.settings, merged);
        return merged;
    }

    // =========================================================
    // VERSIONAMENTO
    // =========================================================

    function getVersion() {
        return read(KEYS.version, { version: VERSION });
    }

    function setVersion(version = VERSION) {
        write(KEYS.version, { version, updatedAt: Utils.nowISO() });
    }

    function migrate() {
        const v = getVersion();
        // Futuras migrações podem ser feitas aqui
        // Exemplo: if (v.version < 2) { ...migração...; setVersion(2); }
        if (!v || !v.version) {
            setVersion(VERSION);
        }
    }

    // =========================================================
    // OPERAÇÕES DE ALTO NÍVEL
    // =========================================================

    /**
     * Verifica se o sistema está vazio (nenhum dado relevante)
     */
    function isEmpty() {
        return count(KEYS.products) === 0 &&
               count(KEYS.sales) === 0 &&
               count(KEYS.contents) === 0 &&
               count(KEYS.customers) === 0;
    }

    /**
     * Registra uma venda e atualiza estatísticas relacionadas
     */
    function registerSale(saleData) {
        const product = saleData.productId ? getById(KEYS.products, saleData.productId) : null;

        // Calcula comissão
        const commissionPercent = saleData.commissionPercent !== undefined
            ? Number(saleData.commissionPercent)
            : (product ? Number(product.commissionPercent) || 0 : 0);

        const commissionValue = (Number(saleData.saleValue) || 0) * (commissionPercent / 100);

        const sale = add(KEYS.sales, {
            date: saleData.date || Utils.nowISO(),
            productId: saleData.productId || null,
            productName: saleData.productName || (product ? product.name : '—'),
            quantity: Number(saleData.quantity) || 1,
            saleValue: Number(saleData.saleValue) || 0,
            commissionPercent,
            commissionValue,
            platform: saleData.platform || 'shopee',
            customerId: saleData.customerId || null,
            customerName: saleData.customerName || '',
            notes: saleData.notes || ''
        });

        // Se tem cliente, atualiza dados dele
        if (saleData.customerId) {
            const customer = getById(KEYS.customers, saleData.customerId);
            if (customer) {
                update(KEYS.customers, saleData.customerId, {
                    lastProductId: saleData.productId || null,
                    lastPurchaseDate: sale.date,
                    lastValue: sale.saleValue,
                    purchaseCount: (customer.purchaseCount || 1) + 1
                });
            }
        }

        return sale;
    }

    /**
     * Remove produto e desvincula referências em outros módulos
     */
    function deleteProduct(id) {
        // Remove produto
        remove(KEYS.products, id);

        // Desvincula links
        const links = getAll(KEYS.links);
        links.forEach(link => {
            if (link.productId === id) {
                update(KEYS.links, link.id, { productId: null, productName: link.productName || '—' });
            }
        });

        // Desvincula conteúdos
        const contents = getAll(KEYS.contents);
        contents.forEach(c => {
            if (c.productId === id) {
                update(KEYS.contents, c.id, { productId: null });
            }
        });

        return true;
    }

    /**
     * Remove cliente e desvincula vendas
     */
    function deleteCustomer(id) {
        remove(KEYS.customers, id);

        const sales = getAll(KEYS.sales);
        sales.forEach(sale => {
            if (sale.customerId === id) {
                update(KEYS.sales, sale.id, { customerId: null });
            }
        });

        return true;
    }

    // =========================================================
    // BACKUP / RESTORE
    // =========================================================

    function exportAll() {
        return {
            app: 'OR Shopee Manager',
            version: VERSION,
            exportedAt: Utils.nowISO(),
            products: getAll(KEYS.products),
            links: getAll(KEYS.links),
            contents: getAll(KEYS.contents),
            sales: getAll(KEYS.sales),
            customers: getAll(KEYS.customers),
            settings: getSettings()
        };
    }

    function importAll(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Arquivo inválido.');
        }

        // Aceita tanto com prefixo quanto sem
        const payload = {
            products: data.products || [],
            links: data.links || [],
            contents: data.contents || [],
            sales: data.sales || [],
            customers: data.customers || [],
            settings: data.settings || {}
        };

        write(KEYS.products, payload.products);
        write(KEYS.links, payload.links);
        write(KEYS.contents, payload.contents);
        write(KEYS.sales, payload.sales);
        write(KEYS.customers, payload.customers);
        write(KEYS.settings, payload.settings);

        setVersion(VERSION);
        return true;
    }

    /**
     * Limpa TUDO (mantém settings da empresa)
     */
    function clearAll() {
        write(KEYS.products, []);
        write(KEYS.links, []);
        write(KEYS.contents, []);
        write(KEYS.sales, []);
        write(KEYS.customers, []);
        return true;
    }

    /**
     * Reset total (inclui settings)
     */
    function resetEverything() {
        Object.values(KEYS).forEach(key => removeKey(key));
        return true;
    }

    // =========================================================
    // ESTATÍSTICAS RÁPIDAS
    // =========================================================

    function stats() {
        const products = getAll(KEYS.products);
        const sales = getAll(KEYS.sales);
        const contents = getAll(KEYS.contents);
        const links = getAll(KEYS.links);
        const customers = getAll(KEYS.customers);

        let totalRevenue = 0;
        let totalCommission = 0;
        let totalClicks = 0;

        sales.forEach(s => {
            totalRevenue += Number(s.saleValue) || 0;
            totalCommission += Number(s.commissionValue) || 0;
        });

        contents.forEach(c => {
            totalClicks += Number(c.clicks) || 0;
        });

        links.forEach(l => {
            totalClicks += Number(l.clicks) || 0;
        });

        return {
            products: products.length,
            links: links.length,
            contents: contents.length,
            sales: sales.length,
            customers: customers.length,
            totalRevenue,
            totalCommission,
            totalClicks
        };
    }

    // =========================================================
    // INIT
    // =========================================================

    function init() {
        migrate();
        return true;
    }

    // =========================================================
    // EXPORT
    // =========================================================
    return {
        KEYS,
        PREFIX,
        VERSION,

        init,
        getAll,
        getById,
        add,
        update,
        remove,
        clear,
        count,
        exists,
        find,
        filter,
        findMany,

        getSettings,
        saveSettings,

        getVersion,
        setVersion,
        migrate,

        isEmpty,
        registerSale,
        deleteProduct,
        deleteCustomer,

        exportAll,
        importAll,
        clearAll,
        resetEverything,

        stats
    };
})();