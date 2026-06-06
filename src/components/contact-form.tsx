"use client";

import { useState, type FormEvent } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ok" }
  | { kind: "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "submitting") return;
    setStatus({ kind: "submitting" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, contact }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus({ kind: "error", message: data.error ?? "No pudimos enviar el mensaje." });
        return;
      }
      setStatus({ kind: "ok" });
      setMessage("");
      setContact("");
    } catch {
      setStatus({ kind: "error", message: "Error de conexión. Probá de nuevo." });
    }
  }

  if (status.kind === "ok") {
    return (
      <div className="card text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed font-light">
        <p>Mensaje enviado. Te respondemos por el medio que indicaste.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate autoComplete="off">
      <div>
        <label htmlFor="contact-message" className="label">
          Mensaje
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={5}
          maxLength={2000}
          rows={5}
          className="input resize-y"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={status.kind === "submitting"}
        />
      </div>

      <div>
        <label htmlFor="contact-contact" className="label">
          Cómo te contactamos
        </label>
        <input
          id="contact-contact"
          name="contact"
          type="text"
          required
          minLength={3}
          maxLength={200}
          placeholder="Email, teléfono o lo que prefieras"
          className="input"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          disabled={status.kind === "submitting"}
        />
      </div>


      {status.kind === "error" && (
        <p className="text-sm text-[var(--destructive)]">{status.message}</p>
      )}

      <button
        type="submit"
        className="btn btn-primary px-7"
        disabled={status.kind === "submitting"}
      >
        {status.kind === "submitting" ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
