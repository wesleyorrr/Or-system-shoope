/* =========================================================
   OR SHOPEE MANAGER — Comissões
   Área financeira com gráfico de evolução
   ========================================================= */

const Commissions = (() => {

    let chartInstance = null;

    // =========================================================
    // KPIs
    // =========================================================
    function loadKPIs() {
        const sales = Storage.getAll(Storage.KEYS.sales);
        const now = new Date();

        // Dia atual
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date();
        dayEnd.setHours(23, 59, 59, 999);

        // Últimos 7 dias
        const weekStart = new Date();
        weekStart.setDate(now.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);

        // Mês atual
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        let dayTotal = 0;
        let weekTotal = 0;
        let monthTotal = 0;
        let allTotal = 0;

        sales.forEach(s => {
            const d = new Date(s.date || s.createdAt);
            if (isNaN(d.getTime())) return;

            const value = Number(s.commissionValue) || 0;
            allTotal += value;

            if (d >= dayStart && d <= dayEnd) dayTotal += value;
            if (d >= weekStart) weekTotal += value;
            if (d >= monthStart) monthTotal += value;
        });

        setText('comm-day', Utils.formatCurrency(dayTotal));
        setText('comm-week', Utils.formatCurrency(weekTotal));
        setText('comm-month', Utils.formatCurrency(monthTotal));
        setText('comm-total', Utils.formatCurrency(allTotal));
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    // =========================================================
    // GRÁFICO DE EVOLUÇÃO MENSAL
    // =========================================================
    function loadChart() {
        const canvas = document.getElementById('chart-commissions');
        const empty = document.getElementById('chart-commissions-empty');
        if (!canvas) return;

        const sales = Storage.getAll(Storage.KEYS.sales);

        if (sales.length === 0) {
            empty.classList.remove('hidden');
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
            return;
        }
        empty.classList.add('hidden');

        // Agrupa por mês (últimos 12 meses)
        const now = new Date();
        const months = [];

        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                date: d,
                label: Utils.monthShortLabel(d),
                total: 0
            });
        }

        sales.forEach(s => {
            const d = new Date(s.date || s.createdAt);
            if (isNaN(d.getTime())) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const m = months.find(x => x.key === key);
            if (m) m.total += Number(s.commissionValue) || 0;
        });

        const labels = months.map(m => m.label);
        const data = months.map(m => m.total);
        const theme = Utils.getChartTheme();

        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Comissão (R$)',
                    data,
                    backgroundColor: months.map(m => {
                        const isCurrent = m.date.getMonth() === now.getMonth() && m.date.getFullYear() === now.getFullYear();
                        return isCurrent ? Utils.chartColors.verde : 'rgba(0, 123, 255, 0.55)';
                    }),
                    borderColor: months.map(m => {
                        const isCurrent = m.date.getMonth() === now.getMonth() && m.date.getFullYear() === now.getFullYear();
                        return isCurrent ? Utils.chartColors.verde : Utils.chartColors.azul;
                    }),
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                            label: ctx => `Comissão: ${Utils.formatCurrency(ctx.parsed.y)}`
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
    // COMISSÃO POR PRODUTO
    // =========================================================
    function loadByProduct() {
        const tbody = document.getElementById('tbl-comm-products');
        const empty = document.getElementById('comm-products-empty');
        if (!tbody) return;

        const sales = Storage.getAll(Storage.KEYS.sales);
        const map = new Map();

        sales.forEach(s => {
            const pid = s.productId || 'unknown';
            if (!map.has(pid)) {
                map.set(pid, {
                    name: s.productName || '—',
                    sales: 0,
                    commission: 0
                });
            }
            const p = map.get(pid);
            p.sales += 1;
            p.commission += Number(s.commissionValue) || 0;
        });

        const list = Array.from(map.values()).sort((a, b) => b.commission - a.commission);

        tbody.innerHTML = '';

        if (list.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        list.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${Utils.escapeHTML(p.name)}</strong></td>
                <td>${Utils.formatNumber(p.sales)}</td>
                <td class="text-success"><strong>${Utils.formatCurrency(p.commission)}</strong></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // =========================================================
    // COMISSÃO POR PLATAFORMA
    // =========================================================
    function loadByPlatform() {
        const tbody = document.getElementById('tbl-comm-platforms');
        const empty = document.getElementById('comm-platforms-empty');
        if (!tbody) return;

        const sales = Storage.getAll(Storage.KEYS.sales);
        const map = new Map();

        sales.forEach(s => {
            const platform = s.platform || 'outro';
            if (!map.has(platform)) {
                map.set(platform, { sales: 0, commission: 0 });
            }
            const p = map.get(platform);
            p.sales += 1;
            p.commission += Number(s.commissionValue) || 0;
        });

        const list = Array.from(map.entries())
            .map(([key, data]) => ({ key, ...data }))
            .sort((a, b) => b.commission - a.commission);

        tbody.innerHTML = '';

        if (list.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        list.forEach(item => {
            const platform = Utils.getPlatformInfo(item.key);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span class="status-badge info">
                        <i class="fab ${platform.icon}"></i> ${platform.label}
                    </span>
                </td>
                <td>${Utils.formatNumber(item.sales)}</td>
                <td class="text-success"><strong>${Utils.formatCurrency(item.commission)}</strong></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // =========================================================
    // REFRESH
    // =========================================================
    function render() {
        loadKPIs();
        loadChart();
        loadByProduct();
        loadByPlatform();
    }

    // =========================================================
    // INIT
    // =========================================================
    function init() {
        // Sem eventos específicos; renderiza ao trocar de view
    }

    // =========================================================
    // EXPORT
    // =========================================================
    return {
        init,
        render,
        loadKPIs,
        loadChart,
        loadByProduct,
        loadByPlatform
    };
})();