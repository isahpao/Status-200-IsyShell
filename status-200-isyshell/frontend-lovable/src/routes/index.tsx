import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Status 200 · IsyShell Panel" },
      { name: "description", content: "Painel de automação segura via API — Status 200 IsyShell." },
    ],
  }),
  component: IsyShellPanel,
});

const API_BASE = "http://localhost:8000";
const FALLBACK_SCRIPTS = [
  "cleanup_logs",
  "docker_status",
  "check_disk_usage",
  "restart_service",
  "backup_database",
];

const SCRIPT_DESCRIPTIONS: Record<string, string> = {
  cleanup_logs: "Remove logs antigos do sistema",
  docker_status: "Verifica o status dos containers",
  check_disk_usage: "Analisa o uso de disco",
  restart_service: "Reinicia um serviço do sistema",
  backup_database: "Executa backup do banco de dados",
};

interface LogEntry {
  id: number | string;
  script_name: string;
  status: string;
  stdout?: string;
  stderr?: string;
  created_at: string;
}

function IsyShellPanel() {
  const [token, setToken] = useState("");
  const [scripts, setScripts] = useState<string[]>(FALLBACK_SCRIPTS);
  const [selected, setSelected] = useState<string>(FALLBACK_SCRIPTS[0]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("isy_token") : "";
    if (saved) setToken(saved);
  }, []);

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      "X-Isy-Token": token,
    }),
    [token],
  );

  const saveToken = (v: string) => {
    setToken(v);
    if (typeof window !== "undefined") localStorage.setItem("isy_token", v);
  };

  const loadScripts = useCallback(async () => {
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/v1/scripts`, { headers: headers() });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    const list: string[] = Array.isArray(data)
      ? data.map((s: unknown) =>
          typeof s === "string"
            ? s
            : (s as { script_name?: string; name?: string }).script_name ??
              (s as { script_name?: string; name?: string }).name ??
              "",
        )
      : Array.isArray((data as { scripts?: unknown[] }).scripts)
        ? (data as { scripts: unknown[] }).scripts
            .map((s) =>
              typeof s === "string"
                ? s
                : (s as { script_name?: string; name?: string }).script_name ??
                  (s as { script_name?: string; name?: string }).name ??
                  "",
            )
            .filter(Boolean)
        : FALLBACK_SCRIPTS;

    if (list.length) {
      setScripts(list);
      if (!list.includes(selected)) setSelected(list[0]);
    }
  } catch {
    setScripts(FALLBACK_SCRIPTS);
  }
}, [token, headers, selected]);

  const loadLogs = useCallback(async () => {
    if (!token) {
      setLogsError("Informe o X-Isy-Token para carregar os logs.");
      return;
    }
    setLogsLoading(true);
    setLogsError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/logs`, { headers: headers() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const arr: LogEntry[] = Array.isArray(data)
        ? data
        : Array.isArray((data as { logs?: LogEntry[] }).logs)
          ? (data as { logs: LogEntry[] }).logs
          : [];
      setLogs(arr);
    } catch (e) {
      setLogsError(e instanceof Error ? e.message : "Erro ao carregar logs");
    } finally {
      setLogsLoading(false);
    }
  }, [token, headers]);

  const executeScript = async () => {
    if (!token) {
      setResultError("Informe o X-Isy-Token antes de executar.");
      return;
    }
    if (!selected) return;
    setRunning(true);
    setResult(null);
    setResultError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/scripts/${selected}/execute`, {
        method: "POST",
        headers: headers(),
      });
      const text = await res.text();
      let data: unknown = text;
      try {
        data = JSON.parse(text);
      } catch {
        /* keep as text */
      }
      if (!res.ok) {
        setResultError(`HTTP ${res.status}`);
      }
      setResult(data);
      loadLogs();
    } catch (e) {
      setResultError(e instanceof Error ? e.message : "Falha na requisição");
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadScripts();
      loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen text-foreground">
      {/* Top bar */}
      <header className="border-b border-border/60 backdrop-blur-md bg-background/70 sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-9 w-9 rounded-md bg-primary/15 border border-primary/40 flex items-center justify-center">
                <span className="font-mono text-primary text-sm font-bold">200</span>
              </div>
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-success animate-pulse shadow-[0_0_10px_var(--success)]" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-semibold tracking-tight">
                Status 200 <span className="text-primary">·</span> IsyShell
              </h1>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Secure automation panel
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> API {API_BASE}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Auth card */}
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <LockIcon /> Autenticação
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Header obrigatório <code className="font-mono text-primary">X-Isy-Token</code> em todas as
                requisições.
              </p>
            </div>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-1 rounded border ${
                token
                  ? "border-success/50 text-success bg-success/10"
                  : "border-destructive/50 text-destructive bg-destructive/10"
              }`}
            >
              {token ? "Token ativo" : "Sem token"}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={token}
              onChange={(e) => saveToken(e.target.value)}
              placeholder="Cole seu X-Isy-Token..."
              className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
            />
            <button
              onClick={loadScripts}
              className="rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/70 transition"
            >
              Validar
            </button>
          </div>
        </section>

        {/* Scripts */}
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <BoltIcon /> Scripts autorizados
            </h2>
            <span className="text-xs text-muted-foreground font-mono">{scripts.length} disponíveis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scripts.map((s) => {
              const active = s === selected;
              return (
                <button
                  key={s}
                  onClick={() => setSelected(s)}
                  className={`text-left rounded-md border p-3 transition group ${
                    active
                      ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--primary)]"
                      : "border-border bg-background/40 hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm">{s}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        active ? "bg-primary shadow-[0_0_8px_var(--primary)]" : "bg-muted-foreground/30"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {SCRIPT_DESCRIPTIONS[s] ?? "Script remoto"}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm font-mono outline-none focus:border-primary"
            >
              {scripts.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={executeScript}
              disabled={running || !token}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 min-w-[140px]"
            >
              {running ? (
                <>
                  <Spinner /> Executando
                </>
              ) : (
                <>▶ Executar</>
              )}
            </button>
          </div>
        </section>

        {/* Result */}
        <section className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/40">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <TerminalIcon /> Resultado da execução
            </h2>
            {resultError && (
              <span className="text-xs text-destructive font-mono">{resultError}</span>
            )}
          </div>
          <pre className="p-5 text-xs font-mono whitespace-pre-wrap break-words text-foreground/90 max-h-96 overflow-auto">
            {result === null
              ? "// Aguardando execução..."
              : typeof result === "string"
                ? result
                : JSON.stringify(result, null, 2)}
          </pre>
        </section>

        {/* Logs */}
        <section className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/40">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <ShieldIcon /> Auditoria & Logs
              {logsError && <span className="text-xs text-destructive font-mono ml-2">{logsError}</span>}
            </h2>
            <button
              onClick={loadLogs}
              disabled={logsLoading}
              className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/70 transition disabled:opacity-50 flex items-center gap-2"
            >
              {logsLoading ? <Spinner /> : "↻"} Atualizar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border bg-background/30">
                  <th className="px-4 py-2 font-medium">ID</th>
                  <th className="px-4 py-2 font-medium">Script</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">stdout</th>
                  <th className="px-4 py-2 font-medium">stderr</th>
                  <th className="px-4 py-2 font-medium">created_at</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum log carregado.
                    </td>
                  </tr>
                )}
                {logs.map((l) => {
                  const ok = String(l.status).toLowerCase().match(/success|ok|200|0/);
                  return (
                    <tr key={String(l.id)} className="border-b border-border/50 hover:bg-background/40">
                      <td className="px-4 py-2 text-muted-foreground">{l.id}</td>
                      <td className="px-4 py-2 text-primary">{l.script_name}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] border ${
                            ok
                              ? "border-success/50 text-success bg-success/10"
                              : "border-destructive/50 text-destructive bg-destructive/10"
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 max-w-[200px] truncate" title={l.stdout ?? ""}>
                        {l.stdout || "—"}
                      </td>
                      <td
                        className="px-4 py-2 max-w-[200px] truncate text-destructive/80"
                        title={l.stderr ?? ""}
                      >
                        {l.stderr || "—"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{l.created_at}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="text-center text-[11px] text-muted-foreground font-mono pt-4 pb-8">
          © Status 200 · IsyShell — Secure. Authenticated. Audited.
        </footer>
      </main>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin" />
  );
}
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function TerminalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
