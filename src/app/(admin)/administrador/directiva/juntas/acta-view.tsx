import type { Acta } from "./acta";

// Fecha en letras, fiel al acta impresa: "lunes 15 de mayo de 2023".
export function fechaLarga(date: Date): string {
  return new Intl.DateTimeFormat("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Lista de presentes en prosa: "A y B" o "A, B y C".
export function presentes(nombres: string[]): string {
  if (nombres.length === 0) return "los miembros de la Comisión Directiva";
  if (nombres.length === 1) return nombres[0];
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

// Título del acta según tipo. "Junta de Comisión Directiva Nº N" /
// "Asamblea General Ordinaria Nº N".
export function tituloActa(acta: Acta): string {
  return acta.type === "ASAMBLEA"
    ? `Asamblea General Ordinaria Nº ${acta.number}`
    : `Junta de Comisión Directiva Nº ${acta.number}`;
}

// Párrafo de apertura del acta, distinto por tipo (la asamblea cita convocatoria
// y quórum; la junta abre directo con los presentes).
export function Encabezado({ acta }: { acta: Acta }) {
  if (acta.type === "ASAMBLEA") {
    return (
      <p>
        En {acta.city || "—"}, el día {fechaLarga(acta.date)}, se reúne la
        Asamblea General Ordinaria de{" "}
        <span className="font-semibold">{acta.clubName}</span>. Cursada la
        convocatoria a los socios conforme al Artículo 12 del estatuto y
        constatado el quórum conforme al Artículo 13, se declara abierta la
        sesión para tratar el orden del día:
      </p>
    );
  }
  return (
    <p>
      En {acta.city || "—"}, el día {fechaLarga(acta.date)}, se reúne la Comisión
      Directiva de <span className="font-semibold">{acta.clubName}</span>,
      encontrándose presentes: {presentes(acta.attendees)}, a fin de tratar el
      siguiente orden del día:
    </p>
  );
}

// Render del acta tal como se va a imprimir: encabezado en prosa, orden del día
// numerado, desglose punto por punto y cierre. La misma vista sirve para una
// junta en curso (se va completando) y una cerrada.
export function ActaView({ acta }: { acta: Acta }) {
  return (
    <div className="space-y-5 text-sm leading-relaxed">
      <Encabezado acta={acta} />

      <ol className="list-decimal list-inside space-y-1">
        {acta.items.map((it, i) => (
          <li key={i}>{it.title}</li>
        ))}
      </ol>

      <div className="space-y-4">
        {acta.items.map((it, i) => (
          <div key={i}>
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
      </div>

      <p>{acta.closing}</p>
    </div>
  );
}
