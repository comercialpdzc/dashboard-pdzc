'use client';

import React from 'react';

export default function DashboardProOutbound() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const [singleEmail, setSingleEmail] = React.useState('');
  const [bulkEmails, setBulkEmails] = React.useState('');
  const [singleWeb, setSingleWeb] = React.useState('');
  const [bulkWebs, setBulkWebs] = React.useState('');

  const [addingSingle, setAddingSingle] = React.useState(false);
  const [addingBulk, setAddingBulk] = React.useState(false);
  const [addingSingleWeb, setAddingSingleWeb] = React.useState(false);
  const [addingBulkWeb, setAddingBulkWeb] = React.useState(false);

  const [leadMessage, setLeadMessage] = React.useState('');
  const [leadError, setLeadError] = React.useState('');

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
      setData(json);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

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

  function isLikelyWeb(value) {
    const v = String(value || '').trim();
    if (!v) return false;
    return (
      /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v) ||
      /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(v)
    );
  }

  async function sendEmailsToPipeline(emails) {
    const res = await fetch(LEADS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'addLeadsFromDashboard',
        emails,
      }),
    });

    const data = await res.json();

    if (!data?.ok) {
      throw new Error(data?.error || 'Error añadiendo leads');
    }

    return data;
  }

  async function sendWebsToPipeline(webs) {
    const res = await fetch(WEB_LEADS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'addWebLeadsFromDashboard',
        webs,
      }),
    });

    const data = await res.json();

    if (!data?.ok) {
      throw new Error(data?.error || 'Error añadiendo webs');
    }

    return data;
  }

  async function handleAddSingle() {
    setLeadError('');
    setLeadMessage('');

    const email = String(singleEmail || '').trim().toLowerCase();

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

      const result = await sendEmailsToPipeline([email]);

      setLeadMessage(
        `Emails → Añadidos: ${result.inserted} · Duplicados: ${result.duplicates} · Inválidos: ${result.invalid}`
      );
      setSingleEmail('');
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

      const result = await sendEmailsToPipeline(emails);

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

    if (!web) {
      setLeadError('Introduce una web.');
      return;
    }

    if (!isLikelyWeb(web)) {
      setLeadError('La web no parece válida.');
      return;
    }

    try {
      setAddingSingleWeb(true);

      const result = await sendWebsToPipeline([web]);

      setLeadMessage(
        `Webs → Añadidas: ${result.inserted} · Duplicadas: ${result.duplicates}`
      );
      setSingleWeb('');
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

    try {
      setAddingBulkWeb(true);

      const result = await sendWebsToPipeline(webs);

      setLeadMessage(
        `Webs → Añadidas: ${result.inserted} · Duplicadas: ${result.duplicates}`
      );
      setBulkWebs('');
      await loadDashboard();
    } catch (e) {
      setLeadError(String(e?.message || e));
    } finally {
      setAddingBulkWeb(false);
    }
  }

  const bulkParsed = normalizeEmailsFromText(bulkEmails);
  const bulkValidCount = bulkParsed.filter(isValidEmail).length;
  const bulkInvalidCount = bulkParsed.filter((e) => !isValidEmail(e)).length;

  const bulkParsedWebs = normalizeWebsFromText(bulkWebs);
  const bulkValidWebCount = bulkParsedWebs.filter(isLikelyWeb).length;
  const bulkInvalidWebCount = bulkParsedWebs.filter((w) => !isLikelyWeb(w)).length;

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

  const maxEstado = Math.max(...estados.map((e) => e.value), 1);
  const maxEnvios = Math.max(...enviosPorDia.map((d) => d.value), 1);
  const maxAcumulado = Math.max(...acumulado.map((d) => d.value), 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              Publicidad Digital ZC · Outbound Control Center
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Dashboard Pro
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400 md:text-base">
              Interfaz visual conectada a Google Sheets en tiempo real.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <QuickBadge label="Pendientes" value={metrics.pendientes} />
              <QuickBadge
                label="Interesados"
                value={metrics.interesados}
                accent="green"
              />
              <QuickBadge label="Bajas" value={metrics.bajas} accent="red" />
            </div>

            <button
              onClick={handleLogout}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.08]"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

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

        <section className="mb-8">
          <Panel title="Entrada rápida al pipeline">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3">
                  <div className="text-base font-medium text-white">
                    Añadir email suelto
                  </div>
                  <div className="text-sm text-slate-400">
                    Se insertará justo después del último enviado_1 y antes del primer pendiente.
                  </div>
                </div>

                <input
                  type="email"
                  value={singleEmail}
                  onChange={(e) => setSingleEmail(e.target.value)}
                  placeholder="cliente@empresa.com"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />

                <button
                  onClick={handleAddSingle}
                  disabled={addingSingle}
                  className="mt-4 w-full rounded-2xl bg-sky-400 px-4 py-3 text-sm font-medium text-slate-950 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingSingle ? 'Añadiendo...' : 'Añadir email al pipeline'}
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3">
                  <div className="text-base font-medium text-white">
                    Añadir en bulk emails
                  </div>
                  <div className="text-sm text-slate-400">
                    Pega varios emails separados por salto de línea, coma, espacio o punto y coma.
                  </div>
                </div>

                <textarea
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  rows={8}
                  placeholder={`cliente1@empresa.com
cliente2@empresa.com
cliente3@empresa.com`}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <MiniInfo label="Detectados" value={bulkParsed.length} />
                  <MiniInfo label="Válidos" value={bulkValidCount} tone="ok" />
                  <MiniInfo label="Inválidos" value={bulkInvalidCount} tone="bad" />
                </div>

                <button
                  onClick={handleAddBulk}
                  disabled={addingBulk}
                  className="mt-4 w-full rounded-2xl bg-fuchsia-500 px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingBulk ? 'Añadiendo...' : 'Añadir emails en bloque'}
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3">
                  <div className="text-base font-medium text-white">
                    Añadir web suelta
                  </div>
                  <div className="text-sm text-slate-400">
                    Se añadirá al pipeline como pendiente_web y el sistema intentará sacar el email automáticamente.
                  </div>
                </div>

                <input
                  type="text"
                  value={singleWeb}
                  onChange={(e) => setSingleWeb(e.target.value)}
                  placeholder="empresa.com o https://empresa.com"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />

                <button
                  onClick={handleAddSingleWeb}
                  disabled={addingSingleWeb}
                  className="mt-4 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-medium text-slate-950 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingSingleWeb ? 'Añadiendo...' : 'Añadir web al pipeline'}
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3">
                  <div className="text-base font-medium text-white">
                    Añadir en bulk webs
                  </div>
                  <div className="text-sm text-slate-400">
                    Pega varias webs separadas por salto de línea, coma, espacio o punto y coma.
                  </div>
                </div>

                <textarea
                  value={bulkWebs}
                  onChange={(e) => setBulkWebs(e.target.value)}
                  rows={8}
                  placeholder={`empresa1.com
empresa2.com
https://empresa3.com`}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <MiniInfo label="Detectadas" value={bulkParsedWebs.length} />
                  <MiniInfo label="Válidas" value={bulkValidWebCount} tone="ok" />
                  <MiniInfo label="Inválidas" value={bulkInvalidWebCount} tone="bad" />
                </div>

                <button
                  onClick={handleAddBulkWeb}
                  disabled={addingBulkWeb}
                  className="mt-4 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-medium text-slate-950 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingBulkWeb ? 'Añadiendo...' : 'Añadir webs en bloque'}
                </button>
              </div>
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
        </section>

        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Total leads" value={metrics.totalLeads} />
          <MetricCard label="Emails enviados" value={metrics.emailsEnviados} />
          <MetricCard label="Respondidos" value={metrics.respondidos} />
          <MetricCard
            label="Interesados"
            value={metrics.interesados}
            accent="green"
          />
          <MetricCard
            label="No interesados"
            value={metrics.noInteresados}
            accent="amber"
          />
          <MetricCard label="Bajas" value={metrics.bajas} accent="red" />
        </section>

        <section className="mb-8 grid gap-4 lg:grid-cols-3">
          <Panel title="Conversión">
            <div className="grid grid-cols-2 gap-4">
              <KpiBlock label="% respuesta" value={`${metrics.respuestaPct}%`} />
              <KpiBlock
                label="% interesados"
                value={`${metrics.interesadosPct}%`}
              />
            </div>
          </Panel>

          <Panel title="Actividad diaria">
            <div className="grid grid-cols-2 gap-4">
              <KpiBlock label="Enviados hoy" value={metrics.enviadosHoy} />
              <KpiBlock label="Respuestas hoy" value={metrics.respuestasHoy} />
            </div>
          </Panel>

          <Panel title="Ratio real">
            <div className="grid grid-cols-3 gap-4">
              <KpiBlock label="Interesados" value={metrics.interesados} />
              <KpiBlock label="Clientes" value={metrics.clientes} />
              <KpiBlock
                label="Ratio cierre"
                value={`${metrics.ratioCierre}%`}
              />
            </div>
          </Panel>
        </section>

        <section className="mb-8 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Pipeline por estado">
            <div className="space-y-5">
              {estados.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-medium text-slate-100">
                      {item.value}
                    </span>
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

        <section className="mb-8 grid gap-4 lg:grid-cols-2">
          <Panel title="Gráfico de evolución · envíos por día">
            <SimpleBars
              data={enviosPorDia}
              max={maxEnvios}
              color="from-fuchsia-500 to-violet-500"
            />
          </Panel>

          <Panel title="Curva de crecimiento real · leads acumulados">
            <SimpleLine data={acumulado} max={maxAcumulado} />
          </Panel>
        </section>

        <section className="mb-8 grid gap-4 2xl:grid-cols-[1fr_1fr]">
          <Panel title="Respuestas">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
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
                    <tr
                      key={i}
                      className="border-t border-white/10 bg-white/[0.02]"
                    >
                      <Td>{r.empresa}</Td>
                      <Td>
                        <StatusBadge status={r.estado} />
                      </Td>
                      <Td>{r.respuesta}</Td>
                      <Td>{r.accion}</Td>
                      <Td>{formatDate(r.fecha)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Base de leads">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
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
                    <tr
                      key={i}
                      className="border-t border-white/10 bg-white/[0.02]"
                    >
                      <Td>{r.empresa}</Td>
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
          </Panel>
        </section>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-medium tracking-tight text-slate-100">
          {title}
        </h2>
      </div>
      {children}
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
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
        {value}
      </div>
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
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
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
              <div className="text-xs text-slate-400">
                {item.pct.toFixed(1)}%
              </div>
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
                height: `${Math.max(
                  (item.value / max) * 100,
                  item.value > 0 ? 8 : 0
                )}%`,
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
              <circle cx={x} cy={y} r="5" fill="#a78bfa" />
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
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#8b5cf6" />
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
      : s === 'baja' || s === 'no_interesado' || s === 'web_sin_email' || s === 'error_web'
      ? 'border-rose-400/20 bg-rose-400/10 text-rose-200'
      : s === 'pendiente' || s === 'pendiente_web'
      ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
      : 'border-white/10 bg-white/5 text-slate-200';

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${cls}`}>
      {status}
    </span>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
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