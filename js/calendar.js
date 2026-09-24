/* =========================================================
   OR SHOPEE MANAGER — Calendário de Conteúdo
   Visualização mensal
   ========================================================= */

const Calendar = (() => {

    let currentDate = new Date(); // mês atual
    let selectedDate = null;

    // =========================================================
    // RENDER
    // =========================================================
    function render() {
        const grid = document.getElementById('calendar-grid');
        const monthYear = document.getElementById('cal-month-year');
        if (!grid) return;

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Atualiza o título
        monthYear.textContent = Utils.monthLabel(currentDate);

        // Primeiro dia do mês
        const firstDay = new Date(year, month, 1);
        // Último dia do mês
        const lastDay = new Date(year, month + 1, 0);

        // Dia da semana do primeiro dia (0=domingo)
        const startWeekday = firstDay.getDay();

        // Total de dias para mostrar (inclui dias do mês anterior para preencher)
        const daysFromPrevMonth = startWeekday;
        const totalDays = lastDay.getDate();

        // Pega conteúdos do mês
        const contents = Storage.getAll(Storage.KEYS.contents);

        // Agrupa conteúdos por dia (YYYY-MM-DD)
        const eventsByDay = {};
        contents.forEach(c => {
            if (!c.publishDate) return;
            const d = new Date(c.publishDate);
            if (isNaN(d.getTime())) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!eventsByDay[key]) eventsByDay[key] = [];
            eventsByDay[key].push(c);
        });

        // Limpa grid
        grid.innerHTML = '';

        // Dias do mês anterior (só para preencher visualmente)
        const prevMonthLast = new Date(year, month, 0).getDate();
        for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
            const dayNum = prevMonthLast - i;
            grid.appendChild(createDayCell(dayNum, new Date(year, month - 1, dayNum), true));
        }

        // Dias do mês atual
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        for (let d = 1; d <= totalDays; d++) {
            const date = new Date(year, month, d);
            const isToday = isCurrentMonth && today.getDate() === d;
            grid.appendChild(createDayCell(d, date, false, isToday, eventsByDay));
        }

        // Dias do próximo mês (para completar a última semana)
        const totalCells = daysFromPrevMonth + totalDays;
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remainingCells; i++) {
            grid.appendChild(createDayCell(i, new Date(year, month + 1, i), true));
        }
    }

    function createDayCell(dayNum, date, isOtherMonth, isToday = false, eventsByDay = {}) {
        const el = document.createElement('div');
        el.className = 'calendar-day';
        if (isOtherMonth) el.classList.add('other-month');
        if (isToday) el.classList.add('today');

        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const events = eventsByDay[key] || [];

        let eventsHTML = '';
        if (events.length > 0) {
            const shown = events.slice(0, 3);
            eventsHTML = shown.map(e => {
                const platform = Utils.getPlatformInfo(e.platform);
                return `<div class="calendar-event ${e.platform}" title="${Utils.escapeHTML(e.name)}">
                    <i class="fab ${platform.icon}"></i> ${Utils.escapeHTML(e.name.slice(0, 15))}${e.name.length > 15 ? '...' : ''}
                </div>`;
            }).join('');
            if (events.length > 3) {
                eventsHTML += `<div style="font-size:10px;color:var(--texto-terciario);text-align:center;">+${events.length - 3} mais</div>`;
            }
        }

        el.innerHTML = `
            <div class="day-number">${dayNum}</div>
            <div class="calendar-events">${eventsHTML}</div>
        `;

        // Clique no dia → abre formulário pré-preenchido ou lista de eventos
        if (!isOtherMonth) {
            el.addEventListener('click', () => onDayClick(date, events));
        }

        return el;
    }

    function onDayClick(date, events) {
        if (events.length === 0) {
            // Abre formulário de novo conteúdo já com a data
            Content.openForm();
            // Aguarda o modal renderizar e preenche a data
            setTimeout(() => {
                const input = document.getElementById('cont-publish-date');
                if (input) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    input.value = `${year}-${month}-${day}T14:00`;
                }
            }, 100);
        } else if (events.length === 1) {
            // Edita o conteúdo
            Content.openForm(events[0].id);
        } else {
            // Mostra lista para o usuário escolher
            showDayEvents(date, events);
        }
    }

    function showDayEvents(date, events) {
        const itemsHTML = events.map(e => {
            const platform = Utils.getPlatformInfo(e.platform);
            const status = Utils.CONTENT_STATUS[e.status] || {};
            return `
                <div class="search-result-item" data-content-id="${e.id}">
                    <div class="search-result-icon" style="background:${platform.color}20;color:${platform.color};">
                        <i class="fab ${platform.icon}"></i>
                    </div>
                    <div class="search-result-info">
                        <strong>${Utils.escapeHTML(e.name)}</strong>
                        <small>${platform.label} · ${status.label || e.status} · ${e.type}</small>
                    </div>
                </div>
            `;
        }).join('');

        Utils.openModal({
            title: `Conteúdos de ${Utils.formatDate(date)}`,
            body: `<div style="display:flex;flex-direction:column;gap:6px;">${itemsHTML}</div>`,
            footer: `<button type="button" class="btn btn-secondary" data-close-modal>Fechar</button>`,
            size: 'sm',
            onOpen: () => {
                document.querySelectorAll('[data-content-id]').forEach(item => {
                    item.onclick = () => {
                        Utils.closeModal();
                        setTimeout(() => Content.openForm(item.dataset.contentId), 200);
                    };
                });
            }
        });
    }

    // =========================================================
    // NAVEGAÇÃO
    // =========================================================
    function prevMonth() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        render();
    }

    function nextMonth() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        render();
    }

    function goToday() {
        currentDate = new Date();
        render();
    }

    // =========================================================
    // NOVO AGENDAMENTO RÁPIDO
    // =========================================================
    function newSchedule() {
        Content.openForm();
    }

    // =========================================================
    // INIT
    // =========================================================
    function init() {
        document.getElementById('cal-prev')?.addEventListener('click', prevMonth);
        document.getElementById('cal-next')?.addEventListener('click', nextMonth);
        document.getElementById('cal-today')?.addEventListener('click', goToday);
        document.getElementById('btn-new-schedule')?.addEventListener('click', newSchedule);
    }

    // =========================================================
    // EXPORT
    // =========================================================
    return {
        init,
        render,
        prevMonth,
        nextMonth,
        goToday
    };
})();