// ============================================
// GRÁFICOS CHART.JS
// ============================================
let chartTemas = null;
let chartActivos = null;

// Colores del tema Neon Blue
const chartColors = {
    blue: 'rgba(0, 212, 255, 0.8)',
    cyan: 'rgba(0, 255, 255, 0.8)',
    electric: 'rgba(0, 153, 255, 0.8)',
    gradient: ['rgba(0, 212, 255, 0.8)', 'rgba(0, 255, 255, 0.8)', 'rgba(0, 153, 255, 0.8)', 'rgba(102, 204, 255, 0.8)', 'rgba(51, 181, 255, 0.8)'],
    border: 'rgba(0, 212, 255, 1)',
    grid: 'rgba(0, 212, 255, 0.1)',
    text: 'rgba(160, 196, 255, 0.9)'
};

// Configuración global de Chart.js
Chart.defaults.color = chartColors.text;
Chart.defaults.borderColor = chartColors.grid;
Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

function inicializarGraficoTemas(datos) {
    const ctx = document.getElementById('chart-temas');
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (chartTemas) {
        chartTemas.destroy();
    }

    // Ordenar datos por cantidad
    const datosOrdenados = [...datos].sort((a, b) => b.count - a.count).slice(0, 10);
    const labels = datosOrdenados.map(d => capitalizeFirst(d.tema));
    const valores = datosOrdenados.map(d => d.count);

    chartTemas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Consultas',
                data: valores,
                backgroundColor: chartColors.gradient,
                borderColor: chartColors.border,
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                hoverBackgroundColor: 'rgba(0, 255, 255, 1)',
                hoverBorderColor: 'rgba(255, 255, 255, 0.8)',
                hoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: '📊 Distribución de Temas Más Consultados',
                    color: 'rgba(255, 255, 255, 0.9)',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 20, 35, 0.95)',
                    titleColor: 'rgba(0, 212, 255, 1)',
                    bodyColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(0, 212, 255, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed.y / total) * 100).toFixed(1);
                            return `Consultas: ${context.parsed.y} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: chartColors.grid,
                        drawBorder: false
                    },
                    ticks: {
                        color: chartColors.text,
                        font: {
                            size: 12
                        },
                        padding: 10
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: chartColors.text,
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function inicializarGraficoActivos(datos) {
    const ctx = document.getElementById('chart-activos');
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (chartActivos) {
        chartActivos.destroy();
    }

    // Tomar top 10 estudiantes
    const topEstudiantes = [...datos].slice(0, 10);
    const labels = topEstudiantes.map(d => d.Nombre.split(' ')[0]); // Primer nombre
    const valores = topEstudiantes.map(d => d.Contador);

    // Colores para el top 3
    const backgroundColors = valores.map((_, i) => {
        if (i === 0) return 'rgba(255, 215, 0, 0.8)'; // Oro
        if (i === 1) return 'rgba(192, 192, 192, 0.8)'; // Plata
        if (i === 2) return 'rgba(205, 127, 50, 0.8)'; // Bronce
        return chartColors.blue;
    });

    chartActivos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Preguntas',
                data: valores,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(c => c.replace('0.8', '1')),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                hoverBackgroundColor: backgroundColors.map(c => c.replace('0.8', '1')),
                hoverBorderColor: 'rgba(255, 255, 255, 0.8)',
                hoverBorderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: '🏆 Top 10 Estudiantes por Preguntas',
                    color: 'rgba(255, 255, 255, 0.9)',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 20, 35, 0.95)',
                    titleColor: 'rgba(0, 212, 255, 1)',
                    bodyColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(0, 212, 255, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: chartColors.text,
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        padding: 8
                    }
                },
                x: {
                    beginAtZero: true,
                    grid: {
                        color: chartColors.grid,
                        drawBorder: false
                    },
                    ticks: {
                        color: chartColors.text,
                        font: {
                            size: 12
                        },
                        padding: 10,
                        precision: 0
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// CONFIGURACIÓN DE WEBHOOKS N8N (CON PROXY LOCAL)
// ============================================
const CONFIG = {
    // 🔄 Usar Proxy API de Vercel (recomendado)
    // El proxy usa variables de entorno configuradas en Vercel
    baseUrl: '/api/n8n-proxy?path=',

    // ❌ URL directa (NO usar en producción - solo para desarrollo local sin proxy)
    // baseUrl: 'https://micro-bits-n8n.aejhww.easypanel.host/webhook',

    endpoints: {
        estudiantes: '/dashboard-estudiantes',
        preguntas: '/dashboard-preguntas',
        temas: '/dashboard-temas',
        contador: '/dashboard-contador',
        cursos: '/dashboard-cursos',
        toggleEstudiante: '/toggle-estudiante'
    },
    itemsPerPage: 10
};

// Conexión directa a N8N - sin necesidad de servidor local

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================
let state = {
    cursoActual: '',
    tabActual: 'estudiantes',
    datos: {
        estudiantes: [],
        preguntas: [],
        temas: [],
        contador: []
    },
    paginacion: {
        pagina: 1,
        totalPaginas: 1
    },
    busqueda: '',
    // Estado de navegación
    vistaActual: 'home', // 'home' o 'dashboard'
    // Estado del calendario
    calendario: {
        fechaActual: new Date(),
        mesActual: new Date().getMonth(),
        añoActual: new Date().getFullYear(),
        diaSeleccionado: new Date().getDate(),
        eventos: [],
        festivosCatalunya: []
    }
};

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarNavegacion();
    inicializarCalendario();
    inicializarFecha();
    inicializarEventos();
    inicializarMetricasInteractivas();
    cargarCursos();
    cargarEventosCalendario();
});

// ============================================
// NAVEGACIÓN
// ============================================
function inicializarNavegacion() {
    // Botón FAB para volver al inicio
    const fabHome = document.getElementById('fab-home');
    fabHome.addEventListener('click', () => {
        irAInicio();
    });
}

function irAInicio() {
    state.vistaActual = 'home';
    document.getElementById('home-container').classList.remove('hidden');
    document.getElementById('dashboard-container').classList.add('hidden');
    document.getElementById('fab-home').classList.remove('visible');
}

function irADashboard(cursoId, cursoNombre) {
    state.vistaActual = 'dashboard';
    state.cursoActual = cursoId;

    // Actualizar el título del dashboard
    document.getElementById('curso-titulo').textContent = cursoNombre;

    // Seleccionar el curso en el dropdown
    const select = document.getElementById('curso-select');
    select.value = cursoId;

    // Ocultar inicio y mostrar dashboard
    document.getElementById('home-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.remove('hidden');
    document.getElementById('fab-home').classList.add('visible');

    // Cargar datos del curso
    cargarTodosDatos();
}

// ============================================
// CALENDARIO
// ============================================
function inicializarCalendario() {
    // Generar festivos de Cataluña
    generarFestivosCatalunya();

    // Event listeners de navegación
    document.getElementById('cal-prev-month').addEventListener('click', () => {
        state.calendario.mesActual--;
        if (state.calendario.mesActual < 0) {
            state.calendario.mesActual = 11;
            state.calendario.añoActual--;
        }
        renderizarCalendario();
    });

    document.getElementById('cal-next-month').addEventListener('click', () => {
        state.calendario.mesActual++;
        if (state.calendario.mesActual > 11) {
            state.calendario.mesActual = 0;
            state.calendario.añoActual++;
        }
        renderizarCalendario();
    });

    document.getElementById('cal-today').addEventListener('click', () => {
        const hoy = new Date();
        state.calendario.mesActual = hoy.getMonth();
        state.calendario.añoActual = hoy.getFullYear();
        state.calendario.diaSeleccionado = hoy.getDate();
        renderizarCalendario();
        renderizarEventosDia();
    });

    // Modal de eventos
    document.getElementById('btn-add-event').addEventListener('click', () => {
        abrirModalEvento();
    });

    document.getElementById('modal-close').addEventListener('click', () => {
        cerrarModalEvento();
    });

    document.getElementById('modal-cancel').addEventListener('click', () => {
        cerrarModalEvento();
    });

    document.getElementById('event-form').addEventListener('submit', (e) => {
        e.preventDefault();
        guardarEvento();
    });

    // Renderizar calendario inicial
    renderizarCalendario();
    renderizarEventosDia();
}

function generarFestivosCatalunya() {
    const año = new Date().getFullYear();

    // Festivos nacionales fijos
    const festivos = [
        { fecha: `${año}-01-01`, nombre: 'Año Nuevo' },
        { fecha: `${año}-01-06`, nombre: 'Epifanía del Señor' },
        { fecha: `${año}-05-01`, nombre: 'Fiesta del Trabajo' },
        { fecha: `${año}-08-15`, nombre: 'Asunción de la Virgen' },
        { fecha: `${año}-11-01`, nombre: 'Todos los Santos' },
        { fecha: `${año}-12-06`, nombre: 'Día de la Constitución' },
        { fecha: `${año}-12-08`, nombre: 'Inmaculada Concepción' },
        { fecha: `${año}-12-25`, nombre: 'Natividad del Señor' },
        { fecha: `${año}-12-26`, nombre: 'Sant Esteve' }
    ];

    // Festivos de Cataluña
    festivos.push(
        { fecha: `${año}-02-12`, nombre: 'Santa Eulàlia' },
        { fecha: `${año}-06-24`, nombre: 'Sant Joan' },
        { fecha: `${año}-09-11`, nombre: 'Diada de Catalunya' }
    );

    // Semana Santa (cálculo aproximado)
    // Pascua = Primer domingo después de la luna llena siguiente al equinoccio de primavera
    const pascua = calcularPascua(año);

    // Jueves Santo (3 días antes)
    const juevesSanto = new Date(pascua);
    juevesSanto.setDate(juevesSanto.getDate() - 3);

    // Viernes Santo (2 días antes)
    const viernesSanto = new Date(pascua);
    viernesSanto.setDate(viernesSanto.getDate() - 2);

    // Lunes de Pascua (1 día después)
    const lunesPascua = new Date(pascua);
    lunesPascua.setDate(lunesPascua.getDate() + 1);

    festivos.push(
        { fecha: formatearFechaISO(juevesSanto), nombre: 'Jueves Santo' },
        { fecha: formatearFechaISO(viernesSanto), nombre: 'Viernes Santo' },
        { fecha: formatearFechaISO(lunesPascua), nombre: 'Lunes de Pascua' }
    );

    state.calendario.festivosCatalunya = festivos;
}

function calcularPascua(año) {
    // Método de Gauss para calcular la fecha de Pascua
    const a = año % 19;
    const b = Math.floor(año / 100);
    const c = año % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);

    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(año, mes - 1, dia);
}

function formatearFechaISO(fecha) {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
}

function renderizarCalendario() {
    const container = document.getElementById('calendar-days');
    const monthLabel = document.getElementById('cal-current-month');

    console.log('📅 Renderizando calendario');
    console.log('📅 Container encontrado:', container);
    console.log('📅 Mes:', state.calendario.mesActual, 'Año:', state.calendario.añoActual);

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    monthLabel.textContent = `${meses[state.calendario.mesActual]} ${state.calendario.añoActual}`;

    // Primer día del mes y número de días
    const primerDia = new Date(state.calendario.añoActual, state.calendario.mesActual, 1).getDay();
    const diasMes = new Date(state.calendario.añoActual, state.calendario.mesActual + 1, 0).getDate();
    const diasMesAnterior = new Date(state.calendario.añoActual, state.calendario.mesActual, 0).getDate();

    let html = '';

    // Días del mes anterior
    for (let i = primerDia - 1; i >= 0; i--) {
        const dia = diasMesAnterior - i;
        html += `<div class="calendar-day other-month">${dia}</div>`;
    }

    // Días del mes actual
    const hoy = new Date();
    for (let dia = 1; dia <= diasMes; dia++) {
        const fecha = `${state.calendario.añoActual}-${String(state.calendario.mesActual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        const esHoy = dia === hoy.getDate() &&
                     state.calendario.mesActual === hoy.getMonth() &&
                     state.calendario.añoActual === hoy.getFullYear();

        const esFestivo = state.calendario.festivosCatalunya.some(f => f.fecha === fecha);
        const tieneEvento = state.calendario.eventos.some(e => e.fecha === fecha);
        const esSeleccionado = dia === state.calendario.diaSeleccionado;

        let classes = 'calendar-day';
        if (esHoy) classes += ' today';
        if (esFestivo) classes += ' holiday';
        if (tieneEvento) classes += ' has-event';
        if (esSeleccionado) classes += ' selected';

        html += `<div class="${classes}" data-dia="${dia}">${dia}</div>`;
    }

    // Días del mes siguiente
    const totalCeldas = 42; // 6 filas completas
    const diasRenderizados = primerDia + diasMes;
    const diasSiguiente = totalCeldas - diasRenderizados;

    for (let dia = 1; dia <= diasSiguiente; dia++) {
        html += `<div class="calendar-day other-month">${dia}</div>`;
    }

    container.innerHTML = html;

    // Agregar event listeners a los días
    const diasClickeables = container.querySelectorAll('.calendar-day:not(.other-month)');
    console.log('📅 Días clickeables encontrados:', diasClickeables.length);

    diasClickeables.forEach(el => {
        el.addEventListener('click', () => {
            console.log('📅 Día clickeado:', el.dataset.dia);
            state.calendario.diaSeleccionado = parseInt(el.dataset.dia);
            renderizarCalendario();
            renderizarEventosDia();
        });
    });

    console.log('✅ Calendario renderizado correctamente');
}

function renderizarEventosDia() {
    const container = document.getElementById('events-list');
    const fecha = `${state.calendario.añoActual}-${String(state.calendario.mesActual + 1).padStart(2, '0')}-${String(state.calendario.diaSeleccionado).padStart(2, '0')}`;

    // Buscar festivos
    const festivo = state.calendario.festivosCatalunya.find(f => f.fecha === fecha);

    // Buscar eventos del día
    const eventos = state.calendario.eventos.filter(e => e.fecha === fecha);

    if (!festivo && eventos.length === 0) {
        container.innerHTML = `
            <div class="events-empty">
                <i class="fas fa-calendar-xmark"></i>
                <p>No hay eventos para este día</p>
            </div>
        `;
        return;
    }

    let html = '';

    // Renderizar festivo si existe
    if (festivo) {
        html += `
            <div class="event-item">
                <div class="event-item-icon holiday">
                    <i class="fas fa-crown"></i>
                </div>
                <div class="event-item-content">
                    <div class="event-item-title">${festivo.nombre}</div>
                    <div class="event-item-description">Festivo en Cataluña</div>
                </div>
            </div>
        `;
    }

    // Renderizar eventos
    eventos.forEach(evento => {
        const iconos = {
            exam: 'fa-file-alt',
            practice: 'fa-laptop-code',
            meeting: 'fa-users',
            holiday: 'fa-umbrella-beach',
            other: 'fa-thumbtack'
        };

        const icon = iconos[evento.tipo] || iconos.other;

        html += `
            <div class="event-item" data-id="${evento.id}">
                <div class="event-item-icon ${evento.tipo}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="event-item-content">
                    <div class="event-item-title">${evento.titulo}</div>
                    ${evento.descripcion ? `<div class="event-item-description">${evento.descripcion}</div>` : ''}
                    <div class="event-item-meta">
                        ${evento.curso ? `<span class="event-item-course"><i class="fas fa-graduation-cap"></i> ${evento.curso}</span>` : ''}
                        <span class="event-item-time"><i class="fas fa-calendar-day"></i> ${formatearFechaMostrar(evento.fecha)}</span>
                    </div>
                </div>
                <div class="event-item-actions">
                    <button class="event-action-btn edit" onclick="editarEvento('${evento.id}')" title="Editar">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="event-action-btn delete" onclick="eliminarEvento('${evento.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function formatearFechaMostrar(fechaISO) {
    const fecha = new Date(fechaISO + 'T00:00:00');
    const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
    return fecha.toLocaleDateString('es-ES', opciones);
}

// ============================================
// GESTIÓN DE EVENTOS
// ============================================
function cargarEventosCalendario() {
    const guardados = localStorage.getItem('microbits-calendario-eventos');
    if (guardados) {
        state.calendario.eventos = JSON.parse(guardados);
    }
}

function guardarEventosCalendario() {
    localStorage.setItem('microbits-calendario-eventos', JSON.stringify(state.calendario.eventos));
}

function abrirModalEvento(evento = null) {
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    const title = document.getElementById('modal-title');

    // Resetear formulario
    form.reset();

    if (evento) {
        // Editar evento existente
        title.innerHTML = '<i class="fas fa-calendar-edit"></i> Editar Evento';
        document.getElementById('event-title').value = evento.titulo;
        document.getElementById('event-date').value = evento.fecha;
        document.getElementById('event-type').value = evento.tipo;
        document.getElementById('event-description').value = evento.descripcion || '';
        document.getElementById('event-course').value = evento.curso || '';
        form.dataset.editId = evento.id;
    } else {
        // Nuevo evento
        title.innerHTML = '<i class="fas fa-calendar-plus"></i> Nuevo Evento';
        const fecha = `${state.calendario.añoActual}-${String(state.calendario.mesActual + 1).padStart(2, '0')}-${String(state.calendario.diaSeleccionado).padStart(2, '0')}`;
        document.getElementById('event-date').value = fecha;
        delete form.dataset.editId;
    }

    modal.classList.remove('hidden');
}

function cerrarModalEvento() {
    const modal = document.getElementById('event-modal');
    modal.classList.add('hidden');
}

function guardarEvento() {
    const form = document.getElementById('event-form');
    const editId = form.dataset.editId;

    const evento = {
        id: editId || Date.now().toString(),
        titulo: document.getElementById('event-title').value,
        fecha: document.getElementById('event-date').value,
        tipo: document.getElementById('event-type').value,
        descripcion: document.getElementById('event-description').value,
        curso: document.getElementById('event-course').value || null
    };

    if (editId) {
        // Actualizar evento existente
        const index = state.calendario.eventos.findIndex(e => e.id === editId);
        if (index !== -1) {
            state.calendario.eventos[index] = evento;
        }
        mostrarToast('Evento actualizado correctamente', 'success');
    } else {
        // Crear nuevo evento
        state.calendario.eventos.push(evento);
        mostrarToast('Evento creado correctamente', 'success');
    }

    guardarEventosCalendario();
    cerrarModalEvento();
    renderizarCalendario();
    renderizarEventosDia();
}

function editarEvento(id) {
    const evento = state.calendario.eventos.find(e => e.id === id);
    if (evento) {
        abrirModalEvento(evento);
    }
}

function eliminarEvento(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
        state.calendario.eventos = state.calendario.eventos.filter(e => e.id !== id);
        guardarEventosCalendario();
        renderizarCalendario();
        renderizarEventosDia();
        mostrarToast('Evento eliminado correctamente', 'success');
    }
}

function inicializarMetricasInteractivas() {
    // Event listeners para las tarjetas de métricas
    document.querySelectorAll('.metrica-card').forEach(card => {
        card.addEventListener('click', () => {
            const metrica = card.dataset.metrica;
            toggleDetalleMetrica(metrica, card);
        });
    });

    // Botón cerrar panel
    document.getElementById('btn-close-detail').addEventListener('click', () => {
        cerrarPanelDetalle();
    });
}

function toggleDetalleMetrica(metrica, card) {
    const panel = document.getElementById('metricas-detail-panel');
    const title = document.getElementById('detail-panel-title');
    const content = document.getElementById('detail-panel-content');

    // Remover clase activa de todas las tarjetas
    document.querySelectorAll('.metrica-card').forEach(c => {
        c.classList.remove('active-detail');
    });

    // Si el panel ya está abierto y es la misma métrica, cerrarlo
    if (!panel.classList.contains('hidden') && panel.dataset.metrica === metrica) {
        cerrarPanelDetalle();
        return;
    }

    // Activar tarjeta actual
    card.classList.add('active-detail');

    // Mostrar panel con contenido específico
    panel.classList.remove('hidden');
    panel.dataset.metrica = metrica;

    // Generar contenido según la métrica
    switch(metrica) {
        case 'estudiantes':
            title.innerHTML = '<i class="fas fa-user-graduate" style="color: var(--neon-blue)"></i> Estudiantes Activos - Detalle';
            content.innerHTML = generarDetalleEstudiantes();
            break;
        case 'preguntas':
            title.innerHTML = '<i class="fas fa-comments" style="color: var(--neon-cyan)"></i> Preguntas Totales - Distribución';
            content.innerHTML = generarDetallePreguntas();
            break;
        case 'promedio':
            title.innerHTML = '<i class="fas fa-chart-line" style="color: #ff9966"></i> Promedio de Preguntas - Estadísticas';
            content.innerHTML = generarDetallePromedio();
            break;
        case 'temas':
            title.innerHTML = '<i class="fas fa-book" style="color: var(--success-green)"></i> Temas Consultados - Lista Completa';
            content.innerHTML = generarDetalleTemas();
            break;
    }
}

function cerrarPanelDetalle() {
    const panel = document.getElementById('metricas-detail-panel');
    panel.classList.add('hidden');
    panel.dataset.metrica = '';
    document.querySelectorAll('.metrica-card').forEach(c => {
        c.classList.remove('active-detail');
    });
}

function generarDetalleEstudiantes() {
    const estudiantes = state.datos.contador
        .filter(e => e.Contador > 0)
        .sort((a, b) => b.Contador - a.Contador);

    if (estudiantes.length === 0) {
        return '<p class="tabla-empty visible" style="display: flex"><i class="fas fa-inbox"></i><p>No hay estudiantes activos</p></p>';
    }

    const total = estudiantes.length;
    const html = `
        <div class="detail-chart-container">
            <div style="flex: 1; max-width: 300px;">
                <canvas id="mini-chart-estudiantes"></canvas>
            </div>
            <div class="detail-chart-info">
                <div class="detail-stat">
                    <div class="detail-stat-value">${total}</div>
                    <div class="detail-stat-label">Total Activos</div>
                </div>
                <div class="detail-stat">
                    <div class="detail-stat-value">${estudiantes.reduce((sum, e) => sum + e.Contador, 0)}</div>
                    <div class="detail-stat-label">Preguntas Realizadas</div>
                </div>
            </div>
        </div>
        <div class="detail-list">
            ${estudiantes.slice(0, 15).map((est, i) => `
                <div class="detail-item">
                    <span class="detail-item-name">
                        <span style="color: var(--neon-cyan); margin-right: 8px;">#${i + 1}</span>
                        ${est.Nombre}
                    </span>
                    <span class="detail-item-value">${est.Contador}</span>
                </div>
            `).join('')}
        </div>
    `;

    // Crear mini gráfico después de insertar HTML
    setTimeout(() => crearMiniChartEstudiantes(estudiantes), 100);

    return html;
}

function generarDetallePreguntas() {
    const estudiantes = state.datos.contador
        .filter(e => e.Contador > 0)
        .sort((a, b) => b.Contador - a.Contador);

    if (estudiantes.length === 0) {
        return '<p class="tabla-empty visible" style="display: flex"><i class="fas fa-inbox"></i><p>No hay datos de preguntas</p></p>';
    }

    const totalPreguntas = estudiantes.reduce((sum, e) => sum + e.Contador, 0);

    const html = `
        <div class="detail-chart-container">
            <div style="flex: 1; max-width: 350px;">
                <canvas id="mini-chart-preguntas"></canvas>
            </div>
            <div class="detail-chart-info">
                <div class="detail-stat">
                    <div class="detail-stat-value">${totalPreguntas}</div>
                    <div class="detail-stat-label">Preguntas Totales</div>
                </div>
                <div class="detail-stat">
                    <div class="detail-stat-value">${estudiantes.length}</div>
                    <div class="detail-stat-label">Estudiantes Participaron</div>
                </div>
            </div>
        </div>
        <div class="detail-list">
            ${estudiantes.slice(0, 15).map(est => {
                const porcentaje = ((est.Contador / totalPreguntas) * 100).toFixed(1);
                return `
                    <div class="detail-item">
                        <span class="detail-item-name">${est.Nombre}</span>
                        <span class="detail-item-value">${est.Contador}</span>
                        <span class="detail-item-percentage">${porcentaje}%</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    setTimeout(() => crearMiniChartPreguntas(estudiantes, totalPreguntas), 100);

    return html;
}

function generarDetallePromedio() {
    const estudiantes = state.datos.contador.filter(e => e.Contador > 0);
    const totalEstudiantes = estudiantes.length;
    const totalPreguntas = estudiantes.reduce((sum, e) => sum + e.Contador, 0);
    const promedio = totalEstudiantes > 0 ? (totalPreguntas / totalEstudiantes).toFixed(1) : 0;

    // Calcular distribución
    const distribucion = {
        bajo: estudiantes.filter(e => e.Contador < 5).length,
        medio: estudiantes.filter(e => e.Contador >= 5 && e.Contador < 15).length,
        alto: estudiantes.filter(e => e.Contador >= 15).length
    };

    const html = `
        <div class="detail-chart-container">
            <div style="flex: 1; max-width: 350px;">
                <canvas id="mini-chart-promedio"></canvas>
            </div>
            <div class="detail-chart-info">
                <div class="detail-stat">
                    <div class="detail-stat-value">${promedio}</div>
                    <div class="detail-stat-label">Promedio General</div>
                </div>
                <div class="detail-stat">
                    <div class="detail-stat-value" style="font-size: 24px;">${totalPreguntas} ÷ ${totalEstudiantes}</div>
                    <div class="detail-stat-label">Cálculo</div>
                </div>
            </div>
        </div>
        <div class="detail-list">
            <div class="detail-item">
                <span class="detail-item-name">
                    <i class="fas fa-arrow-up" style="color: var(--success-green); margin-right: 8px;"></i>
                    Alta Actividad (15+ preguntas)
                </span>
                <span class="detail-item-value">${distribucion.alto}</span>
            </div>
            <div class="detail-item">
                <span class="detail-item-name">
                    <i class="fas fa-minus" style="color: #ff9966; margin-right: 8px;"></i>
                    Media Actividad (5-14 preguntas)
                </span>
                <span class="detail-item-value">${distribucion.medio}</span>
            </div>
            <div class="detail-item">
                <span class="detail-item-name">
                    <i class="fas fa-arrow-down" style="color: var(--text-gray); margin-right: 8px;"></i>
                    Baja Actividad (1-4 preguntas)
                </span>
                <span class="detail-item-value">${distribucion.bajo}</span>
            </div>
        </div>
    `;

    setTimeout(() => crearMiniChartPromedio(distribucion), 100);

    return html;
}

function generarDetalleTemas() {
    const temasAgrupados = {};
    state.datos.temas.forEach(t => {
        const tema = t.Tema.toLowerCase();
        temasAgrupados[tema] = (temasAgrupados[tema] || 0) + 1;
    });

    const temas = Object.entries(temasAgrupados)
        .map(([tema, count]) => ({ tema, count }))
        .sort((a, b) => b.count - a.count);

    if (temas.length === 0) {
        return '<p class="tabla-empty visible" style="display: flex"><i class="fas fa-inbox"></i><p>No hay temas registrados</p></p>';
    }

    const total = temas.reduce((sum, t) => sum + t.count, 0);

    const html = `
        <div class="detail-chart-container">
            <div style="flex: 1; max-width: 350px;">
                <canvas id="mini-chart-temas"></canvas>
            </div>
            <div class="detail-chart-info">
                <div class="detail-stat">
                    <div class="detail-stat-value">${temas.length}</div>
                    <div class="detail-stat-label">Temas Únicos</div>
                </div>
                <div class="detail-stat">
                    <div class="detail-stat-value">${total}</div>
                    <div class="detail-stat-label">Total Consultas</div>
                </div>
            </div>
        </div>
        <div class="detail-list">
            ${temas.map(t => {
                const porcentaje = ((t.count / total) * 100).toFixed(1);
                return `
                    <div class="detail-item">
                        <span class="detail-item-name"><span class="tema-badge" style="font-size: 11px; padding: 4px 10px;">${t.tema}</span></span>
                        <span class="detail-item-value">${t.count}</span>
                        <span class="detail-item-percentage">${porcentaje}%</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    setTimeout(() => crearMiniChartTemas(temas.slice(0, 8)), 100);

    return html;
}

// Mini gráficos para los paneles de detalle
function crearMiniChartEstudiantes(estudiantes) {
    const ctx = document.getElementById('mini-chart-estudiantes');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: estudiantes.slice(0, 6).map(e => e.Nombre.split(' ')[0]),
            datasets: [{
                data: estudiantes.slice(0, 6).map(e => e.Contador),
                backgroundColor: [
                    'rgba(0, 212, 255, 0.8)',
                    'rgba(0, 255, 255, 0.8)',
                    'rgba(0, 153, 255, 0.8)',
                    'rgba(102, 204, 255, 0.8)',
                    'rgba(51, 181, 255, 0.8)',
                    'rgba(0, 128, 255, 0.8)'
                ],
                borderColor: 'rgba(0, 212, 255, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(160, 196, 255, 0.9)',
                        font: { size: 11 },
                        padding: 10
                    }
                }
            }
        }
    });
}

function crearMiniChartPreguntas(estudiantes, total) {
    const ctx = document.getElementById('mini-chart-preguntas');
    if (!ctx) return;

    const top5 = estudiantes.slice(0, 5);
    const otros = total - top5.reduce((sum, e) => sum + e.Contador, 0);

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [...top5.map(e => e.Nombre.split(' ')[0]), 'Otros'],
            datasets: [{
                data: [...top5.map(e => e.Contador), otros],
                backgroundColor: [
                    'rgba(0, 212, 255, 0.8)',
                    'rgba(0, 255, 255, 0.8)',
                    'rgba(0, 153, 255, 0.8)',
                    'rgba(102, 204, 255, 0.8)',
                    'rgba(51, 181, 255, 0.8)',
                    'rgba(107, 125, 153, 0.5)'
                ],
                borderColor: 'rgba(0, 212, 255, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(160, 196, 255, 0.9)',
                        font: { size: 11 },
                        padding: 10
                    }
                }
            }
        }
    });
}

function crearMiniChartPromedio(distribucion) {
    const ctx = document.getElementById('mini-chart-promedio');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Alta', 'Media', 'Baja'],
            datasets: [{
                label: 'Estudiantes',
                data: [distribucion.alto, distribucion.medio, distribucion.bajo],
                backgroundColor: [
                    'rgba(0, 255, 136, 0.8)',
                    'rgba(255, 153, 102, 0.8)',
                    'rgba(107, 125, 153, 0.5)'
                ],
                borderColor: [
                    'rgba(0, 255, 136, 1)',
                    'rgba(255, 153, 102, 1)',
                    'rgba(107, 125, 153, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: 'rgba(160, 196, 255, 0.9)', precision: 0 },
                    grid: { color: 'rgba(0, 212, 255, 0.1)' }
                },
                x: {
                    ticks: { color: 'rgba(160, 196, 255, 0.9)' },
                    grid: { display: false }
                }
            }
        }
    });
}

function crearMiniChartTemas(temas) {
    const ctx = document.getElementById('mini-chart-temas');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: temas.map(t => capitalizeFirst(t.tema)),
            datasets: [{
                data: temas.map(t => t.count),
                backgroundColor: [
                    'rgba(0, 212, 255, 0.7)',
                    'rgba(0, 255, 255, 0.7)',
                    'rgba(0, 153, 255, 0.7)',
                    'rgba(102, 204, 255, 0.7)',
                    'rgba(51, 181, 255, 0.7)',
                    'rgba(0, 128, 255, 0.7)',
                    'rgba(77, 166, 255, 0.7)',
                    'rgba(26, 204, 255, 0.7)'
                ],
                borderColor: 'rgba(0, 212, 255, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(160, 196, 255, 0.9)',
                        font: { size: 10 },
                        padding: 8
                    }
                }
            },
            scales: {
                r: {
                    ticks: { display: false },
                    grid: { color: 'rgba(0, 212, 255, 0.1)' }
                }
            }
        }
    });
}

function inicializarFecha() {
    const fechaEl = document.getElementById('fecha-actual');
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha = new Date().toLocaleDateString('es-ES', opciones);
    fechaEl.textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
}

function inicializarEventos() {
    // Selector de curso (en el dashboard)
    document.getElementById('curso-select').addEventListener('change', (e) => {
        state.cursoActual = e.target.value;
        document.getElementById('curso-titulo').textContent =
            e.target.value ? e.target.options[e.target.selectedIndex].text : 'Seleccione un curso';
        if (e.target.value) {
            cargarTodosDatos();
        } else {
            limpiarDashboard();
        }
    });

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            cambiarTab(tab.dataset.tab);
        });
    });

    // Búsqueda
    document.getElementById('search-input').addEventListener('input', (e) => {
        state.busqueda = e.target.value.toLowerCase();
        state.paginacion.pagina = 1;
        renderizarTablaActual();
    });

    // Botón refrescar
    document.getElementById('btn-refresh').addEventListener('click', () => {
        if (state.cursoActual) {
            cargarTodosDatos();
        }
    });

    // Paginación
    document.getElementById('btn-anterior').addEventListener('click', () => {
        if (state.paginacion.pagina > 1) {
            state.paginacion.pagina--;
            renderizarTablaActual();
        }
    });

    document.getElementById('btn-siguiente').addEventListener('click', () => {
        if (state.paginacion.pagina < state.paginacion.totalPaginas) {
            state.paginacion.pagina++;
            renderizarTablaActual();
        }
    });
}

// ============================================
// FUNCIONES DE CARGA DE DATOS
// ============================================
async function cargarCursos() {
    console.log('🔄 Iniciando carga de cursos desde N8N...');

    // Mostrar indicador de carga
    const container = document.getElementById('courses-list');
    if (container) {
        container.innerHTML = `
            <div class="courses-loading">
                <div class="spinner"></div>
                <p>Cargando cursos...</p>
            </div>
        `;
    }

    try {
        // Intentar cargar desde el endpoint de N8N
        const cursos = await fetchData(CONFIG.endpoints.cursos);
        console.log('✅ Cursos recibidos de N8N:', cursos);

        if (!cursos || cursos.length === 0) {
            throw new Error('No se recibieron cursos del endpoint');
        }

        // Cargar estudiantes de cada curso
        console.log('📊 Cargando estudiantes de cada curso...');
        const cursosConEstudiantes = await Promise.allSettled(
            cursos.map(async (curso) => {
                const cursoId = curso.id || curso.nombre;
                try {
                    const estudiantes = await fetchData(CONFIG.endpoints.estudiantes, { curso: cursoId });
                    const totalEstudiantes = estudiantes ? estudiantes.length : 0;
                    const estudiantesHabilitados = estudiantes ?
                        estudiantes.filter(e => e.habilitado !== false && e.habilitado !== 'false').length : 0;

                    console.log(`📚 ${curso.nombre}: ${estudiantesHabilitados}/${totalEstudiantes} estudiantes habilitados`);

                    return {
                        ...curso,
                        totalEstudiantes,
                        estudiantesHabilitados
                    };
                } catch (error) {
                    console.warn(`⚠️ No se pudieron cargar estudiantes para ${curso.nombre}:`, error);
                    return {
                        ...curso,
                        totalEstudiantes: 0,
                        estudiantesHabilitados: 0
                    };
                }
            })
        );

        // Procesar resultados
        const cursosProcesados = cursosConEstudiantes.map((resultado, index) => {
            if (resultado.status === 'fulfilled') {
                return resultado.value;
            } else {
                return {
                    ...cursos[index],
                    totalEstudiantes: 0,
                    estudiantesHabilitados: 0
                };
            }
        });

        console.log('✅ Cursos con estudiantes:', cursosProcesados);

        // Cargar en el select del dashboard
        const select = document.getElementById('curso-select');
        select.innerHTML = '<option value="">-- Seleccionar curso --</option>';

        cursosProcesados.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.id || curso.nombre;
            option.textContent = curso.nombre;
            select.appendChild(option);
        });

        // Cargar también en el select del modal de eventos
        const eventCourseSelect = document.getElementById('event-course');
        eventCourseSelect.innerHTML = '<option value="">-- Seleccionar curso --</option>';

        cursosProcesados.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.nombre;
            option.textContent = curso.nombre;
            eventCourseSelect.appendChild(option);
        });

        // Renderizar en la pantalla de inicio
        renderizarCursosInicio(cursosProcesados);

        return cursosProcesados;
    } catch (error) {
        console.error('❌ Error cargando cursos desde N8N:', error);
        mostrarToast('Error al cargar los cursos', 'error');

        // Fallback a cursos de ejemplo
        const cursosEjemplo = [
            { id: 'informatica-101', nombre: 'Informática 101', estudiantesHabilitados: 0 },
            { id: 'programacion-basica', nombre: 'Programación Básica', estudiantesHabilitados: 0 },
            { id: 'bases-datos', nombre: 'Bases de Datos', estudiantesHabilitados: 0 },
            { id: 'desarrollo-web', nombre: 'Desarrollo Web', estudiantesHabilitados: 0 },
            { id: 'redes-sistemas', nombre: 'Redes y Sistemas', estudiantesHabilitados: 0 },
            { id: 'ciberseguridad', nombre: 'Ciberseguridad', estudiantesHabilitados: 0 }
        ];

        const select = document.getElementById('curso-select');
        select.innerHTML = '<option value="">-- Seleccionar curso --</option>';
        cursosEjemplo.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.id;
            option.textContent = curso.nombre;
            select.appendChild(option);
        });

        const eventCourseSelect = document.getElementById('event-course');
        eventCourseSelect.innerHTML = '<option value="">-- Seleccionar curso --</option>';
        cursosEjemplo.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.nombre;
            option.textContent = curso.nombre;
            eventCourseSelect.appendChild(option);
        });

        renderizarCursosInicio(cursosEjemplo);
        return cursosEjemplo;
    }
}

function renderizarCursosInicio(cursos) {
    const container = document.getElementById('courses-list');
    console.log('📚 Renderizando cursos:', cursos);

    // Verificar que los cursos tengan las propiedades necesarias
    if (!cursos || cursos.length === 0) {
        container.innerHTML = `
            <div class="courses-loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>No hay cursos disponibles</p>
            </div>
        `;
        return;
    }

    const html = cursos.map(curso => {
        const cursoId = curso.id || curso.nombre || curso.nombre_curso || 'unknown';
        const cursoNombre = curso.nombre || curso.nombre_curso || curso.curso || 'Curso sin nombre';
        const cursoNivel = curso.nivel || curso.Nivel || 'Activo';

        // Usar estudiantes habilitados
        const numEstudiantes = curso.estudiantesHabilitados !== undefined ?
            curso.estudiantesHabilitados :
            (curso.totalEstudiantes || curso.alumnos || curso.Alumnos || 0);

        return `
            <div class="course-item" onclick="irADashboard('${cursoId}', '${cursoNombre}')">
                <div class="course-item-info">
                    <div class="course-item-icon">
                        <i class="fas fa-laptop-code"></i>
                    </div>
                    <div>
                        <div class="course-item-name">${cursoNombre}</div>
                        <div class="course-item-badges">
                            <span class="course-badge">${cursoNivel}</span>
                            <span class="course-badge">${numEstudiantes} estudiantes</span>
                        </div>
                    </div>
                </div>
                <i class="fas fa-chevron-right course-arrow"></i>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
    console.log('✅ Cursos renderizados correctamente');
}

async function cargarTodosDatos() {
    mostrarLoading(true);

    try {
        console.log('🔄 Cargando datos para curso:', state.cursoActual);

        // Cargar datos independientemente (si uno falla, los otros continúan)
        const resultados = await Promise.allSettled([
            fetchData(CONFIG.endpoints.estudiantes, { curso: state.cursoActual }),
            fetchData(CONFIG.endpoints.preguntas, { curso: state.cursoActual }),
            fetchData(CONFIG.endpoints.temas, { curso: state.cursoActual }),
            fetchData(CONFIG.endpoints.contador, { curso: state.cursoActual })
        ]);

        // Procesar cada resultado independientemente
        state.datos.estudiantes = resultados[0].status === 'fulfilled' ? resultados[0].value : [];
        state.datos.preguntas = resultados[1].status === 'fulfilled' ? resultados[1].value : [];
        state.datos.temas = resultados[2].status === 'fulfilled' ? resultados[2].value : [];
        state.datos.contador = resultados[3].status === 'fulfilled' ? resultados[3].value : [];

        // Mostrar errores individuales si los hay
        resultados.forEach((result, index) => {
            if (result.status === 'rejected') {
                const endpoints = ['estudiantes', 'preguntas', 'temas', 'contador'];
                console.warn(`⚠️ Error cargando ${endpoints[index]}:`, result.reason);
            }
        });

        // Verificar si tenemos al menos algunos datos
        const tieneDatos = state.datos.estudiantes.length > 0 ||
                          state.datos.preguntas.length > 0 ||
                          state.datos.temas.length > 0;

        if (tieneDatos) {
            actualizarMetricas();
            renderizarTablaActual();
            mostrarToast('Datos actualizados correctamente', 'success');
        } else {
            // Si no hay datos de ningún endpoint, cargar ejemplos
            cargarDatosEjemplo();
        }
    } catch (error) {
        console.error('❌ Error general cargando datos:', error);
        mostrarToast(`Error: ${error.message}`, 'error');
        cargarDatosEjemplo();
    } finally {
        mostrarLoading(false);
    }
}

async function fetchData(endpoint, params = {}) {
    // Construir URL con query params para el proxy
    let url = CONFIG.baseUrl + encodeURIComponent(endpoint);

    // Agregar parámetros adicionales
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
        if (params[key]) queryParams.append(key, params[key]);
    });

    if (queryParams.toString()) {
        url += '&' + queryParams.toString();
    }

    console.log('🔍 Fetching via proxy:', url);

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Data received:', data);
    return data;
}

function cargarDatosEjemplo() {
    // Datos de ejemplo para desarrollo/pruebas
    state.datos.estudiantes = [
        { Nombre: 'Juan Pérez', Chat_id: '573001234567', habilitado: true },
        { Nombre: 'María García', Chat_id: '573009876543', habilitado: true },
        { Nombre: 'Carlos López', Chat_id: '573005551234', habilitado: false },
        { Nombre: 'Ana Martínez', Chat_id: '573007778899', habilitado: true },
        { Nombre: 'Pedro Sánchez', Chat_id: '573003334455', habilitado: true }
    ];

    state.datos.contador = [
        { Nombre: 'Juan Pérez', Chat_id: '573001234567', Contador: 25 },
        { Nombre: 'María García', Chat_id: '573009876543', Contador: 18 },
        { Nombre: 'Ana Martínez', Chat_id: '573007778899', Contador: 15 },
        { Nombre: 'Pedro Sánchez', Chat_id: '573003334455', Contador: 12 },
        { Nombre: 'Carlos López', Chat_id: '573005551234', Contador: 8 }
    ];

    state.datos.preguntas = [
        { Nombre: 'Juan Pérez', Chat_id: '573001234567', 'Preguntas Frecuentes': '¿Qué es una base de datos relacional?', 'Fecha de Pregunta': '2026-01-30T14:30:00.000Z' },
        { Nombre: 'María García', Chat_id: '573009876543', 'Preguntas Frecuentes': '¿Cómo se crea una tabla en SQL?', 'Fecha de Pregunta': '2026-01-30T10:15:00.000Z' },
        { Nombre: 'Juan Pérez', Chat_id: '573001234567', 'Preguntas Frecuentes': '¿Qué es un archivo binario?', 'Fecha de Pregunta': '2026-01-29T16:45:00.000Z' },
        { Nombre: 'Ana Martínez', Chat_id: '573007778899', 'Preguntas Frecuentes': '¿Cómo funciona la digitalización?', 'Fecha de Pregunta': '2026-01-29T09:20:00.000Z' },
        { Nombre: 'Pedro Sánchez', Chat_id: '573003334455', 'Preguntas Frecuentes': '¿Qué es un disco duro SSD?', 'Fecha de Pregunta': '2026-01-28T11:00:00.000Z' }
    ];

    state.datos.temas = [
        { Chat_id: '573001234567', Nombre: 'Juan Pérez', Tema: 'basededatos' },
        { Chat_id: '573009876543', Nombre: 'María García', Tema: 'basededatos' },
        { Chat_id: '573001234567', Nombre: 'Juan Pérez', Tema: 'archivo' },
        { Chat_id: '573007778899', Nombre: 'Ana Martínez', Tema: 'digitalizacion' },
        { Chat_id: '573003334455', Nombre: 'Pedro Sánchez', Tema: 'disco duro' },
        { Chat_id: '573009876543', Nombre: 'María García', Tema: 'tabla' },
        { Chat_id: '573001234567', Nombre: 'Juan Pérez', Tema: 'software' },
        { Chat_id: '573007778899', Nombre: 'Ana Martínez', Tema: 'basededatos' }
    ];

    actualizarMetricas();
    renderizarTablaActual();
}

// ============================================
// MÉTRICAS
// ============================================
function actualizarMetricas() {
    // Estudiantes activos (aquellos con Contador > 0)
    const estudiantesActivos = state.datos.contador.filter(e => e.Contador > 0).length;
    document.getElementById('estudiantes-activos').textContent = estudiantesActivos;

    // Preguntas totales (suma de todos los contadores)
    const preguntasTotales = state.datos.contador.reduce((sum, e) => sum + (e.Contador || 0), 0);
    document.getElementById('preguntas-totales').textContent = preguntasTotales;

    // Promedio de preguntas
    const promedio = estudiantesActivos > 0 ? (preguntasTotales / estudiantesActivos).toFixed(1) : 0;
    document.getElementById('promedio-preguntas').textContent = promedio;

    // Temas únicos consultados
    const temasUnicos = new Set(state.datos.temas.map(t => t.Tema)).size;
    document.getElementById('temas-consultados').textContent = temasUnicos;

    // Actualizar textos de detalle en las tarjetas
    actualizarDetalleMetricas(estudiantesActivos, preguntasTotales, promedio, temasUnicos);
}

function actualizarDetalleMetricas(estudiantes, preguntas, promedio, temas) {
    // Estudiantes: mostrar top estudiante
    const topEstudiante = state.datos.contador
        .filter(e => e.Contador > 0)
        .sort((a, b) => b.Contador - a.Contador)[0];

    if (topEstudiante) {
        document.getElementById('estudiantes-detail').textContent =
            `Top: ${topEstudiante.Nombre.split(' ')[0]} (${topEstudiante.Contador} preguntas)`;
    } else {
        document.getElementById('estudiantes-detail').textContent = 'Sin actividad';
    }

    // Preguntas: desglose
    document.getElementById('preguntas-detail').textContent =
        `${preguntas} preguntas realizadas por ${estudiantes} estudiantes`;

    // Promedio: interpretación
    let interpretacion = '';
    if (promedio == 0) interpretacion = 'Sin datos';
    else if (promedio < 5) interpretacion = 'Baja participación';
    else if (promedio < 15) interpretacion = 'Participación media';
    else interpretacion = 'Alta participación';

    document.getElementById('promedio-detail').textContent = interpretacion;

    // Temas: tema más consultado
    const temasAgrupados = {};
    state.datos.temas.forEach(t => {
        const tema = t.Tema.toLowerCase();
        temasAgrupados[tema] = (temasAgrupados[tema] || 0) + 1;
    });

    const temaTop = Object.entries(temasAgrupados)
        .sort((a, b) => b[1] - a[1])[0];

    if (temaTop) {
        document.getElementById('temas-detail').textContent =
            `Top: "${capitalizeFirst(temaTop[0])}" (${temaTop[1]} consultas)`;
    } else {
        document.getElementById('temas-detail').textContent = 'Sin datos';
    }
}

// ============================================
// TABS Y NAVEGACIÓN
// ============================================
function cambiarTab(tab) {
    state.tabActual = tab;
    state.paginacion.pagina = 1;
    state.busqueda = '';
    document.getElementById('search-input').value = '';

    // Actualizar UI de tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Ocultar todas las tablas
    document.querySelectorAll('.tabla-content').forEach(t => t.classList.add('hidden'));

    // Mostrar tabla correspondiente
    const tablaId = {
        'estudiantes': 'tabla-estudiantes',
        'preguntas': 'tabla-preguntas',
        'activos': 'tabla-activos',
        'temas': 'tabla-temas'
    };
    document.getElementById(tablaId[tab]).classList.remove('hidden');

    renderizarTablaActual();
}

// ============================================
// RENDERIZADO DE TABLAS
// ============================================
function renderizarTablaActual() {
    switch (state.tabActual) {
        case 'estudiantes':
            renderizarEstudiantes();
            break;
        case 'preguntas':
            renderizarPreguntas();
            break;
        case 'activos':
            renderizarActivos();
            break;
        case 'temas':
            renderizarTemas();
            break;
    }
}

function renderizarEstudiantes() {
    const tbody = document.getElementById('tbody-estudiantes');
    const empty = document.getElementById('empty-estudiantes');

    let datos = state.datos.estudiantes.filter(e =>
        e.Nombre.toLowerCase().includes(state.busqueda)
    );

    if (datos.length === 0) {
        tbody.innerHTML = '';
        empty.classList.add('visible');
        actualizarPaginacion(0);
        return;
    }

    empty.classList.remove('visible');
    const { paginados, total } = paginar(datos);
    actualizarPaginacion(total);

    tbody.innerHTML = paginados.map(est => `
        <tr class="fade-in">
            <td><strong>${est.Nombre}</strong></td>
            <td>${est.Chat_id}</td>
            <td>
                <span class="badge ${est.habilitado !== false ? 'badge-active' : 'badge-inactive'}">
                    ${est.habilitado !== false ? 'Habilitado' : 'Deshabilitado'}
                </span>
            </td>
            <td>
                <div class="toggle-container">
                    <div class="toggle ${est.habilitado !== false ? 'active' : ''}"
                         data-chatid="${est.Chat_id}"
                         onclick="toggleEstudiante('${est.Chat_id}', ${est.habilitado !== false})">
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderizarPreguntas() {
    const tbody = document.getElementById('tbody-preguntas');
    const empty = document.getElementById('empty-preguntas');

    let datos = state.datos.preguntas.filter(p => {
        const nombre = (p.Nombre || '').toLowerCase();
        const pregunta = (p['Preguntas Frecuentes'] || p.Pregunta || '').toLowerCase();
        return nombre.includes(state.busqueda) || pregunta.includes(state.busqueda);
    });

    // Ordenar por fecha más reciente
    datos.sort((a, b) => {
        const fechaA = new Date(a['Fecha de Pregunta'] || a.fecha || a.Fecha || 0);
        const fechaB = new Date(b['Fecha de Pregunta'] || b.fecha || b.Fecha || 0);
        return fechaB - fechaA;
    });

    if (datos.length === 0) {
        tbody.innerHTML = '';
        empty.classList.add('visible');
        actualizarPaginacion(0);
        return;
    }

    empty.classList.remove('visible');
    const { paginados, total } = paginar(datos);
    actualizarPaginacion(total);

    tbody.innerHTML = paginados.map(preg => {
        // Buscar la fecha en diferentes campos posibles
        const fecha = preg['Fecha de Pregunta'] || preg.fecha || preg.Fecha || '';
        const textoPregunta = preg['Preguntas Frecuentes'] || preg.Pregunta || '';

        return `
            <tr class="fade-in">
                <td><strong>${preg.Nombre}</strong></td>
                <td>${preg.Chat_id}</td>
                <td class="pregunta-text" title="${textoPregunta}">${textoPregunta}</td>
                <td class="fecha-tabla">${formatearFecha(fecha)}</td>
            </tr>
        `;
    }).join('');
}

function renderizarActivos() {
    const tbody = document.getElementById('tbody-activos');
    const empty = document.getElementById('empty-activos');
    const chartContainer = document.getElementById('chart-activos-container');

    let datos = state.datos.contador
        .filter(e => e.Nombre.toLowerCase().includes(state.busqueda))
        .sort((a, b) => b.Contador - a.Contador);

    if (datos.length === 0) {
        tbody.innerHTML = '';
        empty.classList.add('visible');
        chartContainer.classList.add('hidden');
        actualizarPaginacion(0);
        return;
    }

    empty.classList.remove('visible');
    chartContainer.classList.remove('hidden');

    const { paginados, total } = paginar(datos);
    actualizarPaginacion(total);

    // Actualizar gráfico con datos completos (sin paginación)
    inicializarGraficoActivos(datos);

    // Calcular offset para posiciones correctas en paginación
    const offset = (state.paginacion.pagina - 1) * CONFIG.itemsPerPage;

    tbody.innerHTML = paginados.map((est, idx) => {
        const posicion = offset + idx + 1;
        let posicionClass = '';
        if (posicion === 1) posicionClass = 'gold';
        else if (posicion === 2) posicionClass = 'silver';
        else if (posicion === 3) posicionClass = 'bronze';

        return `
            <tr class="fade-in">
                <td><span class="badge-position ${posicionClass}">${posicion}</span></td>
                <td><strong>${est.Nombre}</strong></td>
                <td>${est.Chat_id}</td>
                <td><span class="contador-badge">${est.Contador}</span></td>
            </tr>
        `;
    }).join('');
}

function renderizarTemas() {
    const tbody = document.getElementById('tbody-temas');
    const empty = document.getElementById('empty-temas');
    const chartContainer = document.getElementById('chart-temas-container');

    // Agrupar y contar temas
    const temasAgrupados = {};
    state.datos.temas.forEach(t => {
        const tema = t.Tema.toLowerCase();
        temasAgrupados[tema] = (temasAgrupados[tema] || 0) + 1;
    });

    let datos = Object.entries(temasAgrupados)
        .map(([tema, count]) => ({ tema, count }))
        .filter(t => t.tema.includes(state.busqueda))
        .sort((a, b) => b.count - a.count);

    if (datos.length === 0) {
        tbody.innerHTML = '';
        empty.classList.add('visible');
        chartContainer.classList.add('hidden');
        actualizarPaginacion(0);
        return;
    }

    empty.classList.remove('visible');
    chartContainer.classList.remove('hidden');

    const { paginados, total } = paginar(datos);
    actualizarPaginacion(total);

    // Actualizar gráfico con datos completos (sin paginación)
    inicializarGraficoTemas(datos);

    const totalConsultas = datos.reduce((sum, t) => sum + t.count, 0);

    tbody.innerHTML = paginados.map(tema => {
        const porcentaje = ((tema.count / totalConsultas) * 100).toFixed(1);
        return `
            <tr class="fade-in">
                <td><span class="tema-badge">${tema.tema}</span></td>
                <td><span class="contador-badge">${tema.count}</span></td>
                <td>
                    <div class="tema-stats">
                        <span class="tema-porcentaje">${porcentaje}%</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${porcentaje}%"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// ACCIONES
// ============================================
async function toggleEstudiante(chatId, estadoActual) {
    const toggleEl = document.querySelector(`[data-chatid="${chatId}"]`);
    toggleEl.classList.add('loading');

    try {
        // Construir URL para el proxy con POST
        const url = CONFIG.baseUrl + encodeURIComponent(CONFIG.endpoints.toggleEstudiante);
        const body = {
            chat_id: chatId,
            habilitado: !estadoActual,
            curso: state.cursoActual
        };

        console.log('🔄 Toggle estudiante via proxy:', url, body);

        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        // Actualizar estado local
        const estudiante = state.datos.estudiantes.find(e => e.Chat_id === chatId);
        if (estudiante) {
            estudiante.habilitado = !estadoActual;
        }

        renderizarEstudiantes();
        mostrarToast(
            `Estudiante ${!estadoActual ? 'habilitado' : 'deshabilitado'} correctamente`,
            'success'
        );
    } catch (error) {
        console.error('Error toggling estudiante:', error);
        mostrarToast('Error al cambiar estado del estudiante', 'error');
    } finally {
        toggleEl.classList.remove('loading');
    }
}

// ============================================
// UTILIDADES
// ============================================
function paginar(datos) {
    const total = Math.ceil(datos.length / CONFIG.itemsPerPage);
    state.paginacion.totalPaginas = total || 1;

    const inicio = (state.paginacion.pagina - 1) * CONFIG.itemsPerPage;
    const fin = inicio + CONFIG.itemsPerPage;

    return {
        paginados: datos.slice(inicio, fin),
        total
    };
}

function actualizarPaginacion(totalPaginas) {
    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const pagInfo = document.getElementById('pag-info');

    btnAnterior.disabled = state.paginacion.pagina <= 1;
    btnSiguiente.disabled = state.paginacion.pagina >= totalPaginas;
    pagInfo.textContent = `Página ${state.paginacion.pagina} de ${totalPaginas || 1}`;
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return '-';

    try {
        const fecha = new Date(fechaISO);

        // Verificar si la fecha es válida
        if (isNaN(fecha.getTime())) {
            console.warn('Fecha inválida:', fechaISO);
            return '-';
        }

        const opciones = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        return fecha.toLocaleDateString('es-ES', opciones);
    } catch (error) {
        console.error('Error formateando fecha:', error, 'Input:', fechaISO);
        return '-';
    }
}

function mostrarLoading(mostrar) {
    document.getElementById('loading').classList.toggle('hidden', !mostrar);
}

function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const iconos = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
        <i class="fas ${iconos[tipo]}"></i>
        <span class="toast-message">${mensaje}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Hacer funciones accesibles globalmente para el HTML
window.irADashboard = irADashboard;
window.editarEvento = editarEvento;
window.eliminarEvento = eliminarEvento;
window.toggleEstudiante = toggleEstudiante;

function limpiarDashboard() {
    state.datos = {
        estudiantes: [],
        preguntas: [],
        temas: [],
        contador: []
    };

    document.getElementById('estudiantes-activos').textContent = '0';
    document.getElementById('preguntas-totales').textContent = '0';
    document.getElementById('promedio-preguntas').textContent = '0';
    document.getElementById('temas-consultados').textContent = '0';

    // Limpiar detalles
    document.getElementById('estudiantes-detail').textContent = '';
    document.getElementById('preguntas-detail').textContent = '';
    document.getElementById('promedio-detail').textContent = '';
    document.getElementById('temas-detail').textContent = '';

    // Cerrar panel de detalle si está abierto
    cerrarPanelDetalle();

    renderizarTablaActual();
}
