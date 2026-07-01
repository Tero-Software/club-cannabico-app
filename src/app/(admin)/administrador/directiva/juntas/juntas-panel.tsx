"use client";

import { useRef, useState, useTransition } from "react";
import { SubmitWithSpinner } from "@/components/ui/submit-with-spinner";
import { SavingSpinner } from "@/components/ui/saving-spinner";
import { ConfirmButton } from "@/components/ui/confirm-button";
import type { Acta } from "./acta";
import { tituloActa, Encabezado } from "./acta-view";
import {
  startMeeting,
  addItem,
  updateItem,
  deleteItem,
  finishMeeting,
  cancelMeeting,
} from "./actions";

type MeetingType = "DIRECTIVA" | "ASAMBLEA";
type DraftItem = { id: string; title: string; body: string };
type Draft = { id: string; acta: Acta; items: DraftItem[] };

const TERMINO: Record<MeetingType, string> = {
  DIRECTIVA: "junta",
  ASAMBLEA: "asamblea",
};

export function JuntasPanel({
  type,
  draft,
}: {
  type: MeetingType;
  draft: Draft | null;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!draft) {
    return (
      <div className="card flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold">Iniciar {TERMINO[type]}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Abre un acta nueva.
          </p>
        </div>
        <button
          className="btn btn-primary text-sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const res: { meetingId?: string; error?: string } =
                await startMeeting(type);
              if (res.error) setError(res.error);
            })
          }
        >
          {pending ? "Iniciando…" : `Iniciar ${TERMINO[type]}`}
        </button>
        {error && (
          <p className="text-sm text-[var(--destructive)] w-full">{error}</p>
        )}
      </div>
    );
  }

  return <ActiveMeeting draft={draft} />;
}

// Junta en curso: el acta se va escribiendo in situ, fiel al modelo. Los ítems
// automáticos (aprobación + socios) salen del acta; los temas agregados son
// editables y se agregan al final, donde corresponde el próximo punto.
function ActiveMeeting({ draft }: { draft: Draft }) {
  const { acta } = draft;
  // Ítems del acta que no son temas editables (aprobación + socios automáticos).
  const autoItems = acta.items.slice(0, acta.items.length - draft.items.length);

  return (
    <article className="card space-y-5 border-[var(--primary)] text-sm leading-relaxed">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">
          {tituloActa(acta)}{" "}
          <span className="text-sm font-normal text-[var(--primary)]">
            · en curso
          </span>
        </h2>
      </header>

      <Encabezado acta={acta} />

      <hr className="border-[var(--border-subtle)] -mx-6" />

      {/* Orden del día: automáticos + temas + agregar tema in situ. */}
      <ol className="list-decimal list-inside space-y-1">
        {autoItems.map((it, i) => (
          <li key={i}>{it.title}</li>
        ))}
        {draft.items.map((it) => (
          <li key={it.id}>{it.title}</li>
        ))}
        <li className="list-none">
          <AddItemForm meetingId={draft.id} />
        </li>
      </ol>

      <hr className="border-[var(--border-subtle)] -mx-6" />

      {/* Desglose: automáticos (prosa fija) + temas editables in situ. Línea
          parcial entre cada punto del desarrollo. */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {autoItems.map((it, i) => (
          <div key={i} className="py-3 first:pt-0">
            <p>
              <span className="font-medium">{i + 1}.</span> {it.body}
            </p>
            {it.list && it.list.length > 0 && (
              <ul className="list-disc list-inside mt-1 ml-4 text-[var(--muted-foreground)]">
                {it.list.map((name, j) => (
                  <li key={j}>{name}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {draft.items.map((it, i) => (
          <div key={it.id} className="py-3 first:pt-0">
            <ItemRow item={it} number={autoItems.length + i + 1} />
          </div>
        ))}
      </div>

      <hr className="border-[var(--border-subtle)] -mx-6" />

      <div className="flex items-center justify-between gap-3">
        <CancelMeetingButton meetingId={draft.id} termino={TERMINO[acta.type]} />
        <FinishMeetingButton meetingId={draft.id} termino={TERMINO[acta.type]} />
      </div>
    </article>
  );
}

function FinishMeetingButton({
  meetingId,
  termino,
}: {
  meetingId: string;
  termino: string;
}) {
  const [pending, start] = useTransition();
  const [armed, setArmed] = useState(false);

  function click() {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 3000);
      return;
    }
    start(async () => {
      const fd = new FormData();
      fd.set("meetingId", meetingId);
      await finishMeeting(fd);
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={click}
      className={`btn text-sm inline-flex items-center gap-2 ${
        armed ? "btn-destructive" : "btn-primary"
      }`}
    >
      {pending && <SavingSpinner />}
      {armed ? "Confirmar: queda como acta" : `Terminar ${termino}`}
    </button>
  );
}

function CancelMeetingButton({
  meetingId,
  termino,
}: {
  meetingId: string;
  termino: string;
}) {
  const [pending, start] = useTransition();
  return (
    <ConfirmButton
      pending={pending}
      confirmLabel={`¿Cancelar ${termino}?`}
      onConfirm={() =>
        start(async () => {
          const fd = new FormData();
          fd.set("meetingId", meetingId);
          await cancelMeeting(fd);
        })
      }
    >
      Cancelar {termino}
    </ConfirmButton>
  );
}

function AddItemForm({ meetingId }: { meetingId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        className="text-[var(--primary)] hover:underline"
        onClick={() => setOpen(true)}
      >
        + Agregar tema
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          setError(null);
          const res = await addItem(fd);
          if (res?.error) setError(res.error);
          else {
            formRef.current?.reset();
            setOpen(false);
          }
        })
      }
      className="space-y-2 rounded-md border border-[var(--border-subtle)] p-3 mt-2 not-italic"
    >
      <input type="hidden" name="meetingId" value={meetingId} />
      <input
        name="title"
        className="input w-full"
        placeholder="Tema a tratar"
        required
        autoFocus
      />
      <textarea
        name="body"
        className="input w-full min-h-[4rem]"
        placeholder="Desarrollo del tema"
      />
      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="btn btn-ghost text-sm"
          onClick={() => {
            setError(null);
            setOpen(false);
          }}
        >
          Cancelar
        </button>
        <button className="btn btn-secondary text-sm" disabled={pending}>
          {pending ? "Agregando…" : "Agregar tema"}
        </button>
      </div>
    </form>
  );
}

function ItemRow({ item, number }: { item: DraftItem; number: number }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (fd) => {
          await updateItem(fd);
          setEditing(false);
        }}
        className="space-y-2 rounded-md border border-[var(--border-subtle)] p-3"
      >
        <input type="hidden" name="id" value={item.id} />
        <input
          name="title"
          className="input w-full"
          defaultValue={item.title}
          required
        />
        <textarea
          name="body"
          className="input w-full min-h-[3rem]"
          defaultValue={item.body}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => setEditing(false)}
          >
            Cancelar
          </button>
          <SubmitWithSpinner className="btn btn-secondary text-sm">
            Guardar
          </SubmitWithSpinner>
        </div>
      </form>
    );
  }

  // Desglose del tema in situ: número + texto, con editar/borrar al pasar.
  return (
    <div className="group flex items-start justify-between gap-3">
      <p className="min-w-0">
        <span className="font-medium">{number}.</span>{" "}
        <span className="font-medium">{item.title}</span>
        {item.body && (
          <>
            {" — "}
            <span className="text-[var(--muted-foreground)]">{item.body}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          className="btn btn-ghost text-xs"
          onClick={() => setEditing(true)}
        >
          Editar
        </button>
        <form
          action={async (fd) => {
            await deleteItem(fd);
          }}
        >
          <input type="hidden" name="id" value={item.id} />
          <button className="btn btn-ghost text-xs text-[var(--destructive)]">
            Borrar
          </button>
        </form>
      </div>
    </div>
  );
}
