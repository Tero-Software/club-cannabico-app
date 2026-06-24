"use client";

import { useActionState, useEffect, useState } from "react";
import { updateClubConfigAction, type ConfigState } from "./actions";
import { SavingSpinner } from "@/components/ui/saving-spinner";

const DIAS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

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
  };
}) {
  const [state, action, pending] = useActionState<ConfigState, FormData>(
    updateClubConfigAction,
    null,
  );
  const [days, setDays] = useState<number[]>(initial.workingDays);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [state]);

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const fieldErrors = state && "error" in state ? state.fieldErrors : undefined;

  return (
    <form action={action} className="card flex flex-col gap-6">
      {days.map((d) => (
        <input key={d} type="hidden" name="workingDays" value={d} />
      ))}

      <div className="flex flex-col gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h3 className="text-sm font-medium">Presentación pública</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Lo que se muestra en la portada del club.
          </p>
        </div>

        <div>
          <label htmlFor="city" className="label">
            Ciudad
          </label>
          <input
            id="city"
            name="city"
            type="text"
            maxLength={120}
            defaultValue={initial.city ?? ""}
            placeholder="Montevideo"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="tagline" className="label">
            Frase de portada
          </label>
          <input
            id="tagline"
            name="tagline"
            type="text"
            maxLength={200}
            defaultValue={initial.tagline ?? ""}
            placeholder="Cultivo colectivo y responsable"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="description" className="label">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            defaultValue={initial.description ?? ""}
            placeholder="Quiénes somos, cómo funciona el club, etc."
            className="input"
          />
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Texto libre. Los saltos de línea se respetan en la portada.
          </p>
        </div>
      </div>

      <div>
        <label className="label">Días hábiles de retiro</label>
        <div className="flex flex-wrap gap-2">
          {DIAS.map((d) => {
            const activo = days.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
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
        {fieldErrors?.workingDays && (
          <p className="text-sm text-[var(--destructive)] mt-1">{fieldErrors.workingDays}</p>
        )}
      </div>

      <div>
        <label htmlFor="timeSlots" className="label">
          Franjas horarias
        </label>
        <textarea
          id="timeSlots"
          name="timeSlots"
          rows={3}
          defaultValue={initial.timeSlots.join("\n")}
          placeholder="18:00-19:00&#10;19:00-20:00"
          className="input font-mono text-sm"
        />
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Una franja por línea o separadas por coma. Formato HH:MM-HH:MM.
        </p>
        {fieldErrors?.timeSlots && (
          <p className="text-sm text-[var(--destructive)] mt-1">{fieldErrors.timeSlots}</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="maxGramsPerMonth" className="label">
            Cupo mensual por socio (g)
          </label>
          <input
            id="maxGramsPerMonth"
            name="maxGramsPerMonth"
            type="number"
            min={1}
            defaultValue={initial.maxGramsPerMonth}
            required
            className="input"
          />
          {fieldErrors?.maxGramsPerMonth && (
            <p className="text-sm text-[var(--destructive)] mt-1">{fieldErrors.maxGramsPerMonth}</p>
          )}
        </div>
        <div>
          <label htmlFor="minGramsPerWithdrawal" className="label">
            Mínimo por retiro (g)
          </label>
          <input
            id="minGramsPerWithdrawal"
            name="minGramsPerWithdrawal"
            type="number"
            min={1}
            defaultValue={initial.minGramsPerWithdrawal}
            required
            className="input"
          />
          {fieldErrors?.minGramsPerWithdrawal && (
            <p className="text-sm text-[var(--destructive)] mt-1">{fieldErrors.minGramsPerWithdrawal}</p>
          )}
        </div>
        <div>
          <label htmlFor="minGramsPerStrain" className="label">
            Mínimo por variedad (g)
          </label>
          <input
            id="minGramsPerStrain"
            name="minGramsPerStrain"
            type="number"
            min={1}
            defaultValue={initial.minGramsPerStrain}
            required
            className="input"
          />
          {fieldErrors?.minGramsPerStrain && (
            <p className="text-sm text-[var(--destructive)] mt-1">{fieldErrors.minGramsPerStrain}</p>
          )}
        </div>
        <div>
          <label htmlFor="gramsStep" className="label">
            Múltiplo de gramos
          </label>
          <input
            id="gramsStep"
            name="gramsStep"
            type="number"
            min={1}
            defaultValue={initial.gramsStep}
            required
            className="input"
          />
          {fieldErrors?.gramsStep && (
            <p className="text-sm text-[var(--destructive)] mt-1">{fieldErrors.gramsStep}</p>
          )}
        </div>
      </div>

      {state && "error" in state && state.error && (
        <p className="text-sm text-[var(--destructive)]">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          {pending && <SavingSpinner />}
          Guardar cambios
        </button>
        {justSaved && (
          <span className="text-sm text-[var(--primary)]">Guardado.</span>
        )}
      </div>
    </form>
  );
}
