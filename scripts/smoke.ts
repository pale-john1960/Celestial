// Celestial — E2E smoke test (bun run scripts/smoke.ts / bun run smoke)
//
// Drives the running dev app (http://localhost:3000) through the
// agent-browser CLI using its DEFAULT session (close → fresh open), so it
// never touches other agents' named sessions. Every step is best-effort:
// failures are logged and the run continues; the exit code is 0 only when
// every step passed and no console/page errors were captured.
//
// Covered: title + hero, month grid + today ring, all 5 views, settings
// sheet (S), search dialog (Ctrl+K), date converter dialog (C, 3 calendar
// rows), locale switch ja → back to en (store left in EN), and /api/time/ntp
// health from inside the page. Console errors (agent-browser console) AND
// an in-page window.__errs listener (uncaught errors + rejections) gate the
// final result.
//
// No test framework, no new dependencies — node:child_process.spawnSync
// (runs on Bun) + agent-browser.

import { spawnSync } from "node:child_process";

const BASE_URL = "http://localhost:3000";
/** per-step waits (agent-browser --timeout) */
const STEP_TIMEOUT = 14_000;
/** hard cap on any single agent-browser invocation */
const CMD_TIMEOUT = 30_000;

interface StepResult {
  name: string;
  ok: boolean;
  detail: string;
}

const results: StepResult[] = [];

/** run one agent-browser command in the DEFAULT session (never inherits
 *  AGENT_BROWSER_SESSION from the caller's shell) */
function ab(args: string[]): { ok: boolean; out: string } {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.AGENT_BROWSER_SESSION;
  let proc: ReturnType<typeof spawnSync> | null = null;
  try {
    proc = spawnSync("agent-browser", args, {
      env,
      timeout: CMD_TIMEOUT,
      killSignal: "SIGKILL",
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return { ok: false, out: `spawn failed: agent-browser ${args.join(" ")}` };
  }
  const out = `${proc.stdout ?? ""}${proc.stderr ?? ""}${proc.error ? String(proc.error) : ""}`;
  return { ok: proc.status === 0, out };
}

/** eval JS in the page; returns the result string (agent-browser awaits
 *  promises) or null on failure */
function evalJs(js: string): string | null {
  const r = ab(["eval", js]);
  if (!r.ok) return null;
  // strip trailing newline / quotes the CLI echoes for plain values
  return r.out.trim().replace(/^"|"$/g, "");
}

function step(name: string, fn: () => boolean | string): boolean {
  let ok = false;
  let detail = "";
  try {
    const res = fn();
    if (typeof res === "string") {
      ok = false;
      detail = res;
    } else {
      ok = res;
      detail = ok ? "" : "assertion failed";
    }
  } catch (err) {
    ok = false;
    detail = String(err);
  }
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : ` — ${detail}`}`);
  return ok;
}

/** click + element wait convenience (both must succeed) */
function clickAndWait(clickArgs: string[], selector: string): boolean {
  const c = ab(["find", ...clickArgs]);
  if (!c.ok) return false;
  const w = ab(["wait", selector, "--timeout", String(STEP_TIMEOUT)]);
  return w.ok;
}

function dialogCount(): number {
  const n = evalJs("document.querySelectorAll('[role=dialog]').length");
  return n === null ? -1 : Number(n) || 0;
}

/** click a settings radio row and wait for <html lang> to follow — the
 *  sheet slides in, so clicks during the animation can miss the label;
 *  retry a few times before giving up */
function switchLocale(code: "en" | "ja" | "fa"): string {
  const selector = `label[for=sys-locale-${code}]`;
  const langNow = () => evalJs("document.documentElement.lang") ?? "";
  for (let attempt = 0; attempt < 4; attempt++) {
    if (langNow() === code) return code;
    ab(["click", selector]);
    const w = ab([
      "wait",
      "--fn",
      `document.documentElement.lang==='${code}'`,
      "--timeout",
      "3000",
    ]);
    if (w.ok && langNow() === code) return code;
    ab(["wait", "400"]); // animation / retry backoff
  }
  return langNow();
}

// ---------------------------------------------------------------------------
// setup: fresh default-session browser + console buffer + app load
// ---------------------------------------------------------------------------
console.log(`smoke: target ${BASE_URL} (agent-browser default session)`);
ab(["close"]); // may fail if none is open — fine
ab(["open"]); // launch on about:blank so console capture starts pre-navigation
ab(["console", "--clear"]);
const opened = ab(["open", BASE_URL]);
if (!opened.ok) {
  console.log(`✗ setup — dev server not reachable: ${opened.out.trim()}`);
  process.exit(1);
}
// the shared default browser can be closed/navigated by other tooling at any
// moment — retry the initial load once before declaring the app dead
let gridWait = ab(["wait", "[role=gridcell]", "--timeout", String(STEP_TIMEOUT)]);
if (!gridWait.ok) {
  ab(["open", BASE_URL]);
  gridWait = ab(["wait", "[role=gridcell]", "--timeout", String(STEP_TIMEOUT)]);
}
if (!gridWait.ok) {
  console.log(`✗ setup — app never rendered a month grid: ${gridWait.out.trim()}`);
  process.exit(1);
}
// fallback error capture: uncaught errors + unhandled rejections from here on
ab([
  "eval",
  "window.__errs=[];window.addEventListener('error',e=>window.__errs.push(String(e.message||e)));" +
    "window.addEventListener('unhandledrejection',e=>window.__errs.push(String((e.reason&&e.reason.message)||e.reason)));'armed'",
]);

// the app remembers the locale in localStorage — force EN so the EN tab/
// dialog labels below are stable (silent, not a scored step)
if (evalJs("document.documentElement.lang") !== "en") {
  ab(["press", "s"]);
  ab(["wait", "label[for=sys-locale-en]", "--timeout", String(STEP_TIMEOUT)]);
  ab(["wait", "500"]);
  switchLocale("en");
  ab(["press", "Escape"]);
  ab(["wait", "--fn", "!document.querySelector('[role=dialog]')", "--timeout", String(STEP_TIMEOUT)]);
}

// ---------------------------------------------------------------------------
// steps
// ---------------------------------------------------------------------------
step("title + hero heading", () => {
  const title = ab(["get", "title"]).out;
  if (!title.includes("Celestial")) return `title: ${title.trim()}`;
  return evalJs("!!document.querySelector('h1')") === "true";
});

step("month grid (>=28 cells) + today ring", () => {
  const cells = Number(evalJs("document.querySelectorAll('[role=gridcell]').length"));
  if (!(cells >= 28)) return `only ${cells} gridcells`;
  return evalJs("!!document.querySelector('[role=gridcell] .ring-2')") === "true";
});

step("cycle views Month/Week/Year/Day/Agenda", () => {
  const views: [name: string, section: string][] = [
    ["Week", 'section[aria-label="Week"]'],
    ["Year", 'section[aria-label="Year overview"]'],
    ["Day", 'section[aria-label="Day"]'],
    ["Agenda", 'section[aria-label="Agenda"]'],
    ["Month", 'section[aria-label="Month"]'],
  ];
  const failed: string[] = [];
  for (const [name, section] of views) {
    const ok = clickAndWait(["role", "tab", "click", "--name", name], section);
    if (!ok) failed.push(name);
  }
  if (failed.length) return `views did not render: ${failed.join(", ")}`;
  return true;
});

step("settings sheet opens with S and closes with Escape", () => {
  ab(["press", "s"]);
  const w = ab(["wait", "label[for=sys-locale-en]", "--timeout", String(STEP_TIMEOUT)]);
  if (!w.ok) return "sheet did not open";
  ab(["press", "Escape"]);
  const closed = ab([
    "wait",
    "--fn",
    "!document.querySelector('[role=dialog]')",
    "--timeout",
    String(STEP_TIMEOUT),
  ]);
  return closed.ok && dialogCount() === 0;
});

step("search dialog opens with Ctrl+K and closes with Escape", () => {
  ab(["press", "Control+k"]);
  const w = ab(["wait", "[role=dialog] input", "--timeout", String(STEP_TIMEOUT)]);
  if (!w.ok) return "dialog/input did not appear";
  ab(["press", "Escape"]);
  const closed = ab([
    "wait",
    "--fn",
    "!document.querySelector('[role=dialog]')",
    "--timeout",
    String(STEP_TIMEOUT),
  ]);
  return closed.ok && dialogCount() === 0;
});

step("date converter opens with C (5 calendar rows) and closes", () => {
  ab(["press", "c"]);
  const w = ab(["wait", "[role=dialog] input", "--timeout", String(STEP_TIMEOUT)]);
  if (!w.ok) return "converter did not open";
  const inputs = Number(
    evalJs("document.querySelectorAll('[role=dialog] input').length"),
  );
  const monthSelects = Number(
    evalJs(
      "document.querySelectorAll('[role=dialog] button[role=combobox]').length",
    ),
  );
  // round 14: 5 systems → 5 rows (10 inputs + 5 month selects)
  if (inputs < 10 || monthSelects !== 5) {
    return `expected 10 inputs + 5 month selects, got ${inputs}+${monthSelects}`;
  }
  ab(["press", "Escape"]);
  const closed = ab([
    "wait",
    "--fn",
    "!document.querySelector('[role=dialog]')",
    "--timeout",
    String(STEP_TIMEOUT),
  ]);
  return closed.ok && dialogCount() === 0;
});

step("locale switch to ja and back to en", () => {
  ab(["press", "s"]);
  const open = ab(["wait", "label[for=sys-locale-ja]", "--timeout", String(STEP_TIMEOUT)]);
  if (!open.ok) return "sheet did not open";
  ab(["wait", "500"]); // let the sheet's slide-in animation settle
  const ja = switchLocale("ja");
  if (ja !== "ja") return `html lang after 日本語: ${ja}`;
  const en = switchLocale("en");
  ab(["press", "Escape"]);
  ab(["wait", "--fn", "!document.querySelector('[role=dialog]')", "--timeout", String(STEP_TIMEOUT)]);
  return en === "en" ? true : `html lang after reset: ${en}`;
});

step("API health (/api/time/ntp → 200 from the page)", () => {
  const status = evalJs("fetch('/api/time/ntp').then(r=>r.status)");
  return status === "200" ? true : `status: ${status}`;
});

// ---------------------------------------------------------------------------
// console/page error gate
// ---------------------------------------------------------------------------
step("no console errors / page errors", () => {
  const errs: string[] = [];
  const con = ab(["console", "--json"]);
  if (con.ok) {
    try {
      const parsed = JSON.parse(con.out) as {
        data?: { messages?: { type?: string; text?: string }[] };
      };
      for (const m of parsed.data?.messages ?? []) {
        if (m.type === "error") errs.push(m.text ?? "console error");
      }
    } catch {
      // unparsable console buffer — rely on __errs below
    }
  }
  const inPage = evalJs("(window.__errs||[]).length + ' | ' + (window.__errs||[]).join(' ; ')");
  if (inPage && !inPage.startsWith("0")) errs.push(`page: ${inPage}`);
  if (errs.length) return errs.slice(0, 3).join(" | ").slice(0, 300);
  return true;
});

// ---------------------------------------------------------------------------
// summary
// ---------------------------------------------------------------------------
const failed = results.filter((r) => !r.ok);
console.log("");
if (failed.length === 0) {
  console.log("SMOKE: PASS");
  process.exit(0);
} else {
  console.log(`SMOKE: FAIL (${failed.length})`);
  for (const f of failed) console.log(`  ✗ ${f.name} — ${f.detail}`);
  process.exit(1);
}
