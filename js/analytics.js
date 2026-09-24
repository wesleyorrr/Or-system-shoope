/* =========================================================
   OR SHOPEE MANAGER — OR Analytics
   Análises automáticas baseadas em dados reais
   ========================================================= */

const Analytics = (() => {

    // =========================================================
    // HELPERS
    // =========================================================
    function emptyCard(message = 'Dados insuficientes para calcular.') {
        return `
            <div class="analytics-card empty">
                <div class="analytics-label"><i class="fas fa-info-circle"></i> Sem dados</div>
                <div class="analytics-value" style="font-size:0.9rem;font-weight:500;color:var(--texto-terciario);">${Utils.escapeHTML(message)}</div>
            </div>
        `;
    }

    function metricCard({ icon = 'fa-chart-line', label, value, meta = '' }) {
        return `
            <div class="analytics-card">
                <div class="analytics-label"><i class="fas ${icon}"></i> ${Utils.escapeHTML(label)}</div>
                <div class="analytics-value">${Utils.escapeHTML(value)}</div>
                ${meta ? `<div class="analytics-meta">${Utils.escapeHTML(meta)}</div>` : ''}
            </div>
        `;
    }

    // =========================================================
    // ANÁLISE DE PRODUTOS
    // =========================================================
    function analyzeProducts() {
        const container = document.getElementById('analytics-products');
        if (!container) return;

        const products = Storage.getAll(Storage.KEYS.products);
        const sales = Storage.getAll(Storage.KEYS.sales);
        const links = Storage.getAll(Storage.KEYS.links);
        const contents = Storage.getAll(Storage.KEYS.contents);

        if (products.length === 0 && sales.length === 0) {
            container.innerHTML = emptyCard('Cadastre produtos e registre vendas para gerar análises.');
            return;
        }

        // Agrupa por produto
        const map = new Map();

        products.forEach(p => {
            map.set(p.id, {
                id: p.id,
                name: p.name,
                sales: 0,
                commission: 0,
                clicks: 0,
                revenue: 0
            });
        });

        sales.forEach(s => {
            if (!s.productId) return;
            if (!map.has(s.productId)) {
                map.set(s.productId, {
                    id: s.productId,
                    name: s.productName || '—',
                    sales: 0, commission: 0, clicks: 0, revenue: 0
                });
            }
            const item = map.get(s.productId);
            item.sales += 1;
            item.commission += Number(s.commissionValue) || 0;
            item.revenue += Number(s.saleValue) || 0;
        });

        [...links, ...contents].forEach(l => {
            if (!l.productId) return;
            if (!map.has(l.productId)) return;
            const item = map.get(l.productId);
            item.clicks += Number(l.clicks) || 0;
        });

        const list = Array.from(map.values());
        const withSales = list.filter(x => x.sales > 0);
        const withClicks = list.filter(x => x.clicks > 0);

        let cards = [];

        // Mais vendido
        if (withSales.length > 0) {
            const top = withSales.reduce((a, b) => b.sales > a.sales ? b : a);
            cards.push(metricCard({
                icon: 'fa-trophy',
                label: 'Produto Mais Vendido',
                value: top.name,
                meta: `${top.sales} venda${top.sales > 1 ? 's' : ''}`
            }));
        } else {
            cards.push(emptyCard('Nenhuma venda registrada ainda.'));
        }

        // Maior comissão
        if (withSales.length > 0) {
            const top = withSales.reduce((a, b) => b.commission > a.commission ? b : a);
            cards.push(metricCard({
                icon: 'fa-hand-holding-dollar',
                label: 'Maior Comissão',
                value: top.name,
                meta: Utils.formatCurrency(top.commission)
            }));
        } else {
            cards.push(emptyCard('Sem comissões para calcular.'));
        }

        // Maior conversão (vendas / cliques)
        const withConv = withClicks
            .map(x => ({ ...x, conversion: x.clicks > 0 ? x.sales / x.clicks * 100 : 0 }))
            .filter(x => x.sales > 0);

        if (withConv.length > 0) {
            const top = withConv.reduce((a, b) => b.conversion > a.conversion ? b : a);
            cards.push(metricCard({
                icon: 'fa-percent',
                label: 'Maior Conversão',
                value: top.name,
                meta: `${top.conversion.toFixed(1)}% (${top.sales}/${top.clicks})`
            }));
        } else {
            cards.push(emptyCard('Dados insuficientes para calcular conversão.'));
        }

        // Mais cliques
        if (withClicks.length > 0) {
            const top = withClicks.reduce((a, b) => b.clicks > a.clicks ? b : a);
            cards.push(metricCard({
                icon: 'fa-mouse-pointer',
                label: 'Produto com Mais Cliques',
                value: top.name,
                meta: `${Utils.formatNumber(top.clicks)} cliques`
            }));
        } else {
            cards.push(emptyCard('Nenhum clique registrado ainda.'));
        }

        // Baixo desempenho = produtos com muitos cliques mas 0 vendas
        const lowPerf = withClicks
            .filter(x => x.clicks >= 50 && x.sales === 0);

        if (lowPerf.length > 0) {
            const worst = lowPerf.reduce((a, b) => b.clicks > a.clicks ? b : a);
            cards.push(metricCard({
                icon: 'fa-triangle-exclamation',
                label: 'Baixo Desempenho',
                value: worst.name,
                meta: `${Utils.formatNumber(worst.clicks)} cliques · 0 vendas`
            }));
        } else if (withClicks.length > 0) {
            cards.push(metricCard({
                icon: 'fa-check-circle',
                label: 'Baixo Desempenho',
                value: 'Nenhum produto crítico',
                meta: 'Todos os produtos com cliques converteram.'
            }));
        } else {
            cards.push(emptyCard('Sem cliques registrados.'));
        }

        container.innerHTML = cards.join('');
    }

    // =========================================================
    // ANÁLISE DE CONTEÚDOS
    // =========================================================
    function analyzeContents() {
        const container = document.getElementById('analytics-contents');
        if (!container) return;

        const contents = Storage.getAll(Storage.KEYS.contents);

        if (contents.length === 0) {
            container.innerHTML = emptyCard('Cadastre conteúdos para gerar análises.');
            return;
        }

        const withClicks = contents.filter(c => (Number(c.clicks) || 0) > 0);
        const withSales = contents.filter(c => (Number(c.sales) || 0) > 0);

        let cards = [];

        // Mais cliques
        if (withClicks.length > 0) {
            const top = withClicks.reduce((a, b) => (Number(b.clicks) || 0) > (Number(a.clicks) || 0) ? b : a);
            const platform = Utils.getPlatformInfo(top.platform);
            cards.push(metricCard({
                icon: 'fa-mouse-pointer',
                label: 'Conteúdo com Mais Cliques',
                value: top.name,
                meta: `${Utils.formatNumber(top.clicks)} cliques · ${platform.label}`
            }));
        } else {
            cards.push(emptyCard('Nenhum clique registrado ainda.'));
        }

        // Mais vendas
        if (withSales.length > 0) {
            const top = withSales.reduce((a, b) => (Number(b.sales) || 0) > (Number(a.sales) || 0) ? b : a);
            cards.push(metricCard({
                icon: 'fa-cart-shopping',
                label: 'Conteúdo com Mais Vendas',
                value: top.name,
                meta: `${top.sales} venda${top.sales > 1 ? 's' : ''}`
            }));
        } else {
            cards.push(emptyCard('Nenhuma venda registrada por conteúdo.'));
        }

        // Maior conversão
        const withConv = withClicks
            .map(c => ({
                ...c,
                conversion: (Number(c.clicks) || 0) > 0
                    ? ((Number(c.sales) || 0) / (Number(c.clicks) || 0)) * 100
                    : 0
            }))
            .filter(c => c.sales > 0);

        if (withConv.length > 0) {
            const top = withConv.reduce((a, b) => b.conversion > a.conversion ? b : a);
            cards.push(metricCard({
                icon: 'fa-percent',
                label: 'Maior Conversão',
                value: top.name,
                meta: `${top.conversion.toFixed(1)}% (${top.sales}/${top.clicks})`
            }));
        } else {
            cards.push(emptyCard('Dados insuficientes para calcular conversão.'));
        }

        // Plataforma com melhor desempenho (mais comissão)
        const platformMap = new Map();
        contents.forEach(c => {
            const platform = c.platform || 'outro';
            if (!platformMap.has(platform)) {
                platformMap.set(platform, { commission: 0, sales: 0, count: 0 });
            }
            const p = platformMap.get(platform);
            p.commission += Number(c.commission) || 0;
            p.sales += Number(c.sales) || 0;
            p.count += 1;
        });

        const platforms = Array.from(platformMap.entries())
            .map(([key, data]) => ({ key, ...data, info: Utils.getPlatformInfo(key) }))
            .sort((a, b) => b.commission - a.commission);

        if (platforms.length > 0 && platforms[0].commission > 0) {
            const top = platforms[0];
            cards.push(metricCard({
                icon: 'fa-trophy',
                label: 'Melhor Plataforma',
                value: top.info.label,
                meta: `${Utils.formatCurrency(top.commission)} · ${top.sales} venda${top.sales > 1 ? 's' : ''}`
            }));
        } else {
            cards.push(emptyCard('Sem dados por plataforma.'));
        }

        // Plataforma com mais conteúdos
        if (platforms.length > 0) {
            const topCount = [...platforms].sort((a, b) => b.count - a.count)[0];
            cards.push(metricCard({
                icon: 'fa-layer-group',
                label: 'Plataforma Mais Usada',
                value: topCount.info.label,
                meta: `${topCount.count} conteúdo${topCount.count > 1 ? 's' : ''}`
            }));
        } else {
            cards.push(emptyCard('Sem conteúdos cadastrados.'));
        }

        container.innerHTML = cards.join('');
    }

    // =========================================================
    // CONVERSÃO GERAL
    // =========================================================
    function analyzeConversion() {
        const container = document.getElementById('analytics-conversion');
        if (!container) return;

        const links = Storage.getAll(Storage.KEYS.links);
        const contents = Storage.getAll(Storage.KEYS.contents);
        const sales = Storage.getAll(Storage.KEYS.sales);

        const totalClicks =
            links.reduce((sum, l) => sum + (Number(l.clicks) || 0), 0) +
            contents.reduce((sum, c) => sum + (Number(c.clicks) || 0), 0);

        const totalSales = sales.length;

        if (totalClicks === 0 && totalSales === 0) {
            container.innerHTML = `
                <div class="analytics-metric">
                    <div class="big-value">—</div>
                    <div class="big-label">Dados insuficientes para calcular.<br>Registre cliques e vendas para ver a taxa.</div>
                </div>
            `;
            return;
        }

        const conversion = totalClicks > 0 ? (totalSales / totalClicks) * 100 : 0;

        // Classificação
        let classification = 'Baixa';
        let color = 'var(--vermelho)';
        if (conversion >= 5) { classification = 'Excelente'; color = 'var(--verde)'; }
        else if (conversion >= 2) { classification = 'Boa'; color = 'var(--azul)'; }
        else if (conversion >= 1) { classification = 'Média'; color = 'var(--amarelo)'; }

        container.innerHTML = `
            <div class="analytics-metric">
                <div class="big-value" style="color:${color};">${conversion.toFixed(2)}%</div>
                <div class="big-label">
                    <strong style="color:${color};">Conversão ${classification}</strong><br>
                    ${Utils.formatNumber(totalSales)} venda${totalSales !== 1 ? 's' : ''} em ${Utils.formatNumber(totalClicks)} clique${totalClicks !== 1 ? 's' : ''}
                    <br><small style="color:var(--texto-terciario);">Referência: 2% a 5% é considerado bom no mercado.</small>
                </div>
            </div>
        `;
    }

    // =========================================================
    // ROI (Retorno sobre Investimento)
    // =========================================================
    function analyzeROI() {
        const container = document.getElementById('analytics-roi');
        if (!container) return;

        const sales = Storage.getAll(Storage.KEYS.sales);

        if (sales.length === 0) {
            container.innerHTML = `
                <div class="analytics-metric">
                    <div class="big-value">—</div>
                    <div class="big-label">Dados insuficientes para calcular.<br>Registre vendas para ver o retorno.</div>
                </div>
            `;
            return;
        }

        // ROI simplificado: comissão total acumulada vs. número de vendas
        // Comissão é a receita direta para o afiliado.
        const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.saleValue) || 0), 0);
        const totalCommission = sales.reduce((sum, s) => sum + (Number(s.commissionValue) || 0), 0);

        // Simulamos "investimento" como 0 (é um trabalho orgânico)
        // Então ROI seria o próprio retorno percentual sobre cada real vendido.

        // Como afiliados não investem dinheiro, o ROI aqui representa:
        // Quanto a comissão representa em % do faturamento gerado (margem)

        const margin = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0;
        const averageCommission = sales.length > 0 ? totalCommission / sales.length : 0;

        // Classificação do ROI
        let classification = 'Baixo';
        let color = 'var(--amarelo)';
        if (margin >= 10) { classification = 'Excelente'; color = 'var(--verde)'; }
        else if (margin >= 7) { classification = 'Bom'; color = 'var(--azul)'; }
        else if (margin >= 4) { classification = 'Médio'; color = 'var(--amarelo)'; }
        else { classification = 'Baixo'; color = 'var(--vermelho)'; }

        container.innerHTML = `
            <div class="analytics-metric">
                <div class="big-value" style="color:${color};">${Utils.formatCurrency(totalCommission)}</div>
                <div class="big-label">
                    <strong style="color:${color};">Retorno ${classification}</strong><br>
                    Comissão média de <strong>${Utils.formatCurrency(averageCommission)}</strong> por venda.<br>
                    <small style="color:var(--texto-terciario);">Comissões representam ${margin.toFixed(1)}% do faturamento gerado.</small>
                </div>
            </div>
        `;
    }

    // =========================================================
    // REFRESH
    // =========================================================
    function render() {
        analyzeProducts();
        analyzeContents();
        analyzeConversion();
        analyzeROI();
    }

    // =========================================================
    // INIT
    // =========================================================
    function init() {
        // Sem eventos específicos
    }

    // =========================================================
    // EXPORT
    // =========================================================
    return {
        init,
        render,
        analyzeProducts,
        analyzeContents,
        analyzeConversion,
        analyzeROI
    };
})();