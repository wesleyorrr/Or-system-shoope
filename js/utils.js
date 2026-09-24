/* =========================================================
   OR SHOPEE MANAGER — Utilitários
   Helpers, formatação, validação, toasts e modais
   ========================================================= */

const Utils = (() => {

    // =========================================================
    // FORMATAÇÃO
    // =========================================================

    const currencySymbols = {
        BRL: { symbol: 'R$', locale: 'pt-BR' },
        USD: { symbol: '$', locale: 'en-US' },
        EUR: { symbol: '€', locale: 'de-DE' }
    };

    function getCurrency() {
        return (window.ORSM_Settings && window.ORSM_Settings.currency) || 'BRL';
    }

    function formatCurrency(value) {
        const num = Number(value) || 0;
        const curr = getCurrency();
        const cfg = currencySymbols[curr] || currencySymbols.BRL;
        try {
            return new Intl.NumberFormat(cfg.locale, {
                style: 'currency',
                currency: curr
            }).format(num);
        } catch {
            return `${cfg.symbol} ${num.toFixed(2)}`;
        }
    }

    function formatNumber(value) {
        const num = Number(value) || 0;
        return new Intl.NumberFormat('pt-BR').format(num);
    }

    function formatPercent(value, decimals = 1) {
        const num = Number(value) || 0;
        return `${num.toFixed(decimals)}%`;
    }

    function formatDate(date) {
        if (!date) return '—';
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '—';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function formatDateTime(date) {
        if (!date) return '—';
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '—';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    function formatDateShort(date) {
        if (!date) return '—';
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '—';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    }

    function todayISO() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function nowISO() {
        return new Date().toISOString();
    }

    function monthLabel(date) {
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const d = date instanceof Date ? date : new Date(date);
        return `${meses[d.getMonth()]} ${d.getFullYear()}`;
    }

    function monthShortLabel(date) {
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                       'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const d = date instanceof Date ? date : new Date(date);
        return `${meses[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
    }

    // =========================================================
    // SANITIZAÇÃO E VALIDAÇÃO
    // =========================================================

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function sanitizeText(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/[\u0000-\u001F\u007F]/g, '')
            .trim();
    }

    function isValidEmail(email) {
        if (!email) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
        if (!phone) return true;
        const digits = String(phone).replace(/\D/g, '');
        return digits.length >= 10 && digits.length <= 13;
    }

    function isValidUrl(url) {
        if (!url) return false;
        try {
            const u = new URL(url);
            return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
            return false;
        }
    }

    function isPositiveNumber(n) {
        return typeof n === 'number' && !isNaN(n) && n >= 0;
    }

    // =========================================================
    // IDs E GERAÇÃO
    // =========================================================

    function uid() {
        return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
    }

    // =========================================================
    // DOM
    // =========================================================

    function $(selector, context = document) {
        return context.querySelector(selector);
    }

    function $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }

    function createElement(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'class') el.className = value;
            else if (key === 'dataset') Object.assign(el.dataset, value);
            else if (key.startsWith('on') && typeof value === 'function') {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else if (value !== null && value !== undefined) {
                el.setAttribute(key, value);
            }
        });
        children.forEach(child => {
            if (typeof child === 'string') el.appendChild(document.createTextNode(child));
            else if (child instanceof Node) el.appendChild(child);
        });
        return el;
    }

    // =========================================================
    // TOASTS
    // =========================================================

    function toast(message, type = 'info', title = null) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = {
            success: 'fa-check',
            error: 'fa-times',
            warning: 'fa-exclamation',
            info: 'fa-info'
        };

        const titles = {
            success: 'Sucesso',
            error: 'Erro',
            warning: 'Atenção',
            info: 'Informação'
        };

        const el = createElement('div', { class: `toast ${type}` }, [
            createElement('div', { class: 'toast-icon' }, [
                createElement('i', { class: `fas ${icons[type] || icons.info}` })
            ]),
            createElement('div', { class: 'toast-body' }, [
                createElement('strong', {}, [title || titles[type] || 'Info']),
                createElement('span', {}, [message])
            ])
        ]);

        container.appendChild(el);

        setTimeout(() => {
            el.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => el.remove(), 300);
        }, 3500);
    }

    // =========================================================
    // MODAL
    // =========================================================

    function openModal({ title, body, footer, size = '', onOpen }) {
        const modal = document.getElementById('modal');
        const modalContent = modal.querySelector('.modal-content');

        document.getElementById('modal-title').textContent = title || '';

        const bodyEl = document.getElementById('modal-body');
        const footerEl = document.getElementById('modal-footer');

        if (typeof body === 'string') bodyEl.innerHTML = body;
        else if (body instanceof Node) {
            bodyEl.innerHTML = '';
            bodyEl.appendChild(body);
        } else {
            bodyEl.innerHTML = '';
        }

        if (typeof footer === 'string') footerEl.innerHTML = footer;
        else if (footer instanceof Node) {
            footerEl.innerHTML = '';
            footerEl.appendChild(footer);
        } else {
            footerEl.innerHTML = '';
        }

        modalContent.className = 'modal-content';
        if (size === 'lg') modalContent.classList.add('modal-lg');
        if (size === 'sm') modalContent.classList.add('modal-sm');

        modal.classList.remove('hidden');

        modal.querySelectorAll('[data-close-modal]').forEach(el => {
            el.onclick = closeModal;
        });

        document.addEventListener('keydown', escListener);

        if (typeof onOpen === 'function') onOpen();
    }

    function escListener(e) {
        if (e.key === 'Escape') closeModal();
    }

    function closeModal() {
        const modal = document.getElementById('modal');
        modal.classList.add('hidden');
        document.removeEventListener('keydown', escListener);
    }

    function confirm({ title = 'Confirmar', message = 'Tem certeza?', confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false }) {
        return new Promise(resolve => {
            const footer = createElement('div', { style: 'display:flex;gap:12px;width:100%;justify-content:flex-end;flex-wrap:wrap;' });

            const cancelBtn = createElement('button', {
                class: 'btn btn-secondary',
                type: 'button'
            }, [cancelText]);
            cancelBtn.onclick = () => { closeModal(); resolve(false); };

            const confirmBtn = createElement('button', {
                class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`,
                type: 'button'
            }, [confirmText]);
            confirmBtn.onclick = () => { closeModal(); resolve(true); };

            footer.appendChild(cancelBtn);
            footer.appendChild(confirmBtn);

            openModal({
                title,
                body: `<p style="color:var(--texto-secundario);font-size:14px;line-height:1.6;white-space:pre-line;">${escapeHTML(message)}</p>`,
                footer,
                size: 'sm'
            });
        });
    }

    function alert({ title = 'Aviso', message = '', okText = 'OK' }) {
        return new Promise(resolve => {
            const footer = createElement('div', { style: 'display:flex;gap:12px;width:100%;justify-content:flex-end;' });

            const okBtn = createElement('button', {
                class: 'btn btn-primary',
                type: 'button'
            }, [okText]);
            okBtn.onclick = () => { closeModal(); resolve(true); };

            footer.appendChild(okBtn);

            openModal({
                title,
                body: `<p style="color:var(--texto-secundario);font-size:14px;line-height:1.6;white-space:pre-line;">${escapeHTML(message)}</p>`,
                footer,
                size: 'sm'
            });
        });
    }

    // =========================================================
    // LOADING
    // =========================================================

    function showLoading() {
        document.getElementById('loading')?.classList.remove('hidden');
    }

    function hideLoading() {
        document.getElementById('loading')?.classList.add('hidden');
    }

    // =========================================================
    // FILE READER
    // =========================================================

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error('Nenhum arquivo'));
            if (!file.type.startsWith('image/')) return reject(new Error('Arquivo não é imagem'));
            if (file.size > 2 * 1024 * 1024) return reject(new Error('Imagem muito grande (máx 2MB)'));

            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsDataURL(file);
        });
    }

    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    }

    // =========================================================
    // DOWNLOAD
    // =========================================================

    function downloadFile(content, filename, mime = 'text/plain') {
        const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // =========================================================
    // CSV
    // =========================================================

    function toCSV(rows, columns) {
        const escape = v => {
            if (v === null || v === undefined) return '';
            const s = String(v).replace(/"/g, '""');
            return `"${s}"`;
        };

        const header = columns.map(c => escape(c.label)).join(';');
        const body = rows.map(row =>
            columns.map(c => escape(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(';')
        ).join('\n');

        return '\uFEFF' + header + '\n' + body;
    }

    // =========================================================
    // DEBOUNCE
    // =========================================================

    function debounce(fn, delay = 300) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), delay);
        };
    }

    // =========================================================
    // PERÍODOS DE DATA
    // =========================================================

    function getPeriodRange(period, customStart = null, customEnd = null) {
        const now = new Date();
        const start = new Date();
        const end = new Date();

        switch (period) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case '7d':
                start.setDate(now.getDate() - 7);
                start.setHours(0, 0, 0, 0);
                break;
            case '30d':
                start.setDate(now.getDate() - 30);
                start.setHours(0, 0, 0, 0);
                break;
            case 'month':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                break;
            case 'last-month':
                start.setMonth(now.getMonth() - 1);
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(now.getMonth());
                end.setDate(0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'all':
                start.setFullYear(2000, 0, 1);
                start.setHours(0, 0, 0, 0);
                break;
            case 'custom':
                if (customStart) {
                    const cs = new Date(customStart + 'T00:00:00');
                    start.setTime(cs.getTime());
                } else {
                    start.setDate(1);
                    start.setHours(0, 0, 0, 0);
                }
                if (customEnd) {
                    const ce = new Date(customEnd + 'T23:59:59');
                    end.setTime(ce.getTime());
                }
                break;
            default:
                start.setDate(now.getDate() - 30);
                start.setHours(0, 0, 0, 0);
        }

        return { start, end };
    }

    function isDateInRange(date, start, end) {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return false;
        return d >= start && d <= end;
    }

    // =========================================================
    // CORES (para gráficos)
    // =========================================================

    const chartColors = {
        azul: '#007BFF',
        verde: '#10b981',
        amarelo: '#f59e0b',
        vermelho: '#ef4444',
        roxo: '#8b5cf6',
        ciano: '#06b6d4',
        rosa: '#ec4899'
    };

    function getChartColor(index) {
        const palette = [
            chartColors.azul,
            chartColors.verde,
            chartColors.amarelo,
            chartColors.roxo,
            chartColors.ciano,
            chartColors.rosa,
            chartColors.vermelho
        ];
        return palette[index % palette.length];
    }

    function getChartTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        return {
            grid: isDark ? 'rgba(26, 39, 64, 0.4)' : 'rgba(226, 232, 240, 0.6)',
            ticks: isDark ? '#8A94A6' : '#64748B',
            tooltipBg: isDark ? '#0E1729' : '#FFFFFF',
            tooltipBorder: isDark ? '#1A2740' : '#E2E8F0',
            tooltipTitle: isDark ? '#FFFFFF' : '#0F172A',
            tooltipBody: isDark ? '#E6EBF2' : '#0F172A'
        };
    }

    // =========================================================
    // PLATAFORMAS E STATUS (constantes)
    // =========================================================

    const PLATFORMS = {
        instagram: { label: 'Instagram', icon: 'fa-instagram', color: '#E1306C' },
        tiktok: { label: 'TikTok', icon: 'fa-tiktok', color: '#000000' },
        youtube: { label: 'YouTube', icon: 'fa-youtube', color: '#FF0000' },
        facebook: { label: 'Facebook', icon: 'fa-facebook', color: '#1877F2' },
        whatsapp: { label: 'WhatsApp', icon: 'fa-whatsapp', color: '#25D366' },
        shopee: { label: 'Shopee', icon: 'fa-bag-shopping', color: '#EE4D2D' },
        outro: { label: 'Outro', icon: 'fa-globe', color: '#8A94A6' }
    };

    const CATEGORIES = [
        'Casa', 'Eletrônicos', 'Beleza', 'Moda',
        'Infantil', 'Informática', 'Ferramentas', 'Outros'
    ];

    const CONTENT_TYPES = [
        'Reels', 'Story', 'Post', 'Vídeo', 'Short', 'Status', 'Outro'
    ];

    const CONTENT_STATUS = {
        ideia: { label: 'Ideia', class: 'ideia' },
        producao: { label: 'Em produção', class: 'producao' },
        agendado: { label: 'Agendado', class: 'agendado' },
        publicado: { label: 'Publicado', class: 'publicado' }
    };

    const PRODUCT_STATUS = {
        ativo: { label: 'Ativo', class: 'ativo' },
        pausado: { label: 'Pausado', class: 'pausado' },
        encerrado: { label: 'Encerrado', class: 'encerrado' }
    };

    function getPlatformInfo(key) {
        return PLATFORMS[key] || PLATFORMS.outro;
    }

    function getPlatformLabel(key) {
        return getPlatformInfo(key).label;
    }

    function getPlatformIcon(key) {
        return getPlatformInfo(key).icon;
    }

    // =========================================================
    // EXPORT
    // =========================================================
    return {
        // Formatação
        formatCurrency,
        formatNumber,
        formatPercent,
        formatDate,
        formatDateTime,
        formatDateShort,
        todayISO,
        nowISO,
        monthLabel,
        monthShortLabel,

        // Validação
        escapeHTML,
        sanitizeText,
        isValidEmail,
        isValidPhone,
        isValidUrl,
        isPositiveNumber,

        // IDs
        uid,

        // DOM
        $,
        $$,
        createElement,

        // UI
        toast,
        openModal,
        closeModal,
        confirm,
        alert,
        showLoading,
        hideLoading,

        // Files
        readFileAsDataURL,
        readFileAsText,
        downloadFile,
        toCSV,
        debounce,

        // Datas
        getPeriodRange,
        isDateInRange,

        // Cores/Gráficos
        chartColors,
        getChartColor,
        getChartTheme,

        // Constantes
        PLATFORMS,
        CATEGORIES,
        CONTENT_TYPES,
        CONTENT_STATUS,
        PRODUCT_STATUS,
        getPlatformInfo,
        getPlatformLabel,
        getPlatformIcon
    };
})();