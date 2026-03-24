'use client';

import React from 'react';

const LOGO_URL =
  'https://drive.google.com/uc?export=view&id=1OTi0OiFJ9Z06DO1YQIJbfZ_NwZAd3D67';

export default function DashboardProOutbound() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const [activeView, setActiveView] = React.useState('overview');

  const [singleEmail, setSingleEmail] = React.useState('');
  const [singleEmailName, setSingleEmailName] = React.useState('');
  const [bulkEmails, setBulkEmails] = React.useState('');

  const [singleWeb, setSingleWeb] = React.useState('');
  const [singleWebName, setSingleWebName] = React.useState('');
  const [bulkWebs, setBulkWebs] = React.useState('');

  const [addingSingle, setAddingSingle] = React.useState(false);
  const [addingBulk, setAddingBulk] = React.useState(false);
  const [addingSingleWeb, setAddingSingleWeb] = React.useState(false);
  const [addingBulkWeb, setAddingBulkWeb] = React.useState(false);

  const [leadMessage, setLeadMessage] = React.useState('');
  const [leadError, setLeadError] = React.useState('');

  const [searchLead, setSearchLead] = React.useState('');
  const [filterEstado, setFilterEstado] = React.useState('todos');
  const [filterTipo, setFilterTipo] = React.useState('todos');

  const API_URL = '/api/dashboard';
  const LEADS_API_URL = '/api/add-leads';
  const WEB_LEADS_API_URL = '/api/add-web-leads';

  const loadDashboard = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(API_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (!json?.ok) {
        throw new Error(json?.error || 'Error cargando dashboard');
      }

      setData(json);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  function normalizeEmailsFromText(text) {
    return [
      ...new Set(
        String(text || '')
          .split(/[\n,; ]+/)
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean)
      ),
    ];
  }

  function normalizeWebsFromText(text) {
    return [
      ...new Set(
        String(text || '')
          .split(/[\n,; ]+/)
          .map((x) => x.trim())
          .filter(Boolean)
      ),
    ];
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

  function isValidWeb(web) {
    const value = String(web || '').trim();
    if (!value) return false;
    return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(value);
  }

  async function sendEmailsToPipeline(items) {
    const res = await fetch(LEADS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'addLeadsFromDashboard', emails: items }),
    });

    const json = await res.json();

    if (!json?.ok) {
      throw new Error(json?.error || 'Error añadiendo emails');
    }

    return json;
  }

  async function sendWebsToPipeline(items) {
    const res = await fetch(WEB_LEADS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'addWebLeadsFromDashboard', webs: items }),
    });

    const json = await res.json();

    if (!json?.ok) {
      throw new Error(json?.error || 'Error añadiendo webs');
    }

    return json;
  }

  async function handleAddSingle() {
    setLeadError('');
    setLeadMessage('');

    const email = String(singleEmail || '').trim().toLowerCase();
    const nombre_contacto = String(singleEmailName || '').trim();

    if (!email) {
      setLeadError('Introduce un email.');
      return;
    }

    if (!isValidEmail(email)) {
      setLeadError('El email no es válido.');
      return;
    }

    try {
      setAddingSingle(true);

      const result = await sendEmailsToPipeline([{ email, nombre_contacto }]);

      setLeadMessage(
        `Emails → Añadidos: ${result.inserted} · Duplicados: ${result.duplicates} · Inválidos: ${result.invalid}`
      );
      setSingleEmail('');
      setSingleEmailName('');
      await loadDashboard();
    } catch (e) {
      setLeadError(String(e?.message || e));
    } finally {
      setAddingSingle(false);
    }
  }

  async function handleAddBulk() {
    setLeadError('');
    setLeadMessage('');

    const emails = normalizeEmailsFromText(bulkEmails);

    if (!emails.length) {
      setLeadError('Pega al menos un email.');
      return;
    }

    try {
      setAddingBulk(true);

      const payload = emails.map((email) => ({ email, nombre_contacto: '' }));
      const result = await sendEmailsToPipeline(payload);

      setLeadMessage(
        `Emails → Añadidos: ${result.inserted} · Duplicados: ${result.duplicates} · Inválidos: ${result.invalid}`
      );
      setBulkEmails('');
      await loadDashboard();
    } catch (e) {
      setLeadError(String(e?.message || e));
    } finally {
      setAddingBulk(false);
    }
  }

  async function handleAddSingleWeb() {
    setLeadError('');
    setLeadMessage('');

    const web = String(singleWeb || '').trim();
    const nombre_contacto = String(singleWebName || '').trim();

    if (!web) {
      setLeadError('Introduce una web.');
      return;
    }

    if (!isValidWeb(web)) {
      setLeadError('La web no parece válida.');
      return;
    }

    try {
      setAddingSingleWeb(true);

      const result = await sendWebsToPipeline([{ web, nombre_contacto }]);

      setLeadMessage(
        `Webs → Añadidas: ${result.inserted} · Duplicadas: ${result.duplicates}`
      );
      setSingleWeb('');
      setSingleWebName('');
      await loadDashboard();
    } catch (e) {
      setLeadError(String(e?.message || e));
    } finally {
      setAddingSingleWeb(false);
    }
  }

  async function handleAddBulkWeb() {
    setLeadError('');
    setLeadMessage('');

    const webs = normalizeWebsFromText(bulkWebs);

    if (!webs.length) {
      setLeadError('Pega al menos una web.');
      return;
    }

    const invalidCount = webs.filter((w) => !isValidWeb(w)).length;
    const validPayload = webs
      .filter((w) => isValidWeb(w))
      .map((web) => ({ web, nombre_contacto: '' }));

    if (!validPayload.length) {
      setLeadError('No hay webs válidas.');
      return;
    }

    try {
      setAddingBulkWeb(true);

      const result = await sendWebsToPipeline(validPayload);

      setLeadMessage(
        `Webs → Añadidas: ${result.inserted} · Duplicadas: ${result.duplicates} · Inválidas: ${invalidCount}`
      );
      setBulkWebs('');
      await loadDashboard();
    } catch (e) {
      setLeadError(String(e?.message || e));
    } finally {
      setAddingBulkWeb(false);
    }
  }

  const bulkParsedEmails = normalizeEmailsFromText(bulkEmails);
  const bulkValidEmails = bulkParsedEmails.filter(isValidEmail).length;
  const bulkInvalidEmails = bulkParsedEmails.filter((e) => !isValidEmail(e)).length;

  const bulkParsedWebs = normalizeWebsFromText(bulkWebs);
  const bulkValidWebs = bulkParsedWebs.filter(isValidWeb).length;
  const bulkInvalidWebs = bulkParsedWebs.filter((w) => !isValidWeb(w)).length;

  const metrics = data?.metrics || {
    totalLeads: 0,
    emailsEnviados: 0,
    respondidos: 0,
    interesados: 0,
    noInteresados: 0,
    bajas: 0,
    respuestaPct: 0,
    interesadosPct: 0,
    enviadosHoy: 0,
    respuestasHoy: 0,
    pendientes: 0,
    followUp: 0,
    clientes: 0,
    ratioCierre: 0,
  };

  const estados = data?.estados || [
    { label: 'Pendientes', value: 0 },
    { label: 'Interesados', value: 0 },
    { label: 'No interesados', value: 0 },
    { label: 'Bajas', value: 0 },
  ];

  const respuestas = data?.respuestas || [];
  const leads = data?.leads || [];
  const enviosPorDia = data?.enviosPorDia || [];
  const acumulado = data?.acumulado || [];
  const hotLeads = data?.hotLeads || [];

  const maxEstado = Math.max(...estados.map((e) => e.value), 1);
  const maxEnvios = Math.max(...enviosPorDia.map((d) => d.value), 1);
  const maxAcumulado = Math.max(...acumulado.map((d) => d.value), 1);

  const tiposDisponibles = [...new Set(leads.map((l) => l.tipo).filter(Boolean))].sort();

  const filteredLeads = leads.filter((lead) => {
    const q = searchLead.trim().toLowerCase();
    const matchSearch =
      !q ||
      String(lead.empresa || '').toLowerCase().includes(q) ||
      String(lead.email || '').toLowerCase().includes(q) ||
      String(lead.web || '').toLowerCase().includes(q);

    const matchEstado =
      filterEstado === 'todos' || String(lead.estado || '').toLowerCase() === filterEstado;

    const matchTipo =
      filterTipo === 'todos' || String(lead.tipo || '').toLowerCase() === filterTipo;

    return matchSearch && matchEstado && matchTipo;
  });

  const navItems = [
    { key: 'overview', label: 'Overview' },
    { key: 'importar', label: 'Importar leads' },
    { key: 'pipeline', label: 'Pipeline' },
    { key: 'hotleads', label: 'Hot Leads' },
    { key: 'respuestas', label: 'Respuestas' },
    { key: 'base', label: 'Base de leads' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="flex min-h-screen w-full bg-slate-950">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/10 bg-slate-950/95 xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <img
                src={LOGO_URL}
                alt="Publicidad Digital ZC"
                className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/10"
              />
              <div>
                <div className="text-sm font-semibold text-white">PDZC Outbound</div>
                <div className="text-xs text-slate-400">Prospección automatizada</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-5">
            <div className="mb-3 px-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Navegación
            </div>

            <div className="space-y-2">
              {navItems.map((item) => {
                const active = activeView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveView(item.key)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
                      active
                        ? 'bg-white/[0.08] text-white ring-1 ring-white/10'
                        : 'text-slate-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.key === 'hotleads' && hotLeads.length > 0 && (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-200">
                        {hotLeads.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">
                Estado
              </div>
              <div className="mt-2 text-sm font-medium text-emerald-100">
                Sistema sincronizado
              </div>
              <div className="mt-1 text-xs text-emerald-200/70">
                Dashboard conectado en tiempo real
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-slate-950">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] xl:hidden">
                  <img
                    src={LOGO_URL}
                    alt="PDZC"
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-300">
                    Publicidad Digital ZC · Outbound Control Center
                  </div>
                  <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight md:text-3xl">
                    Dashboard Pro
                  </h1>
                  <p className="mt-1 text-sm text-slate-400">
                    Plataforma de prospección automatizada conectada a Google Sheets.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-3">
                <div className="grid grid-cols-3 gap-2">
                  <QuickBadge label="Pendientes" value={metrics.pendientes} />
                  <QuickBadge label="Interesados" value={metrics.interesados} accent="green" />
                  <QuickBadge label="Bajas" value={metrics.bajas} accent="red" />
                </div>

                <button
                  onClick={handleLogout}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.08]"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
            {loading && (
              <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                Cargando datos del dashboard...
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                Error cargando datos: {error}
              </div>
            )}

            {activeView === 'overview' && (
              <div className="space-y-6">
                <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                  <MetricCard label="Total leads" value={metrics.totalLeads} />
                  <MetricCard label="Emails enviados" value={metrics.emailsEnviados} />
                  <MetricCard label="Respondidos" value={metrics.respondidos} />
                  <MetricCard label="Interesados" value={metrics.interesados} accent="green" />
                  <MetricCard
                    label="No interesados"
                    value={metrics.noInteresados}
                    accent="amber"
                  />
                  <MetricCard label="Bajas" value={metrics.bajas} accent="red" />
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <Panel title="Centro de mando">
                    <div className="grid gap-4 md:grid-cols-3">
                      <KpiBlock label="Pendientes" value={metrics.pendientes} />
                      <KpiBlock label="Enviados hoy" value={metrics.enviadosHoy} />
                      <KpiBlock label="Respuestas hoy" value={metrics.respuestasHoy} />
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <KpiBlock label="% respuesta" value={`${metrics.respuestaPct}%`} />
                      <KpiBlock label="% interesados" value={`${metrics.interesadosPct}%`} />
                      <KpiBlock label="Ratio cierre" value={`${metrics.ratioCierre}%`} />
                    </div>
                  </Panel>

                  <Panel title="Hot Leads">
                    {hotLeads.length ? (
                      <div className="space-y-3">
                        {hotLeads.map((lead, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <div className="text-xs uppercase tracking-[0.16em] text-emerald-200/80">
                                Contactar urgente
                              </div>
                              <div className="truncate text-sm font-medium text-emerald-50">
                                {lead.email}
                              </div>
                            </div>
                            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[11px] text-emerald-100">
                              Hot
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="No hay hot leads ahora mismo" />
                    )}
                  </Panel>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  <Panel title="Pipeline por estado">
                    <div className="space-y-5">
                      {estados.map((item) => (
                        <div key={item.label}>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-slate-300">{item.label}</span>
                            <span className="font-medium text-slate-100">{item.value}</span>
                          </div>
                          <div className="h-3 rounded-full bg-white/5">
                            <div
                              className={`h-3 rounded-full ${barColor(item.label)}`}
                              style={{
                                width: `${Math.max(
                                  (item.value / maxEstado) * 100,
                                  item.value > 0 ? 1.5 : 0
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel title="Distribución rápida">
                    <PieDistribution estados={estados} total={metrics.totalLeads} />
                  </Panel>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                  <Panel title="Gráfico de evolución · envíos por día">
                    <SimpleBars
                      data={enviosPorDia}
                      max={maxEnvios}
                      color="from-cyan-400 to-sky-500"
                    />
                  </Panel>

                  <Panel title="Curva de crecimiento real · leads acumulados">
                    <SimpleLine data={acumulado} max={maxAcumulado} />
                  </Panel>
                </section>
              </div>
            )}

            {activeView === 'importar' && (
              <div className="space-y-6">
                <Panel title="Entrada rápida al pipeline">
                  <div className="grid gap-4 2xl:grid-cols-2">
                    <ImporterCard
                      title="Añadir email suelto"
                      subtitle="Puedes añadir también un nombre si es un lead hablado."
                    >
                      <input
                        type="email"
                        value={singleEmail}
                        onChange={(e) => setSingleEmail(e.target.value)}
                        placeholder="cliente@empresa.com"
                        className={inputClass}
                      />
                      <input
                        type="text"
                        value={singleEmailName}
                        onChange={(e) => setSingleEmailName(e.target.value)}
                        placeholder="Nombre contacto (opcional)"
                        className={inputClass}
                      />
                      <button
                        onClick={handleAddSingle}
                        disabled={addingSingle}
                        className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-3 text-sm font-medium text-slate-950 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {addingSingle ? 'Añadiendo...' : 'Añadir email al pipeline'}
                      </button>
                    </ImporterCard>

                    <ImporterCard
                      title="Añadir en bulk emails"
                      subtitle="Pega varios emails separados por salto de línea, coma, espacio o punto y coma."
                    >
                      <textarea
                        value={bulkEmails}
                        onChange={(e) => setBulkEmails(e.target.value)}
                        rows={6}
                        placeholder={`cliente1@empresa.com
cliente2@empresa.com
cliente3@empresa.com`}
                        className={textareaClass}
                      />
                      <div className="flex flex-wrap gap-2">
                        <MiniInfo label="Detectados" value={bulkParsedEmails.length} />
                        <MiniInfo label="Válidos" value={bulkValidEmails} tone="ok" />
                        <MiniInfo label="Inválidos" value={bulkInvalidEmails} tone="bad" />
                      </div>
                      <button
                        onClick={handleAddBulk}
                        disabled={addingBulk}
                        className="w-full rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 px-4 py-3 text-sm font-medium text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {addingBulk ? 'Añadiendo...' : 'Añadir emails en bloque'}
                      </button>
                    </ImporterCard>

                    <ImporterCard
                      title="Añadir web suelta"
                      subtitle="Puedes añadir también un nombre si es un lead hablado."
                    >
                      <input
                        type="text"
                        value={singleWeb}
                        onChange={(e) => setSingleWeb(e.target.value)}
                        placeholder="empresa.com o https://empresa.com"
                        className={inputClass}
                      />
                      <input
                        type="text"
                        value={singleWebName}
                        onChange={(e) => setSingleWebName(e.target.value)}
                        placeholder="Nombre contacto (opcional)"
                        className={inputClass}
                      />
                      <button
                        onClick={handleAddSingleWeb}
                        disabled={addingSingleWeb}
                        className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-4 py-3 text-sm font-medium text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {addingSingleWeb ? 'Añadiendo...' : 'Añadir web al pipeline'}
                      </button>
                    </ImporterCard>

                    <ImporterCard
                      title="Añadir en bulk webs"
                      subtitle="Pega varias webs separadas por salto de línea, coma, espacio o punto y coma."
                    >
                      <textarea
                        value={bulkWebs}
                        onChange={(e) => setBulkWebs(e.target.value)}
                        rows={6}
                        placeholder={`empresa1.com
empresa2.com
https://empresa3.com`}
                        className={textareaClass}
                      />
                      <div className="flex flex-wrap gap-2">
                        <MiniInfo label="Detectadas" value={bulkParsedWebs.length} />
                        <MiniInfo label="Válidas" value={bulkValidWebs} tone="ok" />
                        <MiniInfo label="Inválidas" value={bulkInvalidWebs} tone="bad" />
                      </div>
                      <button
                        onClick={handleAddBulkWeb}
                        disabled={addingBulkWeb}
                        className="w-full rounded-2xl bg-gradient-to-r from-pink-600 to-fuchsia-500 px-4 py-3 text-sm font-medium text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {addingBulkWeb ? 'Añadiendo...' : 'Añadir webs en bloque'}
                      </button>
                    </ImporterCard>
                  </div>

                  {leadError && (
                    <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                      {leadError}
                    </div>
                  )}

                  {leadMessage && (
                    <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                      {leadMessage}
                    </div>
                  )}
                </Panel>
              </div>
            )}

            {activeView === 'pipeline' && (
              <div className="space-y-6">
                <Panel title="Pipeline">
                  <div className="mb-4 grid gap-3 md:grid-cols-3">
                    <input
                      type="text"
                      value={searchLead}
                      onChange={(e) => setSearchLead(e.target.value)}
                      placeholder="Buscar por empresa, email o web"
                      className={inputClass}
                    />

                    <select
                      value={filterEstado}
                      onChange={(e) => setFilterEstado(e.target.value)}
                      className={inputClass}
                    >
                      <option value="todos">Todos los estados</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="pendiente_web">Pendiente web</option>
                      <option value="enviado_1">Enviado 1</option>
                      <option value="enviado_2">Enviado 2</option>
                      <option value="followup_enviado">Follow-up</option>
                      <option value="respondido">Respondido</option>
                      <option value="interesado">Interesado</option>
                      <option value="no_interesado">No interesado</option>
                      <option value="baja">Baja</option>
                    </select>

                    <select
                      value={filterTipo}
                      onChange={(e) => setFilterTipo(e.target.value)}
                      className={inputClass}
                    >
                      <option value="todos">Todos los tipos</option>
                      {tiposDisponibles.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-white/10">
                    <div className="overflow-x-auto">
                      <table className="min-w-[980px] w-full text-left text-sm">
                        <thead className="bg-white/[0.04] text-slate-300">
                          <tr>
                            <Th>Empresa</Th>
                            <Th>Email</Th>
                            <Th>Web</Th>
                            <Th>Estado</Th>
                            <Th>Tipo</Th>
                            <Th>Fecha envío</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeads.map((r, i) => (
                            <tr key={i} className="border-t border-white/10 bg-white/[0.02]">
                              <Td>{r.empresa || '—'}</Td>
                              <Td className="max-w-[240px] truncate">{r.email || '—'}</Td>
                              <Td className="max-w-[220px] truncate">{r.web || '—'}</Td>
                              <Td>
                                <StatusBadge status={r.estado} />
                              </Td>
                              <Td>{r.tipo || '—'}</Td>
                              <Td>{formatDate(r.fecha) || '—'}</Td>
                            </tr>
                          ))}

                          {!filteredLeads.length && (
                            <tr className="border-t border-white/10 bg-white/[0.02]">
                              <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                No hay leads con esos filtros
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Panel>
              </div>
            )}

            {activeView === 'hotleads' && (
              <div className="space-y-6">
                <Panel title="Hot Leads · contactar urgente">
                  {hotLeads.length ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {hotLeads.map((lead, i) => (
                        <div
                          key={i}
                          className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4"
                        >
                          <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">
                            Hot lead
                          </div>
                          <div className="mt-2 break-all text-sm font-medium text-emerald-50">
                            {lead.email}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="No hay leads urgentes ahora mismo" />
                  )}
                </Panel>
              </div>
            )}

            {activeView === 'respuestas' && (
              <div className="space-y-6">
                <Panel title="Respuestas">
                  <div className="overflow-hidden rounded-2xl border border-white/10">
                    <div className="overflow-x-auto">
                      <table className="min-w-[900px] w-full text-left text-sm">
                        <thead className="bg-white/[0.04] text-slate-300">
                          <tr>
                            <Th>Lead</Th>
                            <Th>Estado</Th>
                            <Th>Respuesta</Th>
                            <Th>Acción</Th>
                            <Th>Fecha</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {respuestas.map((r, i) => (
                            <tr key={i} className="border-t border-white/10 bg-white/[0.02]">
                              <Td>{r.empresa}</Td>
                              <Td>
                                <StatusBadge status={r.estado} />
                              </Td>
                              <Td className="max-w-[320px]">{r.respuesta}</Td>
                              <Td>{r.accion}</Td>
                              <Td>{formatDate(r.fecha)}</Td>
                            </tr>
                          ))}

                          {!respuestas.length && (
                            <tr className="border-t border-white/10 bg-white/[0.02]">
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                No hay respuestas todavía
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Panel>
              </div>
            )}

            {activeView === 'base' && (
              <div className="space-y-6">
                <Panel title="Base de leads">
                  <div className="overflow-hidden rounded-2xl border border-white/10">
                    <div className="overflow-x-auto">
                      <table className="min-w-[980px] w-full text-left text-sm">
                        <thead className="bg-white/[0.04] text-slate-300">
                          <tr>
                            <Th>Empresa</Th>
                            <Th>Email</Th>
                            <Th>Web</Th>
                            <Th>Estado</Th>
                            <Th>Tipo</Th>
                            <Th>Fecha envío</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads.map((r, i) => (
                            <tr key={i} className="border-t border-white/10 bg-white/[0.02]">
                              <Td>{r.empresa || '—'}</Td>
                              <Td className="max-w-[220px] truncate">{r.email || '—'}</Td>
                              <Td className="max-w-[220px] truncate">{r.web || '—'}</Td>
                              <Td>
                                <StatusBadge status={r.estado} />
                              </Td>
                              <Td>{r.tipo || '—'}</Td>
                              <Td>{formatDate(r.fecha) || '—'}</Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Panel>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500';
const textareaClass =
  'w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500';

function Panel({ title, children }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-medium tracking-tight text-slate-100">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ImporterCard({ title, subtitle, children }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
      <div className="mb-4">
        <div className="text-base font-medium text-white">{title}</div>
        <div className="mt-1 text-sm text-slate-400">{subtitle}</div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function MetricCard({ label, value, accent = 'slate' }) {
  const accentMap = {
    slate: 'from-slate-500/20 to-slate-300/5 border-white/10',
    green: 'from-emerald-500/20 to-emerald-300/5 border-emerald-400/20',
    amber: 'from-amber-500/20 to-amber-300/5 border-amber-400/20',
    red: 'from-rose-500/20 to-rose-300/5 border-rose-400/20',
  };

  return (
    <div
      className={`rounded-[24px] border bg-gradient-to-br p-5 ${
        accentMap[accent] || accentMap.slate
      }`}
    >
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</div>
    </div>
  );
}

function QuickBadge({ label, value, accent = 'slate' }) {
  const map = {
    slate: 'border-white/10 bg-white/[0.04] text-slate-100',
    green: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    red: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${map[accent] || map.slate}`}>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function KpiBlock({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function MiniInfo({ label, value, tone = 'neutral' }) {
  const map = {
    neutral: 'border-white/10 bg-white/[0.04] text-slate-200',
    ok: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    bad: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
  };

  return (
    <div className={`rounded-full border px-3 py-1 text-xs ${map[tone] || map.neutral}`}>
      {label}: {value}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-sm text-slate-400">
      {text}
    </div>
  );
}

function PieDistribution({ estados, total }) {
  const normalized = estados.map((item) => ({
    ...item,
    pct: total ? (item.value / total) * 100 : 0,
  }));

  const colors = {
    Pendientes: '#1ec8ff',
    Interesados: '#16e0b0',
    'No interesados': '#facc15',
    Bajas: '#fb7185',
  };

  let current = 0;
  const segments = normalized.map((item) => {
    const start = current;
    const end = current + item.pct;
    current = end;
    return `${colors[item.label] || '#94a3b8'} ${start}% ${end}%`;
  });

  const gradient = `conic-gradient(${segments.join(', ')})`;

  return (
    <div className="grid items-center gap-6 lg:grid-cols-[260px_1fr]">
      <div className="flex flex-col items-center justify-center">
        <div
          className="relative h-56 w-56 rounded-full border border-white/10"
          style={{ background: gradient }}
        >
          <div className="absolute inset-[22px] rounded-full border border-white/10 bg-slate-950" />
        </div>
      </div>

      <div className="space-y-4">
        {normalized.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: colors[item.label] || '#94a3b8' }}
              />
              <span className="text-sm text-slate-200">{item.label}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{item.value}</div>
              <div className="text-xs text-slate-400">{item.pct.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleBars({ data, max, color }) {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-slate-400">
        Sin datos todavía
      </div>
    );
  }

  return (
    <div className="flex h-72 items-end gap-6 rounded-2xl border border-white/10 bg-black/20 p-5">
      {data.map((item) => (
        <div
          key={item.fecha}
          className="flex flex-1 flex-col items-center justify-end gap-3"
        >
          <div className="text-sm font-medium text-slate-200">{item.value}</div>
          <div className="flex h-48 w-full items-end rounded-xl bg-white/[0.04] p-2">
            <div
              className={`w-full rounded-lg bg-gradient-to-t ${color}`}
              style={{
                height: `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)}%`,
              }}
            />
          </div>
          <div className="text-xs text-slate-400">{item.fecha}</div>
        </div>
      ))}
    </div>
  );
}

function SimpleLine({ data, max }) {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-slate-400">
        Sin datos todavía
      </div>
    );
  }

  const width = 560;
  const height = 220;
  const pad = 24;

  const points = data
    .map((d, i) => {
      const x = pad + (i * (width - pad * 2)) / Math.max(data.length - 1, 1);
      const y = height - pad - ((d.value / max) * (height - pad * 2));
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full">
        {[0, 1, 2, 3].map((n) => {
          const y = pad + (n * (height - pad * 2)) / 3;
          return (
            <line
              key={n}
              x1={pad}
              y1={y}
              x2={width - pad}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
            />
          );
        })}

        <polyline
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="4"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((d, i) => {
          const x = pad + (i * (width - pad * 2)) / Math.max(data.length - 1, 1);
          const y = height - pad - ((d.value / max) * (height - pad * 2));

          return (
            <g key={i}>
              <circle cx={x} cy={y} r="5" fill="#38bdf8" />
              <text
                x={x}
                y={height - 4}
                textAnchor="middle"
                fontSize="11"
                fill="rgba(226,232,240,0.8)"
              >
                {d.fecha}
              </text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();

  const cls =
    s === 'interesado'
      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
      : s === 'baja' || s === 'no_interesado'
      ? 'border-rose-400/20 bg-rose-400/10 text-rose-200'
      : s === 'pendiente' || s === 'pendiente_web'
      ? 'border-sky-400/20 bg-sky-400/10 text-sky-200'
      : s === 'followup_enviado' || s === 'enviado_2'
      ? 'border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-200'
      : 'border-white/10 bg-white/5 text-slate-200';

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${cls}`}>
      {status}
    </span>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 font-medium whitespace-nowrap">{children}</th>;
}

function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 text-slate-200 ${className}`}>{children}</td>;
}

function barColor(label) {
  switch (label) {
    case 'Interesados':
      return 'bg-emerald-400';
    case 'No interesados':
      return 'bg-amber-400';
    case 'Bajas':
      return 'bg-rose-400';
    default:
      return 'bg-sky-400';
  }
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('es-ES');
}