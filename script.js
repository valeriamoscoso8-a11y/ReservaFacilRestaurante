const icons = {
  calendar: '<svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>',
  users: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3Z"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13 1 .36 1.98.69 2.91a2 2 0 0 1-.45 2.11L8.09 10a16 16 0 0 0 6 6l1.26-1.26a2 2 0 0 1 2.11-.45c.93.33 1.9.56 2.91.69A2 2 0 0 1 22 16.92Z"/></svg>',
  person: '<svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
  table: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 10h16M10 4v16"/></svg>',
  message: '<svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  arrowLeft: '<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/><path d="M21 12H9"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/><path d="M3 12h12"/></svg>'
};

const app = document.querySelector("#app");
const topButtons = {
  back: document.querySelector('[data-action="back"]'),
  calendar: document.querySelector('[data-route="calendar"]'),
  session: document.querySelector(".top-actions .primary")
};

let reservations = [];
let lastReservation = null;
let editingReservation = null;
const API_BASE = location.protocol === "file:" ? "http://localhost:3000" : "";
let selectedCalendarDate = "2026-06-03";
let visibleCalendarMonth = new Date("2026-06-01T00:00:00");

function icon(name) {
  return `<span class="icon">${icons[name]}</span>`;
}

function divider() {
  return '<div class="divider"><span></span></div>';
}

function route(name) {
  history.pushState({ route: name }, "", `#${name}`);
  render(name);
}

function syncHeader(name) {
  topButtons.back.classList.toggle("hidden", !["form", "new", "calendar"].includes(name));
  topButtons.calendar.classList.toggle("hidden", name !== "list");
  topButtons.session.textContent = ["list", "calendar", "success"].includes(name) ? "Cerrar Sesión" : "Iniciar Sesión";
  topButtons.session.dataset.route = ["list", "calendar", "success"].includes(name) ? "home" : "login";
}

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Inicia la app con npm start y abre http://localhost:3000.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "No se pudo conectar con la base de datos.");
  }
  return payload;
}

async function loadReservations(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  reservations = await api(`/api/reservas${query}`);
  return reservations;
}

function home() {
  return `
    <section class="home">
      <div class="hero-copy">
        <svg class="service-icon" viewBox="0 0 220 90" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <path d="M42 58h136M72 58a38 38 0 0 1 76 0M98 25v-12M122 25v-12M82 31l-9-9M138 31l9-9M110 17V6M40 75h62M118 75h62"/>
          <circle cx="110" cy="75" r="4" fill="currentColor"/>
        </svg>
        <h1 class="title">ReservaFácil</h1>
        <p class="subtitle">Sistema de reservas de mesas para restaurantes
          <span>Gestiona tus reservas de manera rápida, segura y organizada.</span>
          <span>Mejora la experiencia de tus clientes y optimiza la organización de tu restaurante.</span>
        </p>
        <button class="primary secondary-size" type="button" data-route="login">Iniciar sesión</button>
      </div>
      <div class="hero-image" role="img" aria-label="Mesa elegante de restaurante preparada para una reserva"></div>
    </section>
  `;
}

function login() {
  return `
    <section class="screen">
      <div class="panel compact">
        <div class="lock">${icons.lock}</div>
        <h1 class="section-title center">Iniciar Sesión</h1>
        <p class="center muted">Ingrese sus credenciales para continuar</p>
        <form class="login-form" data-login>
          <div class="field">
            <label>Correo electrónico</label>
            <input type="email" value="maria.garcia@gmail.com" required>
          </div>
          <div class="field password">
            <label>Contraseña</label>
            <input type="password" value="reservafacil" required>
            ${icon("eye")}
          </div>
          <div class="login-row">
            <label class="checkline"><input type="checkbox"> Recordarme</label>
            <a href="#">¿Olvidaste tu contraseña?</a>
          </div>
          <button class="primary" type="submit">Ingresar</button>
          <p class="center muted">¿No tienes cuenta? <a class="small-link" href="#">Regístrate</a></p>
        </form>
      </div>
    </section>
  `;
}

function reservationForm(prefilled = false, reservation = null) {
  const values = reservation || (prefilled ? {
    cliente: "María García", telefono: "098 765 4321", fecha: "2026-06-03", hora: "19:00", personas: "2", mesa: "Mesa 5", comentarios: "Mesa cerca de la ventana"
  } : { cliente: "", telefono: "", fecha: "", hora: "", personas: "", mesa: "", comentarios: "" });
  const isEditing = Boolean(reservation?.id);
  return `
    <section class="screen">
      <div class="panel">
        ${prefilled || isEditing ? `<h1 class="section-title center">${isEditing ? "Editar Reserva" : "Nueva Reserva"}</h1>` : ""}
        ${divider()}
        <p class="center muted">${prefilled ? "" : "Complete los datos de la reserva"}</p>
        <form class="reservation-form" data-reservation>
          <div class="grid-2">
            ${field("person", "Nombre del cliente", "Ingrese el nombre Completo", "cliente", values.cliente)}
            ${field("phone", "Teléfono", "Ingrese el número de teléfono", "telefono", values.telefono)}
            ${field("calendar", "Fecha", "Seleccione la fecha", "fecha", values.fecha, "date")}
            ${selectField("clock", "Hora", "Seleccione la hora", "hora", values.hora, ["19:00", "20:00", "20:30", "21:00"])}
            ${selectField("users", "Números de personas", "Seleccione el número", "personas", values.personas, ["2", "3", "4", "5", "6"])}
            ${selectField("table", "Mesa", "Seleccione la mesa", "mesa", values.mesa, ["Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Mesa 5", "Mesa 6"])}
            <div class="field full">
              <div class="field-title">${icon("message")}<label>Comentarios (opcional)</label></div>
              <textarea name="comentarios" placeholder="Ingrese algún comentario adicional...">${values.comentarios}</textarea>
            </div>
          </div>
          <p class="form-error hidden" data-error></p>
          <div class="form-actions">
            <button class="primary" type="submit">${icon("calendar")} ${isEditing ? "Actualizar Reserva" : "Guardar Reserva"}</button>
            <button class="secondary" type="button" data-route="list">Cancelar</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function field(iconName, label, placeholder, name, value, type = "text") {
  return `<div class="field"><div class="field-title">${icon(iconName)}<label>${label}</label></div><input name="${name}" type="${type}" value="${value}" placeholder="${placeholder}" required></div>`;
}

function selectField(iconName, label, placeholder, name, value, options) {
  const opts = [`<option value="">${placeholder}</option>`].concat(options.map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${option}${name === "personas" ? " personas" : ""}</option>`));
  return `<div class="field"><div class="field-title">${icon(iconName)}<label>${label}</label></div><select name="${name}" required>${opts.join("")}</select></div>`;
}

function success() {
  const item = lastReservation || reservations[0] || {};
  return `
    <section class="screen success-screen">
      <div class="panel wide center">
        <button class="ghost" type="button" data-route="form" style="float:left">${icon("arrowLeft")} Volver</button>
        <div class="success-icon">${icons.check}</div>
        <h1 class="section-title">¡Reserva registrada correctamente!</h1>
        <p>Tu reserva ha sido confirmada y guardada en la base de datos.</p>
        ${divider()}
        <h2 class="summary-title">${icon("calendar")} Resumen de la reserva</h2>
        <div class="summary-card">
          <div class="summary-grid">
            <div>${icon("calendar")}<strong>Fecha</strong><b>${formatDate(item.fecha)}</b></div>
            <div>${icon("clock")}<strong>Hora</strong><b>${item.hora || ""}</b></div>
            <div>${icon("users")}<strong>Personas</strong><b>${item.personas || ""} personas</b></div>
            <div>${icon("table")}<strong>Mesa</strong><b>${item.mesa || ""}</b></div>
          </div>
          <div class="restaurant-row">
            <span class="pill-icon">RF</span>
            <div><h3>${item.restaurante || "La Terraza Gourmet"}</h3><small>Av. Principal 123, San Isidro, Lima</small></div>
          </div>
        </div>
        <div class="form-actions">
          <button class="secondary" type="button" data-route="list">${icon("calendar")} Ver mis reservas</button>
          <button class="primary" type="button" data-route="home">${icon("home")} Ir al inicio</button>
        </div>
        <div class="notice">${icon("mail")} Reserva guardada para ${item.cliente || "el cliente"}.</div>
      </div>
    </section>
  `;
}

function list() {
  return `
    <section class="screen">
      <div class="panel wide">
        <h1 class="section-title">Reservas registradas</h1>
        ${divider()}
        <div class="list-toolbar">
          <label class="search">${icon("search")}<input data-search placeholder="Buscar reserva..."></label>
          <button class="primary" type="button" data-route="new">+ Nueva reserva</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Cliente</th><th>Fecha</th><th>Hora</th><th>Personas</th><th>Mesa</th><th>Acciones</th></tr></thead>
            <tbody data-table><tr><td colspan="6">Cargando reservas...</td></tr></tbody>
          </table>
        </div>
        <p class="form-error hidden" data-error></p>
        <div class="pagination">
          <span class="muted" data-count></span>
          <div class="pages"><button>${icons.arrowLeft}</button><button class="active">1</button><button>2</button><button>3</button><button>4</button></div>
        </div>
      </div>
    </section>
  `;
}

function reservationRows(items) {
  if (!items.length) {
    return '<tr><td colspan="6">No hay reservas registradas.</td></tr>';
  }

  return items.map((item) => `
    <tr>
      <td><div class="client"><span class="avatar">${initials(item.cliente)}</span><div><strong>${item.cliente}</strong><br><small>${item.telefono || ""}</small></div></div></td>
      <td>${icon("calendar")} ${formatDate(item.fecha)}</td>
      <td>${icon("clock")} ${item.hora || ""}</td>
      <td>${icon("users")} ${item.personas || ""}</td>
      <td>${item.mesa || ""}</td>
      <td>
        <div class="row-actions">
          <button class="ghost icon-action" type="button" data-edit="${item.id || ""}">Editar</button>
          <button class="danger icon-action" type="button" data-delete="${item.id || ""}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function calendar() {
  return `
    <section class="screen">
      <div class="panel wide">
        <div class="calendar-actions">
          <div><h1 class="section-title">Calendario de reservas</h1>${divider()}</div>
          <div class="top-actions"><button class="ghost" type="button" data-route="list">${icon("arrowLeft")} Volver</button><button class="primary" type="button" data-route="new">+ Nueva reserva</button></div>
        </div>
        <div class="calendar-layout">
          <div class="month-card">
            <div class="month-head">
              <button class="icon-button" type="button" data-month="-1">${icons.arrowLeft}</button>
              <span data-month-label>Junio 2026</span>
              <button class="icon-button" type="button" data-month="1">${icons.arrowRight}</button>
            </div>
            <div class="calendar-grid" data-calendar-grid></div>
            <div class="legend"><span><i class="dot"></i>Con reservas</span><span><i class="dot blue"></i>Pendiente</span><span><i class="dot orange"></i>En espera</span><span><i class="dot gray"></i>Cancelada</span></div>
          </div>
          <div class="day-card">
            <h3>Reservas del día</h3>
            <p>${icon("calendar")} <span data-selected-label>Selecciona una fecha</span><br><small data-day-count>Cargando reservas...</small></p>
            <div class="day-reservations" data-day-list></div>
          </div>
        </div>
        <div class="pagination calendar-footer"><button class="secondary" type="button" data-route="list">Ver todas las reservas</button></div>
      </div>
    </section>
  `;
}
function dayRow(item) {
  return `<div class="day-row"><span class="avatar">${initials(item.cliente)}</span><div><strong>${item.cliente}</strong><br><small>${item.telefono || ""}</small></div><span>${icon("clock")} ${item.hora || ""}</span><span>${icon("users")} ${item.personas || ""} personas</span><span>${icon("table")} ${item.mesa || ""}</span></div>`;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function renderCalendarGrid() {
  const grid = app.querySelector("[data-calendar-grid]");
  const label = app.querySelector("[data-month-label]");
  if (!grid || !label) return;

  const labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const year = visibleCalendarMonth.getFullYear();
  const month = visibleCalendarMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const reservedDates = new Set(reservations.map((item) => item.fecha));

  label.textContent = visibleCalendarMonth.toLocaleDateString("es-PE", {
    month: "long",
    year: "numeric"
  }).replace(/^\w/, (letter) => letter.toUpperCase());

  const cells = labels.map((day) => `<strong>${day}</strong>`);

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = toDateKey(date);
    const classes = [
      date.getMonth() === month ? "" : "dim",
      key === selectedCalendarDate ? "selected" : "",
      reservedDates.has(key) ? "has" : ""
    ].filter(Boolean).join(" ");

    cells.push(`<button class="${classes}" type="button" data-date="${key}">${date.getDate()}</button>`);
  }

  grid.innerHTML = cells.join("");
}

function renderSelectedDay() {
  const dayItems = reservations
    .filter((item) => item.fecha === selectedCalendarDate)
    .sort((a, b) => String(a.hora).localeCompare(String(b.hora)));
  const label = app.querySelector("[data-selected-label]");
  const count = app.querySelector("[data-day-count]");
  const list = app.querySelector("[data-day-list]");

  if (label) label.textContent = formatLongDate(selectedCalendarDate);
  if (count) count.textContent = `${dayItems.length} reservas programadas`;
  if (list) list.innerHTML = dayItems.map(dayRow).join("") || "<p>No hay reservas para este día.</p>";
}

function renderCalendarData() {
  renderCalendarGrid();
  renderSelectedDay();
}
function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "RF";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function showError(message) {
  const error = app.querySelector("[data-error]");
  if (error) {
    error.textContent = message;
    error.classList.remove("hidden");
  }
}

async function hydrate(name) {
  if (name === "list") {
    try {
      await loadReservations();
      app.querySelector("[data-table]").innerHTML = reservationRows(reservations.slice(0, 6));
      app.querySelector("[data-count]").textContent = `Mostrando ${Math.min(reservations.length, 6)} de ${reservations.length} reservas`;
    } catch (error) {
      showError(error.message);
      app.querySelector("[data-table]").innerHTML = '<tr><td colspan="6">No se pudo cargar la base de datos.</td></tr>';
    }
  }

  if (name === "calendar") {
    try {
      await loadReservations();
      renderCalendarData();
    } catch (error) {
      app.querySelector("[data-day-list]").innerHTML = `<p class="form-error">${error.message}</p>`;
    }
  }
}

function render(name = location.hash.replace("#", "") || "home") {
  const routes = { home, login, form: () => reservationForm(false), new: () => reservationForm(true), edit: () => reservationForm(true, editingReservation), success, list, calendar };
  const safeName = routes[name] ? name : "home";
  syncHeader(safeName);
  app.innerHTML = routes[safeName]();
  document.querySelectorAll("[data-icon]").forEach((node) => {
    node.innerHTML = icons[node.dataset.icon] || "";
  });
  app.querySelector("[data-login]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    route("list");
  });
  app.querySelector("[data-reservation]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    button.textContent = "Guardando...";
    try {
      const formData = Object.fromEntries(new FormData(event.currentTarget));
      const isEditing = Boolean(editingReservation?.id);
      lastReservation = await api(isEditing ? `/api/reservas/${editingReservation.id}` : "/api/reservas", {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(formData)
      });
      editingReservation = null;
      route("success");
    } catch (error) {
      button.disabled = false;
      button.innerHTML = `${icon("calendar")} Guardar Reserva`;
      showError(error.message);
    }
  });
  app.querySelector("[data-search]")?.addEventListener("input", async (event) => {
    try {
      await loadReservations(event.target.value);
      app.querySelector("[data-table]").innerHTML = reservationRows(reservations.slice(0, 6));
      app.querySelector("[data-count]").textContent = `Mostrando ${Math.min(reservations.length, 6)} de ${reservations.length} reservas`;
    } catch (error) {
      showError(error.message);
    }
  });
  hydrate(safeName);
}

document.addEventListener("click", (event) => {
  const dateButton = event.target.closest("[data-date]");
  const monthButton = event.target.closest("[data-month]");

  if (dateButton) {
    selectedCalendarDate = dateButton.dataset.date;
    visibleCalendarMonth = new Date(`${selectedCalendarDate.slice(0, 7)}-01T00:00:00`);
    renderCalendarData();
    return;
  }

  if (monthButton) {
    visibleCalendarMonth.setMonth(visibleCalendarMonth.getMonth() + Number(monthButton.dataset.month));
    renderCalendarGrid();
    return;
  }

  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    const id = editButton.dataset.edit;
    editingReservation = reservations.find((item) => String(item.id) === String(id));
    if (editingReservation) route("edit");
    return;
  }

  if (deleteButton) {
    const id = deleteButton.dataset.delete;
    if (!id) return;
    deleteButton.disabled = true;
    deleteButton.textContent = "Eliminando...";
    api(`/api/reservas/${id}`, { method: "DELETE" })
      .then(() => loadReservations())
      .then(() => {
        app.querySelector("[data-table]").innerHTML = reservationRows(reservations.slice(0, 6));
        app.querySelector("[data-count]").textContent = `Mostrando ${Math.min(reservations.length, 6)} de ${reservations.length} reservas`;
      })
      .catch((error) => showError(error.message));
    return;
  }

  const target = event.target.closest("[data-route]");
  if (target) {
    event.preventDefault();
    route(target.dataset.route);
  }
  if (event.target.closest('[data-action="back"]')) {
    history.length > 1 ? history.back() : route("home");
  }
});

window.addEventListener("popstate", () => render());
render();



