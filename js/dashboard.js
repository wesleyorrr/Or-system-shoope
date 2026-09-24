/* =========================================================
   OR SHOPEE MANAGER — Dashboard
   KPIs, gráficos, produtos em destaque, alertas, últimas vendas
   ========================================================= */

const Dashboard = (() => {

    let salesChart = null;
    let currentPeriod = '30d';

    // =========================================================
    // KPIs PRINCIPAIS
    // =========================================================
    async function loadKPIs() {
        const products = Storage.getAll(Storage.KEYS.products);
        const links = Storage.getAll(Storage.KEYS.links);
        const contents = Storage.getAll(Storage.KEYS.contents);
        const sales = Storage.getAll(Storage.KEYS.sales);

        const { start, end } = Utils.getPeriodRange(currentPeriod);

        // Filtra vendas no período
        const salesInPeriod = sales.filter(s =>
            Utils.isDateInRange(s.date || s.createdAt, start, end)
        );

        // Produtos divulgados = produtos que possuem ao menos 1 link OU conteúdo
        const publishedProductIds = new Set([
            ...links.map(l => l.productId).filter(Boolean),
            ...contents.map(c => c.productId).filter(Boolean)
        ]);

        // Cliques = soma de cliques em conteúdos + links (dentro do período não é possível com data por clique, então soma total)
        const totalClicks =
            links.reduce((sum, l) => sum + (Number(l.clicks) || 0), 0) +
            contents.reduce((sum, c) => sum + (Number(c.clicks) || 0), 0);

        // Vendas no período
        const salesCount = salesInPeriod.length;
        const revenue = salesInPeriod.reduce((sum, s) => sum + (Number(s.saleValue) || 0), 0);
        const commission = salesInPeriod.reduce((sum, s) => sum + (Number(s.commissionValue) || 0), 0);

        // Conversão = vendas / cliques * 100
        const conversion = totalClicks > 0 ? (salesCount / totalClicks) * 100 : 0;

        // Preenche DOM
        setText('kpi-products', Utils.formatNumber(products.length));
        setText('kpi-published', Utils.formatNumber(publishedProductIds.size));
        setText('kpi-contents', Utils.formatNumber(contents.length));
        setText('kpi-clicks', Utils.formatNumber(totalClicks));
        setText('kpi-sales', Utils.formatNumber(salesCount));
        setText('kpi-revenue', Utils.formatCurrency(revenue));
        setText('kpi-commission', Utils.formatCurrency(commission));
        setText('kpi-conversion', Utils.formatPercent(conversion));

        // Badges sidebar
        setText('badge-products', products.length);
        setText('badge-links', links.length);
        setText('badge-contents', contents.length);
        setText('badge-customers', Storage.getAll(Storage.KEYS.customers).length);
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    // =========================================================
    // GRÁFICO DE VENDAS
    // =========================================================
    function loadSalesChart() {
        const canvas = document.getElementById('chart-sales');
        const empty = document.getElementById('chart-sales-empty');
        if (!canvas) return;

        const sales = Storage.getAll(Storage.KEYS.sales);
        const { start, end } = Utils.getPeriodRange(currentPeriod);

        const filtered = sales.filter(s =>
            Utils.isDateInRange(s.date || s.createdAt, start, end)
        );

        if (filtered.length === 0) {
            empty.classList.remove('hidden');
            if (salesChart) {
                salesChart.destroy();
                salesChart = null;
            }
            return;
        }
        empty.classList.add('hidden');

        // Agrupa por dia
        const grouped = {};
        filtered.forEach(s => {
            const d = new Date(s.date || s.createdAt);
            const key = d.toISOString().slice(0, 10);
            if (!grouped[key]) grouped[key] = { revenue: 0, commission: 0 };
            grouped[key].revenue += Number(s.saleValue) || 0;
            grouped[key].commission += Number(s.commissionValue) || 0;
        });

        const labels = Object.keys(grouped).sort();
        const revenueData = labels.map(k => grouped[k].revenue);
        const commissionData = labels.map(k => grouped[k].commission);

        const theme = Utils.getChartTheme();

        if (salesChart) salesChart.destroy();

        salesChart = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels.map(l => Utils.formatDateShort(l)),
                datasets: [
                    {
                        label: 'Vendas (R$)',
                        data: revenueData,
                        borderColor: Utils.chartColors.azul,
                        backgroundColor: 'rgba(0, 123, 255, 0.12)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true,
                        pointRadius: 4,
                        pointBackgroundColor: Utils.chartColors.azul,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Comissão (R$)',
                        data: commissionData,
                        borderColor: Utils.chartColors.verde,
                        backgroundColor: 'rgba(16, 185, 129, 0.10)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true,
                        pointRadius: 4,
                        pointBackgroundColor: Utils.chartColors.verde,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: theme.tooltipBg,
                        borderColor: theme.tooltipBorder,
                        borderWidth: 1,
                        titleColor: theme.tooltipTitle,
                        bodyColor: theme.tooltipBody,
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: ctx => `${ctx.dataset.label}: ${Utils.formatCurrency(ctx.parsed.y)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: theme.grid, drawBorder: false },
                        ticks: { color: theme.ticks, font: { size: 11 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: theme.grid, drawBorder: false },
                        ticks: {
                            color: theme.ticks,
                            font: { size: 11 },
                            callback: v => Utils.formatCurrency(v)
                        }
                    }
                }
            }
        });
    }

    // =========================================================
    // PRODUTOS EM DESTAQUE
    // =========================================================
    function loadTopProducts() {
        const tbody = document.getElementById('tbl-top-products');
        const empty = document.getElementById('top-products-empty');
        if (!tbody) return;

        const sales = Storage.getAll(Storage.KEYS.sales);
        const links = Storage.getAll(Storage.KEYS.links);
        const contents = Storage.getAll(Storage.KEYS.contents);

        // Agrupa dados por produto
        const map = new Map();

        // Vendas e comissões
        sales.forEach(s => {
            if (!s.productId) return;
            if (!map.has(s.productId)) {
                map.set(s.productId, {
                    id: s.productId,
                    name: s.productName || '—',
                    sales: 0,
                    commission: 0,
                    clicks: 0
                });
            }
            const p = map.get(s.productId);
            p.sales += 1;
            p.commission += Number(s.commissionValue) || 0;
        });

        // Cliques (de links + conteúdos)
        [...links, ...contents].forEach(item => {
            if (!item.productId) return;
            if (!map.has(item.productId)) {
                map.set(item.productId, {
                    id: item.productId,
                    name: item.productName || '—',
                    sales: 0,
                    commission: 0,
                    clicks: 0
                });
            }
            const p = map.get(item.productId);
            p.clicks += Number(item.clicks) || 0;
        });

        const top = Array.from(map.values())
            .sort((a, b) => b.commission - a.commission)
            .slice(0, 5);

        tbody.innerHTML = '';

        if (top.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        top.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${Utils.escapeHTML(p.name)}</strong></td>
                <td>${Utils.formatNumber(p.clicks)}</td>
                <td>${Utils.formatNumber(p.sales)}</td>
                <td class="text-success"><strong>${Utils.formatCurrency(p.commission)}</strong></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // =========================================================
    // CONTEÚDOS EM DESTAQUE
    // =========================================================
    function loadTopContents() {
        const tbody = document.getElementById('tbl-top-contents');
        const empty = document.getElementById('top-contents-empty');
        if (!tbody) return;

        const contents = Storage.getAll(Storage.KEYS.contents);

        const top = contents
            .filter(c => c.status === 'publicado')
            .sort((a, b) => (Number(b.clicks) || 0) - (Number(a.clicks) || 0))
            .slice(0, 5);

        tbody.innerHTML = '';

        if (top.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        top.forEach(c => {
            const platform = Utils.getPlatformInfo(c.platform);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${Utils.escapeHTML(c.name)}</strong></td>
                <td>
                    <span class="status-badge info">
                        <i class="fab ${platform.icon}"></i> ${platform.label}
                    </span>
                </td>
                <td>${Utils.formatNumber(c.clicks)}</td>
                <td>${Utils.formatNumber(c.sales)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // =========================================================
    // ÚLTIMAS VENDAS
    // =========================================================
    function loadLastSales() {
        const tbody = document.getElementById('tbl-last-sales');
        const empty = document.getElementById('last-sales-empty');
        if (!tbody) return;

        const sales = Storage.getAll(Storage.KEYS.sales);

        const last = sales
            .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
            .slice(0, 5);

        tbody.innerHTML = '';

        if (last.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        last.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${Utils.formatDate(s.date || s.createdAt)}</td>
                <td><strong>${Utils.escapeHTML(s.productName || '—')}</strong></td>
                <td>${Utils.formatCurrency(s.saleValue)}</td>
                <td class="text-success">${Utils.formatCurrency(s.commissionValue)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // =========================================================
    // ALERTAS INTELIGENTES
    // =========================================================
    function loadAlerts() {
        const container = document.getElementById('alerts-list');
        const empty = document.getElementById('alerts-empty');
        const badge = document.getElementById('badge-alerts');
        if (!container) return;

        const products = Storage.getAll(Storage.KEYS.products);
        const links = Storage.getAll(Storage.KEYS.links);
        const contents = Storage.getAll(Storage.KEYS.contents);
        const sales = Storage.getAll(Storage.KEYS.sales);

        const alerts = [];

        // 1. Produto sem divulgação (nenhum link, nenhum conteúdo)
        products.forEach(p => {
            const hasLink = links.some(l => l.productId === p.id);
            const hasContent = contents.some(c => c.productId === p.id);
            if (!hasLink && !hasContent) {
                alerts.push({
                    type: 'warning',
                    icon: 'fa-bullhorn',
                    title: 'Produto sem divulgação',
                    message: `"${p.name}" não possui links nem conteúdos cadastrados.`
                });
            }
        });

        // 2. Link sem cliques
        links.forEach(l => {
            if ((Number(l.clicks) || 0) === 0) {
                alerts.push({
                    type: 'info',
                    icon: 'fa-link',
                    title: 'Link sem cliques',
                    message: `"${l.productName || l.url}" ainda não recebeu cliques.`
                });
            }
        });

        // 3. Produto com muitos cliques e poucas vendas (conversão < 2%)
        const productStats = new Map();

        links.forEach(l => {
            if (!l.productId) return;
            if (!productStats.has(l.productId)) {
                productStats.set(l.productId, { clicks: 0, sales: 0, name: l.productName });
            }
            const stat = productStats.get(l.productId);
            stat.clicks += Number(l.clicks) || 0;
        });

        sales.forEach(s => {
            if (!s.productId) return;
            if (!productStats.has(s.productId)) {
                productStats.set(s.productId, { clicks: 0, sales: 0, name: s.productName });
            }
            const stat = productStats.get(s.productId);
            stat.sales += 1;
        });

        productStats.forEach((stat, productId) => {
            if (stat.clicks >= 100) {
                const conv = (stat.sales / stat.clicks) * 100;
                if (conv < 2) {
                    alerts.push({
                        type: 'danger',
                        icon: 'fa-triangle-exclamation',
                        title: 'Produto com baixa conversão',
                        message: `"${stat.name}" recebeu ${stat.clicks} cliques mas apenas ${stat.sales} vendas (${conv.toFixed(1)}%).`
                    });
                }
            }
        });

        // 4. Conteúdo sem publicação há mais de 14 dias (agendado/em produção)
        const now = new Date();
        contents.forEach(c => {
            if (c.status === 'agendado' || c.status === 'producao') {
                const pub = new Date(c.publishDate);
                if (!isNaN(pub.getTime()) && pub < now) {
                    const days = Math.floor((now - pub) / (1000 * 60 * 60 * 24));
                    alerts.push({
                        type: 'warning',
                        icon: 'fa-calendar-xmark',
                        title: 'Conteúdo atrasado',
                        message: `"${c.name}" estava agendado para ${Utils.formatDate(pub)} (${days} dia${days > 1 ? 's' : ''} atrás).`
                    });
                }
            }
        });

        // 5. Produto pausado/encerrado com vendas recentes
        products.forEach(p => {
            if (p.status !== 'ativo') {
                const recentSale = sales.find(s =>
                    s.productId === p.id &&
                    Utils.isDateInRange(s.date || s.createdAt,
                        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        new Date()
                    )
                );
                if (recentSale) {
                    alerts.push({
                        type: 'info',
                        icon: 'fa-info-circle',
                        title: 'Produto pausado com vendas recentes',
                        message: `"${p.name}" está ${p.status} mas teve vendas nos últimos 30 dias.`
                    });
                }
            }
        });

        // Limita a 10 alertas
        const limited = alerts.slice(0, 10);

        container.innerHTML = '';

        if (limited.length === 0) {
            empty.classList.remove('hidden');
            badge.textContent = '0';
            badge.classList.remove('danger');
            // Remove notificação
            document.getElementById('alert-dot')?.classList.add('hidden');
            return;
        }
        empty.classList.add('hidden');
        badge.textContent = limited.length;
        badge.classList.add('danger');

        // Ativa dot de notificação
        document.getElementById('alert-dot')?.classList.remove('hidden');

        limited.forEach(a => {
            const el = document.createElement('div');
            el.className = `alert-item ${a.type}`;
            el.innerHTML = `
                <div class="alert-icon"><i class="fas ${a.icon}"></i></div>
                <div class="alert-content">
                    <strong>${Utils.escapeHTML(a.title)}</strong>
                    <p>${Utils.escapeHTML(a.message)}</p>
                </div>
            `;
            container.appendChild(el);
        });
    }

    // =========================================================
    // REFRESH COMPLETO
    // =========================================================
    function refresh() {
        loadKPIs();
        loadSalesChart();
        loadTopProducts();
        loadTopContents();
        loadLastSales();
        loadAlerts();
    }

    // =========================================================
    // EVENTOS
    // =========================================================
    function bindPeriodButtons() {
        document.querySelectorAll('#dashboard-period-buttons [data-period]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#dashboard-period-buttons [data-period]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentPeriod = btn.dataset.period;
                loadKPIs();
                loadSalesChart();
            });
        });
    }

    // =========================================================
    // INIT
    // =========================================================
    function init() {
        bindPeriodButtons();
    }

    // =========================================================
    // EXPORT
    // =========================================================
    return {
        init,
        refresh,
        loadKPIs,
        loadSalesChart,
        loadTopProducts,
        loadTopContents,
        loadLastSales,
        loadAlerts,
        getPeriod: () => currentPeriod,
        setPeriod: (p) => { currentPeriod = p; }
    };
})();