// Motivo de los avisos activos de una sección. El punto rojo del sidebar solo
// marca la sección; este recuadro, arriba del contenido de la página destino,
// explica por qué está encendido. Lleva el mismo indicador de atención que el
// sidebar, justificado a la derecha.
export function AvisoBanner({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;

  return (
    <div className="space-y-2">
      {messages.map((m) => (
        <div
          key={m}
          className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm"
          style={{
            borderColor: "color-mix(in oklab, var(--warning) 45%, transparent)",
            background: "color-mix(in oklab, var(--warning) 10%, transparent)",
          }}
        >
          <span className="min-w-0">{m}</span>
          <span
            aria-hidden
            className="inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full text-xs font-bold leading-none bg-[var(--destructive)] text-white shrink-0"
          >
            !
          </span>
        </div>
      ))}
    </div>
  );
}
