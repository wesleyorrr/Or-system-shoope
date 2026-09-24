/* =========================================================
   OR SHOPEE MANAGER — Configurações
   Perfil, tema, dados de demonstração e zona de perigo
   ========================================================= */

const Settings = (() => {

    const DEFAULT_SETTINGS = {
        userName: '',
        companyName: 'OR System',
        logo: '',
        currency: 'BRL',
        theme: 'dark'
    };

    let currentLogo = '';

    // =========================================================
    // CARREGAR
    // =========================================================
    function load() {
        const settings = { ...DEFAULT_SETTINGS, ...Storage.getSettings() };
        window.ORSM_Settings = settings;

        // Preenche formulário
        setValue('set-user-name', settings.userName);
        setValue('set-company-name', settings.companyName);
        setValue('set-currency', settings.currency);
        setValue('set-theme', settings.theme);

        currentLogo = settings.logo || '';

        // Preview do logo
        updateLogoPreview(currentLogo);

        // Aplica tema
        applyTheme(settings.theme);

        return settings;
    }

    function setValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    }

    function updateLogoPreview(logo) {
        const preview = document.getElementById('set-logo-preview');
        if (!preview) return;
        if (logo) {
            preview.innerHTML = `<img src="${logo}" alt="Logo">`;
        } else {
            preview.innerHTML = `<img src="./assets/logo/logo-or-system.png" alt="Logo">`;
        }
    }

    // =========================================================
    // TEMA
    // =========================================================
    function applyTheme(theme) {
        const finalTheme = theme === 'light' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', finalTheme);

        // Atualiza ícone do botão de tema
        const icon = document.querySelector('#theme-toggle i');
        if (icon) {
            icon.className = finalTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }

        // Salva preferência
        try {
            localStorage.setItem('orsm_theme', finalTheme);
        } catch (e) { /* ignore */ }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);

        // Salva nas configurações também
        Storage.saveSettings({ theme: next });
        if (window.ORSM_Settings) window.ORSM_Settings.theme = next;

        // Atualiza os gráficos para re-renderizar com novo tema
        if (typeof Dashboard !== 'undefined' && Dashboard.refresh) Dashboard.refresh();
        if (typeof Commissions !== 'undefined' && Commissions.render) Commissions.render();
    }

    // =========================================================
    // SALVAR
    // =========================================================
    function save(e) {
        if (e) e.preventDefault();

        try {
            const userName = Utils.sanitizeText(document.getElementById('set-user-name').value);
            const companyName = Utils.sanitizeText(document.getElementById('set-company-name').value);
            const currency = document.getElementById('set-currency').value;
            const theme = document.getElementById('set-theme').value;

            if (!companyName) throw new Error('Informe o nome da empresa.');

            const settings = {
                userName,
                companyName,
                logo: currentLogo,
                currency,
                theme
            };

            Storage.saveSettings(settings);
            window.ORSM_Settings = { ...window.ORSM_Settings, ...settings };

            applyTheme(theme);

            Utils.toast('Configurações salvas com sucesso!', 'success');

            // Atualiza views que usam moeda
            if (typeof Dashboard !== 'undefined') Dashboard.refresh();
            if (typeof Products !== 'undefined') Products.render();
            if (typeof Links !== 'undefined') Links.render();
            if (typeof Content !== 'undefined') Content.render();
            if (typeof Sales !== 'undefined') Sales.render();
            if (typeof Commissions !== 'undefined') Commissions.render();
            if (typeof Customers !== 'undefined') Customers.render();
            if (typeof Analytics !== 'undefined') Analytics.render();

        } catch (err) {
            console.error(err);
            Utils.toast(err.message || 'Erro ao salvar configurações.', 'error');
        }
    }

    // =========================================================
    // UPLOAD DE LOGO
    // =========================================================
    function bindLogoUpload() {
        const input = document.getElementById('set-logo');
        if (!input) return;

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const dataURL = await Utils.readFileAsDataURL(file);
                currentLogo = dataURL;
                updateLogoPreview(dataURL);
                Utils.toast('Logo carregada! Clique em "Salvar Configurações" para confirmar.', 'info');
            } catch (err) {
                Utils.toast(err.message, 'error');
            }
        });
    }

    // =========================================================
    // DADOS DE DEMONSTRAÇÃO
    // =========================================================
    async function loadDemoData() {
        // Se já tem dados, pergunta
        if (!Storage.isEmpty()) {
            const ok = await Utils.confirm({
                title: 'Carregar Dados de Demonstração',
                message: 'Você já possui dados cadastrados. Os dados de demonstração serão ADICIONADOS aos existentes.\n\nDeseja continuar?',
                confirmText: 'Adicionar Demo'
            });
            if (!ok) return;
        }

        try {
            Utils.showLoading();
            const result = DemoData.load();
            Utils.hideLoading();

            Utils.toast(
                `Carregados: ${result.products} produtos, ${result.sales} vendas, ${result.contents} conteúdos.`,
                'success',
                'Dados de demonstração carregados'
            );

            // Recarrega a página para atualizar tudo
            setTimeout(() => window.location.reload(), 1200);

        } catch (err) {
            Utils.hideLoading();
            console.error(err);
            Utils.toast('Erro ao carregar dados de demonstração.', 'error');
        }
    }

    async function removeDemoData() {
        if (!DemoData.hasDemoData()) {
            Utils.toast('Nenhum dado de demonstração encontrado.', 'warning');
            return;
        }

        const ok = await Utils.confirm({
            title: 'Remover Dados de Demonstração',
            message: 'Todos os dados marcados como [DEMO] serão removidos.\n\nSeus dados reais serão MANTIDOS.\n\nDeseja continuar?',
            confirmText: 'Remover Demo',
            danger: true
        });

        if (!ok) return;

        try {
            Utils.showLoading();
            const removed = DemoData.remove();
            Utils.hideLoading();

            Utils.toast(`${removed} registro(s) de demonstração removido(s).`, 'success');

            setTimeout(() => window.location.reload(), 1000);

        } catch (err) {
            Utils.hideLoading();
            console.error(err);
            Utils.toast('Erro ao remover dados de demonstração.', 'error');
        }
    }

    // =========================================================
    // APAGAR TUDO
    // =========================================================
    async function clearAll() {
        const ok = await Utils.confirm({
            title: '⚠ Apagar Todos os Dados',
            message: 'Isso irá apagar PERMANENTEMENTE todos os produtos, links, conteúdos, vendas e clientes.\n\nSuas configurações de perfil serão MANTIDAS.\n\nRecomendamos fazer um BACKUP antes.\n\nDeseja continuar?',
            confirmText: 'Apagar Dados',
            danger: true
        });

        if (!ok) return;

        const confirmAgain = await Utils.confirm({
            title: 'Confirmação Final',
            message: 'Última confirmação: todos os dados serão permanentemente removidos. NÃO será possível recuperar.',
            confirmText: 'SIM, APAGAR TUDO',
            danger: true
        });

        if (!confirmAgain) return;

        try {
            Utils.showLoading();
            Storage.clearAll();
            Utils.hideLoading();

            Utils.toast('Todos os dados foram apagados.', 'success');

            setTimeout(() => window.location.reload(), 1000);

        } catch (err) {
            Utils.hideLoading();
            console.error(err);
            Utils.toast('Erro ao apagar dados.', 'error');
        }
    }

    // =========================================================
    // INIT
    // =========================================================
    function init() {
        document.getElementById('form-settings')?.addEventListener('submit', save);
        document.getElementById('btn-load-demo')?.addEventListener('click', loadDemoData);
        document.getElementById('btn-remove-demo')?.addEventListener('click', removeDemoData);
        document.getElementById('btn-clear-all')?.addEventListener('click', clearAll);
        document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

        bindLogoUpload();
    }

    // =========================================================
    // EXPORT
    // =========================================================
    return {
        init,
        load,
        save,
        applyTheme,
        toggleTheme,
        loadDemoData,
        removeDemoData,
        clearAll,
        DEFAULT_SETTINGS
    };
})();