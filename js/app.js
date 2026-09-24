/* =========================================================
   OR SHOPEE MANAGER — Application Bootstrap
   Roteamento, menu, busca global, filtros globais e onboarding
   ========================================================= */

const App = (() => {

    const VIEWS = [
        'dashboard', 'products', 'links', 'content', 'calendar',
        'sales', 'commissions', 'customers', 'analytics', 'settings'
    ];

    let currentView = 'dashboard';
    let globalPeriod = '30d';
    let isInitialized = false;

    // =========================================================
    // NAVEGAÇÃO
    // =========================================================
    function navigate(viewName) {
        if (!VIEWS.includes(viewName)) return;

        // Atualiza views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(`view-${viewName}`);
        if (target) target.classList.add('active');

        // Atualiza menu
        document.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        currentView = viewName;
        window.location.hash = viewName;

        // Fecha sidebar em mobile
        closeSidebar();

        // Scroll pro topo
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Refresh da view
        refreshView(viewName);
    }

    function refreshView(viewName) {
        try {
            switch (viewName) {
                case 'dashboard':
                    Dashboard.refresh();
                    break;
                case 'products':
                    Products.render();
                    break;
                case 'links':
                    Links.render();
                    break;
                case 'content':
                    Content.render();
                    break;
                case 'calendar':
                    Calendar.render();
                    break;
                case 'sales':
                    Sales.render();
                    break;
                case 'commissions':
                    Commissions.render();
                    break;
                case 'customers':
                    Customers.render();
                    break;
                case 'analytics':
                    Analytics.render();
                    break;
                case 'settings':
                    Settings.load();
                    break;
            }
        } catch (err) {
            console.error(`[OR Shopee] Erro ao carregar view "${viewName}":`, err);
        }
    }

    // =========================================================
    // MENU / SIDEBAR
    // =========================================================
    function openSidebar() {
        document.getElementById('sidebar')?.classList.add('open');
        document.getElementById('sidebar-overlay')?.classList.add('active');
    }

    function closeSidebar() {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('active');
    }

    function bindMenu() {
        document.getElementById('menu-toggle')?.addEventListener('click', openSidebar);
        document.getElementById('sidebar-close')?.addEventListener('click', closeSidebar);
        document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

        // Links do menu lateral
        document.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                navigate(item.dataset.view);
            });
        });

        // Links "Ver todos" e similares (que também têm data-view)
        document.querySelectorAll('[data-view]:not(.nav-item)').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                navigate(el.dataset.view);
            });
        });

        // Fechar sidebar ao apertar ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeSidebar();
        });
    }

    // =========================================================
    // BUSCA GLOBAL
    // =========================================================
    function bindGlobalSearch() {
        const input = document.getElementById('global-search');
        const results = document.getElementById('search-results');
        if (!input || !results) return;

        const doSearch = Utils.debounce(() => {
            const query = input.value.trim().toLowerCase();

            if (!query || query.length < 2) {
                results.classList.add('hidden');
                results.innerHTML = '';
                return;
            }

            const products = Storage.getAll(Storage.KEYS.products);
            const contents = Storage.getAll(Storage.KEYS.contents);
            const customers = Storage.getAll(Storage.KEYS.customers);
            const links = Storage.getAll(Storage.KEYS.links);

            const matches = [];

            // Produtos
            products.forEach(p => {
                const text = `${p.name || ''} ${p.store || ''} ${p.category || ''}`.toLowerCase();
                if (text.includes(query)) {
                    matches.push({
                        type: 'product',
                        id: p.id,
                        title: p.name,
                        subtitle: `Produto · ${p.category || '—'}`,
                        icon: 'fa-box'
                    });
                }
            });

            // Conteúdos
            contents.forEach(c => {
                const text = `${c.name || ''} ${c.productName || ''}`.toLowerCase();
                if (text.includes(query)) {
                    matches.push({
                        type: 'content',
                        id: c.id,
                        title: c.name,
                        subtitle: `Conteúdo · ${Utils.getPlatformLabel(c.platform)}`,
                        icon: 'fa-video'
                    });
                }
            });

            // Clientes
            customers.forEach(c => {
                const text = `${c.name || ''} ${c.whatsapp || ''} ${c.city || ''}`.toLowerCase();
                if (text.includes(query)) {
                    matches.push({
                        type: 'customer',
                        id: c.id,
                        title: c.name,
                        subtitle: `Cliente · ${c.city || '—'}`,
                        icon: 'fa-user'
                    });
                }
            });

            // Links
            links.forEach(l => {
                const text = `${l.productName || ''} ${l.url || ''}`.toLowerCase();
                if (text.includes(query)) {
                    matches.push({
                        type: 'link',
                        id: l.id,
                        title: l.productName || 'Link',
                        subtitle: `Link · ${Utils.getPlatformLabel(l.platform)}`,
                        icon: 'fa-link'
                    });
                }
            });

            const limited = matches.slice(0, 12);

            if (limited.length === 0) {
                results.innerHTML = `<div style="padding:20px;text-align:center;color:var(--texto-terciario);font-size:13px;">Nenhum resultado encontrado</div>`;
                results.classList.remove('hidden');
                return;
            }

            results.innerHTML = limited.map(m => `
                <div class="search-result-item" data-type="${m.type}" data-id="${m.id}">
                    <div class="search-result-icon"><i class="fas ${m.icon}"></i></div>
                    <div class="search-result-info">
                        <strong>${Utils.escapeHTML(m.title)}</strong>
                        <small>${Utils.escapeHTML(m.subtitle)}</small>
                    </div>
                </div>
            `).join('');

            results.classList.remove('hidden');

            results.querySelectorAll('.search-result-item').forEach(item => {
                item.onclick = () => {
                    handleSearchResult(item.dataset.type, item.dataset.id);
                };
            });
        }, 200);

        input.addEventListener('input', doSearch);
        input.addEventListener('focus', () => {
            if (input.value.trim().length >= 2) doSearch();
        });

        // Fecha ao clicar fora
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !results.contains(e.target)) {
                results.classList.add('hidden');
            }
        });

        // ESC fecha
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                results.classList.add('hidden');
                input.blur();
            }
        });
    }

    function handleSearchResult(type, id) {
        document.getElementById('search-results')?.classList.add('hidden');
        const input = document.getElementById('global-search');
        if (input) input.value = '';

        if (type === 'product') {
            navigate('products');
            setTimeout(() => Products.openForm(id), 150);
        } else if (type === 'content') {
            navigate('content');
            setTimeout(() => Content.openForm(id), 150);
        } else if (type === 'customer') {
            navigate('customers');
            setTimeout(() => Customers.openForm(id), 150);
        } else if (type === 'link') {
            navigate('links');
            setTimeout(() => Links.openForm(id), 150);
        }
    }

    // =========================================================
    // FILTROS GLOBAIS DE PERÍODO
    // =========================================================
    function bindGlobalPeriod() {
        const select = document.getElementById('global-period');
        if (!select) return;

        select.addEventListener('change', () => {
            const value = select.value;

            if (value === 'custom') {
                askCustomPeriod();
            } else {
                globalPeriod = value;
                Dashboard.setPeriod(value);
                // Re-renderiza dashboard
                if (currentView === 'dashboard') {
                    Dashboard.refresh();
                }
            }
        });
    }

    async function askCustomPeriod() {
        const bodyHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label><i class="fas fa-calendar"></i> Data Inicial</label>
                    <input type="date" id="custom-start" value="${Utils.todayISO()}">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-calendar"></i> Data Final</label>
                    <input type="date" id="custom-end" value="${Utils.todayISO()}">
                </div>
            </div>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-close-modal>Cancelar</button>
            <button type="button" class="btn btn-primary" id="btn-apply-custom">
                <i class="fas fa-check"></i> Aplicar
            </button>
        `;

        Utils.openModal({
            title: 'Período Personalizado',
            body: bodyHTML,
            footer: footerHTML,
            size: 'sm',
            onOpen: () => {
                document.getElementById('btn-apply-custom').onclick = () => {
                    const start = document.getElementById('custom-start').value;
                    const end = document.getElementById('custom-end').value;

                    if (!start || !end) {
                        Utils.toast('Informe a data inicial e final.', 'warning');
                        return;
                    }
                    if (new Date(start) > new Date(end)) {
                        Utils.toast('Data inicial não pode ser maior que a final.', 'warning');
                        return;
                    }

                    Utils.closeModal();
                    // Por enquanto, apenas reset para 30d (Dashboard não usa custom completo)
                    // Para simplificar, trataremos como 30d
                    Utils.toast('Período personalizado aplicado (funcionalidade demonstrativa).', 'info');

                    // Atualiza Dashboard (por enquanto usa 30d por padrão)
                    Dashboard.setPeriod('30d');
                    if (currentView === 'dashboard') Dashboard.refresh();
                };
            }
        });
    }

    // =========================================================
    // BOTÃO DE ALERTA (notificações)
    // =========================================================
    function bindAlertButton() {
        document.getElementById('topbar-alert')?.addEventListener('click', () => {
            navigate('dashboard');
            setTimeout(() => {
                document.getElementById('alerts-list')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    }

    // =========================================================
    // ONBOARDING
    // =========================================================
    function showOnboarding() {
        const overlay = document.getElementById('onboarding');
        const app = document.getElementById('app');

        overlay.classList.remove('hidden');
        app.classList.add('hidden');

        // Botão: começar do zero
        document.getElementById('ob-start')?.addEventListener('click', async () => {
            // Salva configurações padrão
            Storage.saveSettings({
                userName: '',
                companyName: 'Minha Loja',
                currency: 'BRL',
                theme: 'dark'
            });

            await enterApp();
            Utils.toast('Bem-vindo ao OR Shopee Manager!', 'success', 'Pronto para começar');
        });

        // Botão: carregar demo
        document.getElementById('ob-demo')?.addEventListener('click', async () => {
            try {
                Utils.showLoading();

                // Configurações padrão
                Storage.saveSettings({
                    userName: '',
                    companyName: 'Minha Loja Demo',
                    currency: 'BRL',
                    theme: 'dark'
                });

                // Carrega demo
                DemoData.load();

                Utils.hideLoading();

                await enterApp();

                Utils.toast('Dados de demonstração carregados com sucesso!', 'success');

            } catch (err) {
                Utils.hideLoading();
                console.error(err);
                Utils.toast('Erro ao carregar dados de demonstração.', 'error');
            }
        });
    }

    async function enterApp() {
        document.getElementById('onboarding')?.classList.add('hidden');
        document.getElementById('app')?.classList.remove('hidden');

        // Recarrega configurações
        Settings.load();

        // Renderiza view inicial (hash ou dashboard)
        const hash = window.location.hash.replace('#', '');
        const initial = VIEWS.includes(hash) ? hash : 'dashboard';
        navigate(initial);
    }

    // =========================================================
    // INIT GERAL
    // =========================================================
    async function init() {
        if (isInitialized) return;
        isInitialized = true;

        try {
            // Inicializa storage
            Storage.init();

            // Aplica tema salvo (antes de tudo, para não piscar)
            try {
                const savedTheme = localStorage.getItem('orsm_theme') || 'dark';
                document.documentElement.setAttribute('data-theme', savedTheme);
            } catch (e) { /* ignore */ }

            // Inicializa módulos
            Dashboard.init();
            Products.init();
            Links.init();
            Content.init();
            Calendar.init();
            Sales.init();
            Commissions.init();
            Customers.init();
            Analytics.init();
            Settings.init();
            Backup.init();

            // Binds do app
            bindMenu();
            bindGlobalSearch();
            bindGlobalPeriod();
            bindAlertButton();

            // Verifica se é primeiro acesso
            const settings = Storage.getSettings();
            const hasSettings = settings && (settings.companyName || settings.userName);

            if (!hasSettings && Storage.isEmpty()) {
                // Primeiro acesso → onboarding
                showOnboarding();
            } else {
                // Já configurado
                window.ORSM_Settings = { ...Settings.DEFAULT_SETTINGS, ...settings };
                await enterApp();
            }

            // Mensagem no console
            console.log('%c🛍️ OR Shopee Manager v1.0', 'color: #007BFF; font-weight: bold; font-size: 16px;');
            console.log('%cby OR System — Organize seus resultados', 'color: #A6A6A6; font-size: 12px;');

        } catch (err) {
            console.error('[OR Shopee] Erro na inicialização:', err);
            Utils.toast('Erro ao inicializar o sistema. Recarregue a página.', 'error');
        }
    }

    // =========================================================
    // EXPORT
    // =========================================================
    return {
        init,
        navigate,
        refreshView,
        openSidebar,
        closeSidebar,
        getCurrentView: () => currentView
    };
})();

// =========================================================
// BOOTSTRAP
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});