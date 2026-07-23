"use client";

import { useState, useTransition } from "react";
import { RRule, rrulestr, Weekday } from "rrule";
import { updateClubFieldAction } from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";
import { PencilIcon } from "@/components/ui/icons";
import { TimeSlotsEditor } from "./time-slots-editor";

const DIAS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

type Field =
  | "city"
  | "tagline"
  | "description"
  | "maxGramsPerMonth"
  | "minGramsPerWithdrawal"
  | "minGramsPerStrain"
  | "gramsStep"
  | "nextAsambleaDate"
  | "mandateStart"
  | "mandateYears";

export function ConfigForm({
  initial,
}: {
  initial: {
    city: string | null;
    tagline: string | null;
    description: string | null;
    workingDays: number[];
    timeSlots: string[];
    maxGramsPerMonth: number;
    minGramsPerWithdrawal: number;
    minGramsPerStrain: number;
    gramsStep: number;
    meetingRule: string | null;
    fiscalYearEndRule: string | null;
    nextAsambleaDate: string | null;
    mandateStart: string | null;
    mandateYears: number | null;
  };
}) {
  return (
    <div className="space-y-8">
      {/* Presentación pública */}
      <section>
        <div className="mb-3">
          <h3 className="text-sm font-medium">Presentación pública</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Lo que se muestra en la portada del club.
          </p>
        </div>
        <div className="card p-0 [&>*+*]:border-t [&>*+*]:border-[var(--border-subtle)]">
          <EditableRow
            field="city"
            label="Ciudad"
            value={initial.city ?? ""}
            placeholder="Montevideo"
            inline
          />
          <EditableRow
            field="tagline"
            label="Frase de portada"
            value={initial.tagline ?? ""}
            placeholder="Cultivo colectivo y responsable"
            inline
          />
          <EditableRow
            field="description"
            label="Descripción"
            value={initial.description ?? ""}
            placeholder="Quiénes somos, cómo funciona el club, etc."
            multiline
            inline
          />
        </div>
      </section>

      {/* Plazos de directiva: encienden los avisos del sidebar */}
      <section>
        <div className="mb-3">
          <h3 className="text-sm font-medium">Directiva y plazos</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Fechas y cadencias que encienden los avisos del panel. Sin definir, no hay aviso.
          </p>
        </div>
        <div className="card p-0 [&>*+*]:border-t [&>*+*]:border-[var(--border-subtle)]">
          <RecurrenceRow
            field="meetingRule"
            label="Junta de directiva"
            hint="cuándo corresponde una junta"
            kind="monthly"
            initial={initial.meetingRule ?? ""}
          />
          <RecurrenceRow
            field="fiscalYearEndRule"
            label="Cierre del ejercicio"
            kind="yearly"
            initial={initial.fiscalYearEndRule ?? ""}
          />
          <EditableRow
            field="nextAsambleaDate"
            label="Próxima asamblea anual"
            value={initial.nextAsambleaDate ?? ""}
            date
            inline
          />
          <EditableRow
            field="mandateStart"
            label="Inicio del mandato vigente"
            hint="cuándo asumió la directiva actual"
            value={initial.mandateStart ?? ""}
            date
            inline
          />
          <EditableRow
            field="mandateYears"
            label="Duración del mandato (años)"
            value={initial.mandateYears != null ? String(initial.mandateYears) : ""}
            numeric
            inline
          />
        </div>
      </section>

      {/* Días hábiles y franjas horarias */}
      <section>
        <div className="mb-3">
          <h3 className="text-sm font-medium">Días y horarios de retiro</h3>
        </div>
        <div className="card p-0 [&>*+*]:border-t [&>*+*]:border-[var(--border-subtle)]">
          <div className="px-5 py-4">
            <WorkingDays initial={initial.workingDays} />
          </div>
          <div className="px-5 py-4">
            <TimeSlotsEditor initial={initial.timeSlots} />
          </div>
        </div>
      </section>

      {/* Límites de cupo */}
      <section>
        <div className="mb-3">
          <h3 className="text-sm font-medium">Límites de retiro</h3>
        </div>
        <div className="card p-0 [&>*+*]:border-t [&>*+*]:border-[var(--border-subtle)]">
          <EditableRow
            field="maxGramsPerMonth"
            label="Cupo mensual por socio (g)"
            value={String(initial.maxGramsPerMonth)}
            numeric
            inline
          />
          <EditableRow
            field="minGramsPerWithdrawal"
            label="Mínimo por retiro (g)"
            value={String(initial.minGramsPerWithdrawal)}
            numeric
            inline
          />
          <EditableRow
            field="minGramsPerStrain"
            label="Mínimo por variedad (g)"
            value={String(initial.minGramsPerStrain)}
            numeric
            inline
          />
          <EditableRow
            field="gramsStep"
            label="Múltiplo de gramos"
            hint="¿De a cuánto pueden agregar tus socios al pedir? Con 10, solo cantidades redondas (10, 20, 30…), con 1, cualquier cantidad."
            value={String(initial.gramsStep)}
            numeric
            inline
          />
        </div>
      </section>
    </div>
  );
}

/**
 * Fila de un parámetro: muestra el valor con un lápiz a la derecha; al tocarlo
 * aparece el campo editable con guardar/cancelar. Guarda solo ese campo.
 */
function EditableRow({
  field,
  label,
  hint,
  value: initialValue,
  placeholder,
  multiline,
  numeric,
  date,
  inline,
}: {
  field: Field;
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  numeric?: boolean;
  date?: boolean;
  /** El valor va a la derecha del título, en la misma línea (no debajo). */
  inline?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [draft, setDraft] = useState(initialValue);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function open() {
    setDraft(value);
    setError(null);
    setEditing(true);
  }

  function save() {
    start(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("field", field);
      fd.set("value", draft);
      const res = await updateClubFieldAction(null, fd);
      if (res && "error" in res && res.error) {
        setError(res.error);
      } else {
        setValue(draft);
        setEditing(false);
      }
    });
  }

  return (
    <div className="px-5 py-3">
      {!editing ? (
        <div className={`flex ${inline ? "items-center" : "items-start"} justify-between gap-3`}>
          <div className="min-w-0">
            <div className="text-sm font-medium">
              {label}
              {hint && (
                <span className="font-normal text-[var(--muted-foreground)]">
                  {" "}— {hint}
                </span>
              )}
            </div>
            {!inline && (
              <div
                className={`text-sm mt-0.5 ${
                  value
                    ? "text-[var(--muted-foreground)] whitespace-pre-wrap"
                    : "text-[var(--fg-quaternary)] italic"
                }`}
              >
                {(date && value ? value.split("-").reverse().join("/") : value) ||
                  "Sin definir"}
              </div>
            )}
          </div>
          {inline ? (
            <div className="flex items-center gap-8 shrink-0 max-w-[60%]">
              <span
                className={`text-sm text-right ${
                  value ? "font-medium" : "text-[var(--fg-quaternary)] italic"
                }`}
              >
                {(date && value ? value.split("-").reverse().join("/") : value) ||
                  "Sin definir"}
              </span>
              <button
                type="button"
                aria-label={`Editar ${label}`}
                onClick={open}
                className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors shrink-0"
              >
                <PencilIcon />
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label={`Editar ${label}`}
              onClick={open}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors shrink-0"
            >
              <PencilIcon />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{label}</label>
          {multiline ? (
            <textarea
              autoFocus
              rows={4}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="input"
            />
          ) : (
            <input
              autoFocus
              type={date ? "date" : numeric ? "number" : "text"}
              min={numeric ? 1 : undefined}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="input"
            />
          )}
          {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="btn btn-primary text-sm inline-flex items-center gap-2"
            >
              {pending && <SavingSpinner />}
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn btn-ghost text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Recurrencias (RRULE) ──────────────────────────────────
// Juntas y cierre de ejercicio se guardan como regla de recurrencia (RFC 5545)
// generada por la librería rrule a partir de una fecha elegida con el date
// picker: la fecha solo define el patrón, no se guarda.

const WEEKDAYS_ES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const RRULE_WEEKDAYS = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];

function first<T>(v: T | T[] | null | undefined): T | undefined {
  return Array.isArray(v) ? v[0] : v ?? undefined;
}

/** Texto de una regla guardada ("El día 15 de cada mes"). */
function ruleLabel(ruleStr: string): string {
  try {
    const o = rrulestr(ruleStr).origOptions;
    if (o.freq === RRule.YEARLY) {
      const d = first(o.bymonthday);
      const m = first(o.bymonth);
      if (d && m) {
        return `El ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")} de cada año`;
      }
    }
    if (o.freq === RRule.MONTHLY) {
      const interval = o.interval ?? 1;
      const sufijo = interval > 1 ? `cada ${interval} meses` : "de cada mes";
      const d = first(o.bymonthday);
      if (d) return `El día ${d} ${sufijo}`;
      const wd = first(o.byweekday);
      if (wd instanceof Weekday && wd.n) {
        return `El ${wd.n}.º ${WEEKDAYS_ES[wd.weekday]} ${sufijo}`;
      }
    }
    return ruleStr;
  } catch {
    return ruleStr;
  }
}

/**
 * Fila de una recurrencia: mensual (juntas: día del mes o n.º día de semana)
 * o anual (cierre de ejercicio: día y mes). Misma mecánica que EditableRow.
 */
function RecurrenceRow({
  field,
  label,
  hint,
  kind,
  initial,
}: {
  field: "meetingRule" | "fiscalYearEndRule";
  label: string;
  hint?: string;
  kind: "monthly" | "yearly";
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  // yearly: fecha del picker (solo define día y mes)
  const [draft, setDraft] = useState("");
  // monthly: día de la semana (0 = lunes), semana del mes (1-4) y cada
  // cuántos meses
  const [weekdayIdx, setWeekdayIdx] = useState(0);
  const [week, setWeek] = useState(1);
  // Texto libre mientras se edita (permite borrar); se interpreta al usarlo.
  const [months, setMonths] = useState("1");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const dt = draft ? new Date(`${draft}T00:00:00Z`) : null;
  const monthsInt = Math.max(1, Number(months) || 1);

  function buildDraftRule(): string {
    if (kind === "yearly") {
      if (!dt) return "";
      return new RRule({
        freq: RRule.YEARLY,
        bymonth: dt.getUTCMonth() + 1,
        bymonthday: dt.getUTCDate(),
      }).toString();
    }
    return new RRule({
      freq: RRule.MONTHLY,
      interval: monthsInt,
      byweekday: RRULE_WEEKDAYS[weekdayIdx].nth(week),
    }).toString();
  }

  function persist(ruleStr: string) {
    start(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("field", field);
      fd.set("value", ruleStr);
      const res = await updateClubFieldAction(null, fd);
      if (res && "error" in res && res.error) {
        setError(res.error);
      } else {
        setValue(ruleStr);
        setEditing(false);
      }
    });
  }

  function open() {
    if (kind === "yearly") {
      setDraft(new Date().toISOString().slice(0, 10));
    } else if (value) {
      // Prellenar los selectores desde la regla guardada.
      try {
        const o = rrulestr(value).origOptions;
        const wd = first(o.byweekday);
        if (wd instanceof Weekday && wd.n) {
          setWeekdayIdx(wd.weekday);
          setWeek(wd.n);
        }
        setMonths(String(o.interval ?? 1));
      } catch {
        // regla ilegible: quedan los valores por defecto
      }
    }
    setError(null);
    setEditing(true);
  }

  return (
    <div className="px-5 py-3">
      {!editing ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">
              {label}
              {hint && (
                <span className="font-normal text-[var(--muted-foreground)]"> — {hint}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-8 shrink-0 max-w-[60%]">
            <span
              className={`text-sm text-right ${
                value ? "font-medium" : "text-[var(--fg-quaternary)] italic"
              }`}
            >
              {value ? ruleLabel(value) : "Sin definir"}
            </span>
            <button
              type="button"
              aria-label={`Editar ${label}`}
              onClick={open}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-colors shrink-0"
            >
              <PencilIcon />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{label}</label>
          {kind === "yearly" ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="shrink-0">
                  <div className="text-sm font-medium">Fecha</div>
                  <div className="text-xs text-[var(--muted-foreground)] truncate">día y mes del cierre</div>
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    autoFocus
                    type="date"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              {dt && (
                <p className="text-sm text-[var(--muted-foreground)]">
                  El {String(dt.getUTCDate()).padStart(2, "0")}/
                  {String(dt.getUTCMonth() + 1).padStart(2, "0")} de cada año
                </p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="shrink-0">
                  <div className="text-sm font-medium">Día</div>
                  <div className="text-xs text-[var(--muted-foreground)] truncate">día de la semana de la junta</div>
                </div>
                <div className="flex-1 min-w-0">
                  <select
                    autoFocus
                    value={weekdayIdx}
                    onChange={(e) => setWeekdayIdx(Number(e.target.value))}
                    className="input"
                    aria-label="Día de la semana"
                  >
                    {WEEKDAYS_ES.map((d, i) => (
                      <option key={d} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="shrink-0">
                  <div className="text-sm font-medium">Semana</div>
                  <div className="text-xs text-[var(--muted-foreground)] truncate">semana del mes</div>
                </div>
                <div className="flex-1 min-w-0">
                  <select
                    value={week}
                    onChange={(e) => setWeek(Number(e.target.value))}
                    className="input"
                    aria-label="Semana del mes"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}.ª semana
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="shrink-0">
                  <div className="text-sm font-medium">Frecuencia</div>
                  <div className="text-xs text-[var(--muted-foreground)] truncate">cada cuántos meses</div>
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                    className="input"
                    aria-label="Cada cuántos meses"
                  />
                </div>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                El {week}.º {WEEKDAYS_ES[weekdayIdx]}{" "}
                {monthsInt > 1 ? `cada ${monthsInt} meses` : "de cada mes"}
              </p>
            </>
          )}
          {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => persist(buildDraftRule())}
              disabled={pending || (kind === "yearly" && !draft)}
              className="btn btn-primary text-sm inline-flex items-center gap-2"
            >
              {pending && <SavingSpinner />}
              Guardar
            </button>
            {value && (
              <button
                type="button"
                onClick={() => persist("")}
                disabled={pending}
                className="btn btn-ghost text-sm text-[var(--destructive)]"
              >
                Quitar
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn btn-ghost text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Días hábiles: toggles que guardan al instante (edición individual). */
function WorkingDays({ initial }: { initial: number[] }) {
  const [days, setDays] = useState<number[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle(d: number) {
    const next = days.includes(d) ? days.filter((x) => x !== d) : [...days, d];
    setDays(next);
    start(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("field", "workingDays");
      for (const v of next) fd.append("value", String(v));
      const res = await updateClubFieldAction(null, fd);
      if (res && "error" in res && res.error) {
        setError(res.error);
        setDays(days); // revertir en caso de error
      }
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium">Días hábiles de retiro</span>
        {pending && <SavingSpinner />}
      </div>
      <div className="flex flex-wrap gap-2">
        {DIAS.map((d) => {
          const activo = days.includes(d.value);
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => toggle(d.value)}
              disabled={pending}
              className={`px-4 py-2 rounded-full border text-sm transition-all ${
                activo
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-[var(--destructive)] mt-1">{error}</p>}
    </div>
  );
}
