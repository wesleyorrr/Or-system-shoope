/* =========================================================
   OR SHOPEE MANAGER — Backup e Restauração
   Export/Import JSON + Export CSV por módulo
   ========================================================= */

const Backup = (() => {

    // =========================================================
    // EXPORTAR BACKUP (JSON)
    // =========================================================
    function exportBackup() {
        try {
            const data = Storage.exportAll();

            const filename = `or-shopee-manager-backup-${Utils.todayISO()}.json`;
            const content = JSON.stringify(data, null, 2);

            Utils.downloadFile(content, filename, 'application/json');
            Utils.toast('Backup exportado com sucesso!', 'success');

        } catch (err) {
            console.error(err);
            Utils.toast('Erro ao exportar backup.', 'error');
        }
    }

    // =========================================================
    // RESTAURAR BACKUP (JSON)
    // =========================================================
    async function importBackup(file) {
        if (!file) return;

        try {
            const text = await Utils.readFileAsText(file);
            let data;

            try {
                data = JSON.parse(text);
            } catch {
                throw new Error('Arquivo JSON inválido.');
            }

            if (!data || typeof data !== 'object') {
                throw new Error('Formato de backup inválido.');
            }

            // Verifica se é um backup do OR Shopee Manager
            if (data.app && data.app !== 'OR Shopee Manager') {
                const proceed = await Utils.confirm({
                    title: 'Backup de Outro Sistema',
                    message: `Este arquivo parece ser de "${data.app}". Deseja tentar restaurar mesmo assim?`,
                    confirmText: 'Tentar Restaurar',
                    danger: true
                });
                if (!proceed) return;
            }

            // Resumo do backup
            const summary = [
                `📦 Produtos: ${(data.products || []).length}`,
                `🔗 Links: ${(data.links || []).length}`,
                `🎬 Conteúdos: ${(data.contents || []).length}`,
                `🛒 Vendas: ${(data.sales || []).length}`,
                `👥 Clientes: ${(data.customers || []).length}`
            ].join('\n');

            const exportInfo = data.exportedAt
                ? `\n\nExportado em: ${Utils.formatDateTime(data.exportedAt)}`
                : '';

            const ok = await Utils.confirm({
                title: '⚠ Restaurar Backup',
                message: `A restauração irá SUBSTITUIR TODOS os dados atuais pelos dados do backup.\n\nResumo do backup:\n\n${summary}${exportInfo}\n\nDeseja continuar?`,
                confirmText: 'Restaurar',
                danger: true
            });

            if (!ok) return;

            const confirmAgain = await Utils.confirm({
                title: 'Confirmação Final',
                message: 'Esta é a última confirmação. Os dados atuais serão PERMANENTEMENTE substituídos.',
                confirmText: 'SIM, RESTAURAR',
                danger: true
            });

            if (!confirmAgain) return;

            Utils.showLoading();
            Storage.importAll(data);
            Utils.hideLoading();

            Utils.toast('Backup restaurado com sucesso! Recarregando...', 'success');

            setTimeout(() => window.location.reload(), 1200);

        } catch (err) {
            Utils.hideLoading();
            console.error(err);
            Utils.toast(err.message || 'Erro ao restaurar backup.', 'error');
        }
    }

    // =========================================================
    // INIT
    // =========================================================
    function init() {
        document.getElementById('btn-export-backup')?.addEventListener('click', exportBackup);

        const importInput = document.getElementById('import-backup');
        if (importInput) {
            importInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    importBackup(file);
                    e.target.value = '';
                }
            });
        }
    }

    // =========================================================
    // EXPORT
    // =========================================================
    return {
        init,
        exportBackup,
        importBackup
    };
})();