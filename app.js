(() => {
  "use strict";

  const STORAGE_KEY = "ateliyo-static-demo-v1";
  const app = document.getElementById("app-main");
  const dialog = document.getElementById("app-dialog");
  const pages = {
    dashboard: "Tableau de bord",
    orders: "Commandes",
    clients: "Clients",
    measurements: "Mensurations",
    staff: "Personnel",
    revenue: "Revenus",
    reports: "Rapports",
    settings: "Paramètres"
  };
  const workflowStatuses = ["En attente", "En coupe", "En couture", "Essayage", "Livré"];
  const orderStatuses = [...workflowStatuses, "Annulé"];
  const today = new Date();
  const monthNow = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  let route = document.body.dataset.page || "dashboard";
  let state;
  let needsMigration = false;
  let search = "";
  let orderStatusFilter = "";
  let reportFilters = { start: "2026-09-01", end: today.toISOString().slice(0, 10), status: "" };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const money = (value) => `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
  const fmtDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR") : "—";
  const nextId = (list) => list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  const clientById = (id) => state.clients.find((client) => Number(client.id) === Number(id));
  const staffById = (id) => state.staff.find((member) => Number(member.id) === Number(id));
  const orderById = (id) => state.orders.find((order) => Number(order.id) === Number(id));
  const fullName = (person) => person ? `${person.firstName} ${person.lastName}`.trim() : "Client supprimé";
  const initials = (person) => person ? `${person.firstName?.[0] || ""}${person.lastName?.[0] || ""}`.toUpperCase() : "?";
  const paidTotal = (order) => state.payments.filter((payment) => Number(payment.orderId) === Number(order.id)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const orderPaid = (order) => Math.max(Number(order.paid || 0), paidTotal(order));
  const orderBalance = (order) => Math.max(0, Number(order.total || 0) - orderPaid(order));
  const personCell = (person) => `<span class="table-name"><span class="mini-avatar">${escapeHtml(initials(person))}</span><strong>${escapeHtml(fullName(person))}</strong></span>`;
  const statusBadge = (value) => `<span class="status-badge" data-status="${escapeHtml(value)}">${escapeHtml(value)}</span>`;
  const emptyRow = (cols, message) => `<tr><td colspan="${cols}" class="empty-state">${escapeHtml(message)}</td></tr>`;

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return clone(window.ATELIYO_DEMO);
    const parsed = JSON.parse(saved);
    if (parsed?.version === 1) {
      const previousStages = {
        "En cours": "En couture",
        "Terminé": "Essayage",
        "En retard": "En coupe"
      };
      parsed.orders = (parsed.orders || []).map((order) => ({
        ...order,
        status: previousStages[order.status] || (order.status === "Annulé" ? "Annulé" : order.status)
      }));
      delete parsed.tasks;
      parsed.version = window.ATELIYO_DEMO.version;
      needsMigration = true;
      return parsed;
    }
    if (!parsed || parsed.version !== window.ATELIYO_DEMO.version) return clone(window.ATELIYO_DEMO);
    delete parsed.tasks;
    return parsed;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      toast("Impossible d'enregistrer les changements dans ce navigateur.", true);
      throw error;
    }
  }

  function toast(message, error = false) {
    const region = document.getElementById("toast-region");
    const element = document.createElement("div");
    element.className = `toast${error ? " error" : ""}`;
    element.textContent = message;
    region.append(element);
    window.setTimeout(() => element.remove(), 3600);
  }

  function personOptions(list, selected = "") {
    return list.map((person) => `<option value="${Number(person.id)}" ${String(person.id) === String(selected) ? "selected" : ""}>${escapeHtml(fullName(person))}</option>`).join("");
  }

  function heading(title, subtitle, action = "") {
    return `<div class="page-heading"><div><p class="eyebrow">ATELIYO · ESPACE ATELIER</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div><div class="page-heading-actions">${action}</div></div>`;
  }

  function stat(label, value, note, icon, tone = "") {
    return `<div class="card stat-card"><span class="stat-icon ${tone}">${icon}</span><div><span class="stat-label">${escapeHtml(label)}</span><strong class="stat-value">${value}</strong><small class="stat-note">${escapeHtml(note)}</small></div></div>`;
  }

  function monthKey(date) {
    return String(date || "").slice(0, 7);
  }

  function renderDashboard() {
    const activeOrders = state.orders.filter((order) => !["Livré", "Annulé"].includes(order.status)).length;
    const received = state.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const pending = state.orders.reduce((sum, order) => sum + orderBalance(order), 0);
    const recent = [...state.orders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    const monthLabels = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthLabels.push({ key, label: date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "") });
    }
    const monthly = monthLabels.map((month) => state.payments.filter((payment) => monthKey(payment.date) === month.key).reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
    const peak = Math.max(1, ...monthly);
    const chart = monthLabels.map((month, index) => `<div class="chart-col"><div class="chart-bar-wrap"><div class="chart-bar" style="height:${Math.max(3, monthly[index] / peak * 100)}%" title="${escapeHtml(money(monthly[index]))}"></div></div><span class="chart-label">${escapeHtml(month.label)}</span></div>`).join("");
    const colors = { "En attente": "#dca64f", "En coupe": "#789fbb", "En couture": "#6b9f82", "Essayage": "#a18abd", "Livré": "#4c8b67", "Annulé": "#a9b0ad" };
    const orderCount = state.orders.length;
    const statusRows = orderStatuses.map((status) => {
      const count = state.orders.filter((order) => order.status === status).length;
      return `<div class="status-row"><span class="status-dot" style="background:${colors[status]}"></span><span>${escapeHtml(status)}</span><strong class="status-count">${count}</strong></div>`;
    }).join("");
    const rows = recent.map((order) => {
      const client = clientById(order.clientId);
      return `<tr><td><strong>${escapeHtml(order.reference)}</strong></td><td>${personCell(client)}</td><td>${escapeHtml(order.garment)}</td><td>${money(order.total)}</td><td>${statusBadge(order.status)}</td></tr>`;
    }).join("");
    app.innerHTML = `${heading("Bonjour, bienvenue 👋", "Voici un aperçu de l'activité de votre atelier.", `<button class="btn btn-primary" data-action="new-order">＋ Nouvelle commande</button>`)}
      <div class="notice">Données de démonstration fictives : ajoutez, modifiez ou supprimez des éléments. Les changements sont sauvegardés uniquement dans ce navigateur.</div>
      <section class="stat-grid" aria-label="Indicateurs">
        ${stat("Commandes actives", activeOrders, `${orderCount} commande(s) au total`, "▣")}
        ${stat("Clients enregistrés", state.clients.length, "Dans le carnet clients", "♙", "amber")}
        ${stat("Revenus encaissés", money(received), "Tous les paiements", "↗", "blue")}
        ${stat("Solde à recevoir", money(pending), "Sur les commandes", "◷", "rose")}
      </section>
      <section class="dashboard-grid">
        <div class="card"><div class="card-heading"><div><h2>Encaissements récents</h2><p>Évolution sur les six derniers mois</p></div><a class="text-link" href="revenus.html">Voir les revenus →</a></div><div class="chart-area">${chart}</div><div class="chart-legend">Montants encaissés · FCFA</div></div>
        <div class="card"><div class="card-heading"><div><h2>Suivi des commandes</h2><p>${orderCount} commande(s) au total</p></div></div><div class="status-list">${statusRows}</div></div>
      </section>
      <section class="card recent-card"><div class="card-heading"><div><h2>Commandes récentes</h2><p>Les dernières commandes enregistrées</p></div><a class="text-link" href="commandes.html">Toutes les commandes →</a></div><div class="table-wrap"><table><thead><tr><th>Référence</th><th>Client</th><th>Vêtement</th><th>Montant</th><th>Statut</th></tr></thead><tbody>${rows || emptyRow(5, "Aucune commande enregistrée.")}</tbody></table></div></section>`;
  }

  function renderClients() {
    const term = search.trim().toLocaleLowerCase("fr");
    const clients = [...state.clients].filter((client) => `${fullName(client)} ${client.phone} ${client.email} ${client.address}`.toLocaleLowerCase("fr").includes(term)).sort((a, b) => fullName(a).localeCompare(fullName(b), "fr"));
    const rows = clients.map((client) => {
      const count = state.orders.filter((order) => Number(order.clientId) === Number(client.id)).length;
      return `<tr><td>${personCell(client)}</td><td>${escapeHtml(client.phone || "—")}</td><td>${escapeHtml(client.email || "—")}</td><td>${escapeHtml(client.address || "—")}</td><td>${count}</td><td><div class="actions-cell"><button class="action-button" data-action="client-details" data-id="${client.id}">Détails</button><button class="action-button delete" data-action="delete-client" data-id="${client.id}">Supprimer</button></div></td></tr>`;
    }).join("");
    app.innerHTML = `${heading("Clients", "Retrouvez les coordonnées et l'historique de votre clientèle.", `<button class="btn btn-primary" data-action="new-client">＋ Ajouter un client</button>`)}
      <section class="card"><div class="toolbar"><div class="search-box"><span>⌕</span><input id="table-search" type="search" value="${escapeHtml(search)}" placeholder="Rechercher un client…" aria-label="Rechercher un client"></div><span class="stat-label">${clients.length} client(s)</span></div><div class="table-wrap"><table><thead><tr><th>Nom</th><th>Téléphone</th><th>Courriel</th><th>Adresse</th><th>Commandes</th><th>Actions</th></tr></thead><tbody>${rows || emptyRow(6, "Aucun client ne correspond à la recherche.")}</tbody></table></div></section>`;
  }

  function renderOrders() {
    const term = search.trim().toLocaleLowerCase("fr");
    const orders = [...state.orders].filter((order) => {
      const client = clientById(order.clientId);
      return (!orderStatusFilter || order.status === orderStatusFilter) && `${order.reference} ${fullName(client)} ${order.garment} ${order.status}`.toLocaleLowerCase("fr").includes(term);
    }).sort((a, b) => b.date.localeCompare(a.date));
    const rows = orders.map((order) => {
      const step = workflowStatuses.indexOf(order.status);
      const status = step < 0 ? statusBadge(order.status) : `<div class="order-stage">${statusBadge(order.status)}<div class="workflow-progress" aria-label="Étape ${step + 1} sur ${workflowStatuses.length}">${workflowStatuses.map((_, index) => `<i class="${index <= step ? "complete" : ""}"></i>`).join("")}</div><small>Étape ${step + 1} sur ${workflowStatuses.length}</small></div>`;
      const canAdvance = step >= 0 && step < workflowStatuses.length - 1;
      return `<tr><td><strong>${escapeHtml(order.reference)}</strong></td><td>${personCell(clientById(order.clientId))}</td><td>${escapeHtml(order.garment)}</td><td>${fmtDate(order.dueDate)}</td><td>${money(order.total)}</td><td>${money(orderBalance(order))}</td><td>${status}</td><td><div class="actions-cell"><button class="action-button" data-action="advance-order" data-id="${order.id}" ${canAdvance ? "" : "disabled"}>${canAdvance ? "Étape suivante →" : order.status === "Livré" ? "Livrée ✓" : "—"}</button><button class="action-button delete" data-action="delete-order" data-id="${order.id}">Supprimer</button></div></td></tr>`;
    }).join("");
    app.innerHTML = `${heading("Commandes", "Suivez les confections, les paiements et les dates de livraison.", `<button class="btn btn-primary" data-action="new-order">＋ Nouvelle commande</button>`)}
      <section class="card"><div class="toolbar"><div class="search-box"><span>⌕</span><input id="table-search" type="search" value="${escapeHtml(search)}" placeholder="Référence, client, vêtement…" aria-label="Rechercher une commande"></div><div class="toolbar-actions"><select class="filter-select" id="order-status-filter" aria-label="Filtrer par étape"><option value="">Toutes les étapes</option>${orderStatuses.map((status) => `<option ${status === orderStatusFilter ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}</select><span class="stat-label">${orders.length} commande(s)</span></div></div><div class="table-wrap"><table><thead><tr><th>Référence</th><th>Client</th><th>Vêtement</th><th>Livraison prévue</th><th>Total</th><th>À payer</th><th>Étape</th><th>Actions</th></tr></thead><tbody>${rows || emptyRow(8, "Aucune commande ne correspond aux filtres.")}</tbody></table></div></section>`;
  }

  function renderMeasurements() {
    const term = search.trim().toLocaleLowerCase("fr");
    const records = [...state.measurements].filter((measurement) => `${fullName(clientById(measurement.clientId))} ${measurement.garment}`.toLocaleLowerCase("fr").includes(term)).sort((a, b) => b.date.localeCompare(a.date));
    const rows = records.map((measurement) => `<tr><td><strong>MES-${String(measurement.id).padStart(4, "0")}</strong></td><td>${personCell(clientById(measurement.clientId))}</td><td>${escapeHtml(measurement.garment)}</td><td>${fmtDate(measurement.date)}</td><td><div class="actions-cell"><button class="action-button" data-action="measurement-details" data-id="${measurement.id}">Détails</button><button class="action-button delete" data-action="delete-measurement" data-id="${measurement.id}">Supprimer</button></div></td></tr>`).join("");
    app.innerHTML = `${heading("Mensurations", "Conservez les mesures de vos clients pour chaque type de vêtement.", `<button class="btn btn-primary" data-action="new-measurement">＋ Nouvelle prise</button>`)}
      <section class="card"><div class="toolbar"><div class="search-box"><span>⌕</span><input id="table-search" type="search" value="${escapeHtml(search)}" placeholder="Rechercher par client ou vêtement…" aria-label="Rechercher des mensurations"></div><span class="stat-label">${records.length} fiche(s)</span></div><div class="table-wrap"><table><thead><tr><th>Référence</th><th>Client</th><th>Type de vêtement</th><th>Date</th><th>Actions</th></tr></thead><tbody>${rows || emptyRow(5, "Aucune mensuration ne correspond à la recherche.")}</tbody></table></div></section>`;
  }

  function renderStaff() {
    const term = search.trim().toLocaleLowerCase("fr");
    const members = [...state.staff].filter((member) => `${fullName(member)} ${member.email} ${member.phone} ${member.role}`.toLocaleLowerCase("fr").includes(term));
    const rows = members.map((member) => `<tr><td>${personCell(member)}</td><td>${escapeHtml(member.role)}</td><td>${escapeHtml(member.phone || "—")}</td><td>${escapeHtml(member.email || "—")}</td><td>${statusBadge(member.status)}</td><td><button class="action-button delete" data-action="delete-staff" data-id="${member.id}">Supprimer</button></td></tr>`).join("");
    app.innerHTML = `${heading("Personnel", "Gérez les membres de l'équipe de votre atelier.", `<button class="btn btn-primary" data-action="new-staff">＋ Ajouter un membre</button>`)}
      <div class="notice">Les comptes de cette démonstration ne donnent pas accès à une authentification réelle.</div>
      <section class="card"><div class="toolbar"><div class="search-box"><span>⌕</span><input id="table-search" type="search" value="${escapeHtml(search)}" placeholder="Rechercher un membre…" aria-label="Rechercher un membre"></div><span class="stat-label">${members.length} membre(s)</span></div><div class="table-wrap"><table><thead><tr><th>Nom</th><th>Fonction</th><th>Téléphone</th><th>Courriel</th><th>État</th><th>Action</th></tr></thead><tbody>${rows || emptyRow(6, "Aucun membre ne correspond à la recherche.")}</tbody></table></div></section>`;
  }

  function renderRevenue() {
    const latestPaymentMonth = state.payments.map((payment) => monthKey(payment.date)).sort().pop();
    const selectedMonth = new URLSearchParams(location.search).get("month") || latestPaymentMonth || monthNow;
    const payments = state.payments.filter((payment) => monthKey(payment.date) === selectedMonth).sort((a, b) => b.date.localeCompare(a.date));
    const monthTotal = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const allTotal = state.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const orderIds = new Set(payments.map((payment) => Number(payment.orderId)));
    const rows = payments.map((payment) => {
      const order = orderById(payment.orderId);
      const client = clientById(order?.clientId);
      return `<tr><td><strong>${escapeHtml(order?.reference || "Commande supprimée")}</strong></td><td>${personCell(client)}</td><td>${fmtDate(payment.date)}</td><td>${escapeHtml(payment.method)}</td><td><strong>${money(payment.amount)}</strong></td><td>${statusBadge("Encaissé")}</td></tr>`;
    }).join("");
    const previousMonths = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const amount = state.payments.filter((payment) => monthKey(payment.date) === key).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      previousMonths.push({ key, label: date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }).replace(".", ""), amount });
    }
    const max = Math.max(1, ...previousMonths.map((month) => month.amount));
    const bars = previousMonths.map((month) => `<div class="bar-line"><span>${escapeHtml(month.label)}</span><div class="bar-track"><div class="bar-fill" style="width:${month.amount / max * 100}%"></div></div><strong class="bar-amount">${money(month.amount)}</strong></div>`).join("");
    app.innerHTML = `${heading("Revenus", "Consultez les encaissements et leur évolution.", "")}
      <form class="card filter-panel" id="revenue-filter"><div class="field"><label for="revenue-month">Mois</label><input id="revenue-month" type="month" value="${escapeHtml(selectedMonth)}" required></div><button class="btn btn-primary" type="submit">Filtrer</button></form>
      <section class="summary-strip"><div class="card summary-box"><span>Encaissements du mois</span><strong>${money(monthTotal)}</strong></div><div class="card summary-box"><span>Nombre de paiements</span><strong>${payments.length}</strong></div><div class="card summary-box"><span>Total encaissé</span><strong>${money(allTotal)}</strong></div></section>
      <section class="split-layout"><div class="card"><div class="card-heading"><div><h2>Évolution des encaissements</h2><p>Six derniers mois</p></div></div><div class="bars-list">${bars}</div></div>
      <div class="card"><div class="card-heading"><div><h2>Reste à percevoir</h2><p>Solde sur les commandes ouvertes</p></div></div><div class="bars-list"><div class="bar-line"><span>À payer</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, state.orders.reduce((sum, order) => sum + orderBalance(order), 0) / Math.max(1, state.orders.reduce((sum, order) => sum + Number(order.total), 0)) * 100)}%"></div></div><strong class="bar-amount">${money(state.orders.reduce((sum, order) => sum + orderBalance(order), 0))}</strong></div><p class="form-help">${orderIds.size} commande(s) ont reçu un paiement durant ce mois.</p></div></div></section>
      <section class="card recent-card"><div class="card-heading"><div><h2>Historique des encaissements</h2><p>${escapeHtml(selectedMonth)}</p></div></div><div class="table-wrap"><table><thead><tr><th>Commande</th><th>Client</th><th>Date</th><th>Mode</th><th>Montant</th><th>État</th></tr></thead><tbody>${rows || emptyRow(6, "Aucun encaissement pour ce mois.")}</tbody></table></div></section>`;
  }

  function reportRows() {
    return state.orders.filter((order) => {
      const inRange = order.date >= reportFilters.start && order.date <= reportFilters.end;
      return inRange && (!reportFilters.status || order.status === reportFilters.status);
    }).sort((a, b) => b.date.localeCompare(a.date));
  }

  function renderReports() {
    const orders = reportRows();
    const total = orders.filter((order) => order.status !== "Annulé").reduce((sum, order) => sum + Number(order.total || 0), 0);
    const received = orders.reduce((sum, order) => sum + orderPaid(order), 0);
    const balance = orders.filter((order) => order.status !== "Annulé").reduce((sum, order) => sum + orderBalance(order), 0);
    const rows = orders.map((order) => `<tr><td><strong>${escapeHtml(order.reference)}</strong></td><td>${escapeHtml(fullName(clientById(order.clientId)))}</td><td>${escapeHtml(order.garment)}</td><td>${fmtDate(order.date)}</td><td>${statusBadge(order.status)}</td><td>${money(order.total)}</td><td>${money(orderPaid(order))}</td><td>${money(orderBalance(order))}</td></tr>`).join("");
    app.innerHTML = `${heading("Rapports", "Filtrez l'activité et exportez les résultats au format CSV.", "")}
      <form class="card filter-panel" id="report-filter"><div class="field"><label for="report-start">Du</label><input type="date" id="report-start" value="${escapeHtml(reportFilters.start)}" required></div><div class="field"><label for="report-end">Au</label><input type="date" id="report-end" value="${escapeHtml(reportFilters.end)}" required></div><div class="field"><label for="report-status">Statut</label><select id="report-status"><option value="">Tous les statuts</option>${orderStatuses.map((status) => `<option ${reportFilters.status === status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}</select></div><div class="toolbar-actions"><button class="btn btn-primary" type="submit">Filtrer</button><button class="btn btn-secondary" type="button" data-action="export-report">Exporter CSV ↓</button></div></form>
      <section class="summary-strip"><div class="card summary-box"><span>Commandes trouvées</span><strong>${orders.length}</strong></div><div class="card summary-box"><span>Montant total</span><strong>${money(total)}</strong></div><div class="card summary-box"><span>Encaissé · Solde</span><strong>${money(received)} · ${money(balance)}</strong></div></section>
      <section class="card"><div class="card-heading"><div><h2>Détail des commandes</h2><p>${orders.length} résultat(s)</p></div></div><div class="table-wrap"><table><thead><tr><th>Référence</th><th>Client</th><th>Vêtement</th><th>Date</th><th>Statut</th><th>Total</th><th>Payé</th><th>Solde</th></tr></thead><tbody>${rows || emptyRow(8, "Aucune commande ne correspond à ces filtres.")}</tbody></table></div></section>`;
  }

  function renderSettings() {
    app.innerHTML = `${heading("Paramètres de l'atelier", "Personnalisez les coordonnées affichées dans votre espace.", "")}
      <form class="card account-settings" id="settings-form"><h2>Informations de l'atelier</h2><p class="form-help">Ces informations sont enregistrées localement dans votre navigateur.</p>
        <div class="field"><label for="shop-name">Nom de l'atelier</label><input id="shop-name" maxlength="100" value="${escapeHtml(state.settings.shopName)}" required></div>
        <div class="field"><label for="shop-phone">Téléphone de contact</label><input id="shop-phone" type="tel" value="${escapeHtml(state.settings.phone)}"></div>
        <div class="field"><label for="shop-email">Courriel</label><input id="shop-email" type="email" value="${escapeHtml(state.settings.email)}" required></div>
        <p class="form-help">Aucun mot de passe ni compte en ligne n'est créé par cette démo.</p><div><button class="btn btn-primary" type="submit">Enregistrer les paramètres</button></div></form>
      <section class="card report-card" style="margin-top:16px"><h2>Jeu de données de démonstration</h2><p>Réinitialisez les clients, commandes, paiements et mensurations fictifs à leur état initial. Cette action efface aussi les modifications effectuées sur cet appareil.</p><button class="btn btn-secondary" data-action="reset-demo">Réinitialiser les données</button></section>`;
  }

  function render() {
    route = pages[document.body.dataset.page] ? document.body.dataset.page : "dashboard";
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const active = link.dataset.nav === route;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.getElementById("page-name").textContent = pages[route];
    document.getElementById("brand-shop").textContent = state.settings.shopName;
    document.getElementById("today-label").textContent = today.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    const renderers = {
      dashboard: renderDashboard, clients: renderClients, orders: renderOrders,
      measurements: renderMeasurements, staff: renderStaff,
      revenue: renderRevenue, reports: renderReports, settings: renderSettings
    };
    renderers[route]();
    closeSidebar();
  }

  function field(label, name, value = "", type = "text", required = false, extra = "") {
    return `<div class="field"><label for="field-${name}">${escapeHtml(label)}${required ? " *" : ""}</label><input id="field-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" ${required ? "required" : ""} ${extra}></div>`;
  }

  function selectField(label, name, options, selected = "", required = false) {
    return `<div class="field"><label for="field-${name}">${escapeHtml(label)}${required ? " *" : ""}</label><select id="field-${name}" name="${name}" ${required ? "required" : ""}>${options.map(([value, text]) => `<option value="${escapeHtml(value)}" ${String(value) === String(selected) ? "selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select></div>`;
  }

  function textareaField(label, name, value = "", placeholder = "") {
    return `<div class="field full"><label for="field-${name}">${escapeHtml(label)}</label><textarea id="field-${name}" name="${name}" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea></div>`;
  }

  function openDialog(title, content, eyebrow = "ATELIYO · DÉMO") {
    document.getElementById("dialog-title").textContent = title;
    document.getElementById("dialog-eyebrow").textContent = eyebrow;
    document.getElementById("dialog-content").innerHTML = content;
    dialog.showModal();
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  function openClientForm() {
    openDialog("Ajouter un client", `<form data-form="client"><div class="field-grid">${field("Nom", "lastName", "", "text", true)}${field("Prénom", "firstName", "", "text", true)}${field("Téléphone", "phone", "", "tel", true)}${field("Courriel", "email", "", "email")}${field("Adresse / quartier", "address")}</div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-close-dialog>Annuler</button><button class="btn btn-primary" type="submit">Enregistrer le client</button></div></form>`);
  }

  function openOrderForm() {
    if (!state.clients.length) {
      toast("Ajoutez d'abord un client pour créer une commande.", true);
      return;
    }
    const clients = state.clients.map((client) => [client.id, fullName(client)]);
    const staffOptions = [["", "Non attribué"], ...state.staff.map((member) => [member.id, fullName(member)])];
    openDialog("Nouvelle commande", `<form data-form="order"><div class="field-grid">${selectField("Client", "clientId", clients, "", true)}${selectField("Type de vêtement", "garment", [["Robe", "Robe"], ["Pantalon", "Pantalon"], ["Chemise", "Chemise"], ["Tenue scolaire", "Tenue scolaire"], ["Tenue traditionnelle", "Tenue traditionnelle"], ["Jupe", "Jupe"], ["Autre", "Autre"]], "", true)}${field("Prix total (FCFA)", "total", "", "number", true, 'min="0" step="500"')}${field("Acompte reçu (FCFA)", "paid", "0", "number", false, 'min="0" step="500"')}${field("Date de commande", "date", today.toISOString().slice(0, 10), "date", true)}${field("Date de livraison prévue", "dueDate", "", "date")}${selectField("Couturier / couturière", "staffId", staffOptions)}${selectField("Mode de paiement", "method", [["Espèces", "Espèces"], ["Orange Money", "Orange Money"], ["Moov Money", "Moov Money"], ["Wave", "Wave"], ["Autre", "Autre"]], "Espèces")}${textareaField("Description", "description", "", "Détails de la confection…")}</div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-close-dialog>Annuler</button><button class="btn btn-primary" type="submit">Créer la commande</button></div></form>`);
  }

  function openMeasurementForm() {
    if (!state.clients.length) {
      toast("Ajoutez d'abord un client pour enregistrer ses mesures.", true);
      return;
    }
    const measureFields = [["Poitrine", "chest"], ["Taille", "waist"], ["Hanches", "hips"], ["Longueur de manche", "sleeve"], ["Épaules", "shoulders"], ["Longueur de pantalon", "trouser"], ["Tour de cuisse", "thigh"]];
    const inputs = measureFields.map(([label, name]) => field(`${label} (cm)`, name, "", "number", false, 'min="0" step="0.5"')).join("");
    openDialog("Nouvelle prise de mesures", `<form data-form="measurement"><div class="field-grid">${selectField("Client", "clientId", state.clients.map((client) => [client.id, fullName(client)]), "", true)}${selectField("Type de vêtement", "garment", [["Robe", "Robe"], ["Pantalon", "Pantalon"], ["Chemise", "Chemise"], ["Tenue scolaire", "Tenue scolaire"], ["Tenue traditionnelle", "Tenue traditionnelle"], ["Jupe", "Jupe"], ["Autre", "Autre"]], "", true)}${inputs}${textareaField("Notes particulières", "notes", "", "Détails utiles pour la confection…")}</div><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-close-dialog>Annuler</button><button class="btn btn-primary" type="submit">Enregistrer les mesures</button></div></form>`);
  }

  function openStaffForm() {
    openDialog("Ajouter un membre", `<form data-form="staff"><div class="field-grid">${field("Nom", "lastName", "", "text", true)}${field("Prénom", "firstName", "", "text", true)}${field("Courriel", "email", "", "email", true)}${field("Téléphone", "phone", "", "tel")}${selectField("Fonction", "role", [["Couturière", "Couturière"], ["Couturier", "Couturier"], ["Coupeur", "Coupeur"], ["Apprenti", "Apprenti"], ["Autre", "Autre"]])}</div><p class="form-help">Aucun compte de connexion réel ne sera créé.</p><div class="dialog-actions"><button class="btn btn-secondary" type="button" data-close-dialog>Annuler</button><button class="btn btn-primary" type="submit">Ajouter le membre</button></div></form>`);
  }

  function showClientDetails(id) {
    const client = clientById(id);
    if (!client) return;
    const orders = state.orders.filter((order) => Number(order.clientId) === Number(client.id));
    const measurements = state.measurements.filter((record) => Number(record.clientId) === Number(client.id));
    const recentOrders = orders.length ? orders.map((order) => `<div class="detail-item"><span>${escapeHtml(order.reference)} · ${fmtDate(order.date)}</span><strong>${escapeHtml(order.garment)} · ${money(order.total)}</strong></div>`).join("") : `<p class="form-help">Aucune commande enregistrée.</p>`;
    openDialog(fullName(client), `<div class="detail-grid"><div class="detail-item"><span>Téléphone</span><strong>${escapeHtml(client.phone || "—")}</strong></div><div class="detail-item"><span>Courriel</span><strong>${escapeHtml(client.email || "—")}</strong></div><div class="detail-item"><span>Adresse</span><strong>${escapeHtml(client.address || "—")}</strong></div><div class="detail-item"><span>Mensurations enregistrées</span><strong>${measurements.length}</strong></div></div><p class="eyebrow" style="margin-top:20px">COMMANDES</p><div class="detail-grid">${recentOrders}</div>`);
  }

  function showMeasurementDetails(id) {
    const record = state.measurements.find((measurement) => Number(measurement.id) === Number(id));
    if (!record) return;
    const fields = [["Poitrine", "chest"], ["Taille", "waist"], ["Hanches", "hips"], ["Longueur de manche", "sleeve"], ["Épaules", "shoulders"], ["Longueur de pantalon", "trouser"], ["Tour de cuisse", "thigh"]];
    const details = fields.map(([label, key]) => `<div class="detail-item"><span>${escapeHtml(label)}</span><strong>${record[key] !== "" && record[key] != null ? `${escapeHtml(record[key])} cm` : "—"}</strong></div>`).join("");
    openDialog(`Mensurations · ${escapeHtml(fullName(clientById(record.clientId)))}`, `<div class="detail-grid"><div class="detail-item"><span>Vêtement</span><strong>${escapeHtml(record.garment)}</strong></div><div class="detail-item"><span>Date</span><strong>${fmtDate(record.date)}</strong></div>${details}</div><p class="form-help" style="margin-top:14px">${escapeHtml(record.notes || "Aucune note.")}</p>`);
  }

  function formValues(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function addPayment(orderId, amount, method, date) {
    const value = Number(amount);
    if (value <= 0) return;
    state.payments.push({ id: nextId(state.payments), orderId: Number(orderId), amount: value, method, date });
  }

  function createOrder(values) {
    const total = Number(values.total);
    const paid = Number(values.paid || 0);
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(paid) || paid < 0 || paid > total) {
      toast("Vérifiez le prix total et l'acompte : l'acompte doit être compris entre 0 et le total.", true);
      return false;
    }
    const id = nextId(state.orders);
    state.orders.push({
      id, reference: `CMD-${today.getFullYear()}-${String(1000 + id).padStart(4, "0")}`,
      clientId: Number(values.clientId), garment: values.garment, description: values.description.trim(),
      total, paid: 0, date: values.date, dueDate: values.dueDate || "", status: "En attente",
      staffId: values.staffId ? Number(values.staffId) : null
    });
    if (paid > 0) addPayment(id, paid, values.method, values.date);
    return true;
  }

  function submitForm(form) {
    const values = formValues(form);
    switch (form.dataset.form) {
      case "client":
        state.clients.push({ id: nextId(state.clients), ...values, createdAt: today.toISOString().slice(0, 10) });
        return "Client ajouté.";
      case "order":
        if (!createOrder(values)) return "";
        return "Commande créée.";
      case "measurement": {
        const id = nextId(state.measurements);
        state.measurements.push({ id, ...values, clientId: Number(values.clientId), date: today.toISOString().slice(0, 10) });
        return "Mensurations enregistrées.";
      }
      case "staff":
        state.staff.push({ id: nextId(state.staff), ...values, status: "Actif" });
        return "Membre ajouté.";
      default:
        return "";
    }
  }

  function deleteRecord(collection, id, label, cleanup = () => {}) {
    const record = state[collection].find((item) => Number(item.id) === Number(id));
    if (!record || !window.confirm(`Supprimer ${label} ? Cette action est définitive dans cette démo.`)) return;
    state[collection] = state[collection].filter((item) => Number(item.id) !== Number(id));
    cleanup(record);
    saveState();
    render();
    toast(`${label.charAt(0).toUpperCase()}${label.slice(1)} supprimé.`);
  }

  function downloadReport() {
    const records = reportRows();
    const headers = ["Référence", "Client", "Vêtement", "Date", "Statut", "Total FCFA", "Payé FCFA", "Solde FCFA"];
    const values = records.map((order) => [order.reference, fullName(clientById(order.clientId)), order.garment, order.date, order.status, order.total, orderPaid(order), orderBalance(order)]);
    const csvCell = (value) => {
      let text = String(value ?? "");
      if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const csv = `\uFEFF${[headers, ...values].map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `ateliyo-rapport-${reportFilters.start}-${reportFilters.end}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Rapport CSV téléchargé.");
  }

  function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebar-overlay").classList.remove("visible");
  }

  function setTheme(theme, persist = false) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    const themeToggle = document.getElementById("theme-toggle");
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "Activer le mode clair" : "Activer le mode sombre");
    document.getElementById("theme-label").textContent = isDark ? "Mode clair" : "Mode sombre";
    document.querySelector(".theme-icon").textContent = isDark ? "☀" : "☾";
    if (persist) {
      try {
        localStorage.setItem("ateliyo-theme", isDark ? "dark" : "light");
      } catch (error) {
        console.error("Ateliyo: préférence de thème non enregistrée.", error);
        toast("Le thème a changé, mais sa préférence n'a pas pu être mémorisée.", true);
      }
    }
  }

  function resetDemo() {
    if (!window.confirm("Réinitialiser toutes les données modifiées et recharger les données fictives de départ ?")) return;
    state = clone(window.ATELIYO_DEMO);
    saveState();
    search = "";
    orderStatusFilter = "";
    render();
    toast("Données de démonstration réinitialisées.");
  }

  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-close-dialog]");
    if (closeButton) {
      closeDialog();
      return;
    }
    const action = event.target.closest("[data-action]");
    if (!action) return;
    const id = Number(action.dataset.id);
    switch (action.dataset.action) {
      case "new-client": openClientForm(); break;
      case "new-order": openOrderForm(); break;
      case "new-measurement": openMeasurementForm(); break;
      case "new-staff": openStaffForm(); break;
      case "client-details": showClientDetails(id); break;
      case "measurement-details": showMeasurementDetails(id); break;
      case "advance-order": {
        const order = orderById(id);
        const step = order ? workflowStatuses.indexOf(order.status) : -1;
        if (order && step >= 0 && step < workflowStatuses.length - 1) {
          order.status = workflowStatuses[step + 1];
          saveState();
          render();
          toast(`Commande avancée à l'étape « ${order.status} ».`);
        }
        break;
      }
      case "delete-client":
        deleteRecord("clients", id, "ce client", (client) => {
          state.orders = state.orders.filter((order) => Number(order.clientId) !== Number(client.id));
          state.measurements = state.measurements.filter((record) => Number(record.clientId) !== Number(client.id));
          const orderIds = new Set(state.orders.map((order) => Number(order.id)));
          state.payments = state.payments.filter((payment) => orderIds.has(Number(payment.orderId)));
        });
        break;
      case "delete-order":
        deleteRecord("orders", id, "cette commande", (order) => {
          state.payments = state.payments.filter((payment) => Number(payment.orderId) !== Number(order.id));
        });
        break;
      case "delete-measurement": deleteRecord("measurements", id, "cette fiche de mesures"); break;
      case "delete-staff":
        deleteRecord("staff", id, "ce membre", (member) => {
          state.orders.forEach((order) => { if (Number(order.staffId) === Number(member.id)) order.staffId = null; });
        });
        break;
      case "export-report": downloadReport(); break;
      case "reset-demo": resetDemo(); break;
      default: break;
    }
  });

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (form.id === "revenue-filter") {
      event.preventDefault();
      const month = document.getElementById("revenue-month").value;
      const target = new URL("revenus.html", location.href);
      target.searchParams.set("month", month);
      location.href = target.href;
      return;
    }
    if (form.id === "report-filter") {
      event.preventDefault();
      const start = document.getElementById("report-start").value;
      const end = document.getElementById("report-end").value;
      if (start > end) {
        toast("La date de début doit précéder ou être égale à la date de fin.", true);
        return;
      }
      reportFilters = { start, end, status: document.getElementById("report-status").value };
      render();
      return;
    }
    if (form.id === "settings-form") {
      event.preventDefault();
      state.settings.shopName = document.getElementById("shop-name").value.trim();
      state.settings.phone = document.getElementById("shop-phone").value.trim();
      state.settings.email = document.getElementById("shop-email").value.trim();
      saveState();
      render();
      toast("Paramètres enregistrés.");
      return;
    }
    if (form.dataset.form) {
      event.preventDefault();
      const message = submitForm(form);
      if (!message) return;
      saveState();
      closeDialog();
      render();
      toast(message);
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.id === "order-status-filter") {
      orderStatusFilter = target.value;
      render();
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id !== "table-search") return;
    const value = event.target.value;
    const start = event.target.selectionStart;
    const end = event.target.selectionEnd;
    search = value;
    render();
    const input = document.getElementById("table-search");
    if (input) {
      input.focus();
      input.setSelectionRange(start, end);
    }
  });

  document.getElementById("menu-button").addEventListener("click", () => {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebar-overlay").classList.add("visible");
  });
  document.getElementById("sidebar-overlay").addEventListener("click", closeSidebar);
  document.getElementById("reset-demo").addEventListener("click", resetDemo);
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme, true);
  });
  document.querySelectorAll("[data-nav], .brand").forEach((link) => link.addEventListener("click", () => {
    search = "";
    orderStatusFilter = "";
  }));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebar();
  });

  try {
    state = loadState();
    if (needsMigration) saveState();
  } catch (error) {
    console.error("Ateliyo: lecture des données locales impossible.", error);
    state = clone(window.ATELIYO_DEMO);
    toast("Les données locales sont illisibles. Réinitialisez la démo pour repartir des exemples.", true);
  }
  try {
    setTheme(localStorage.getItem("ateliyo-theme") || "light");
  } catch (error) {
    console.error("Ateliyo: lecture de la préférence de thème impossible.", error);
    setTheme("light");
    toast("La préférence du thème n'a pas pu être chargée.", true);
  }
  render();
})();
