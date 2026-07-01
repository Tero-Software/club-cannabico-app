import { MeetingsPage } from "./meetings-page";

export const metadata = { title: "Juntas (directiva)" };

export default function JuntasPage() {
  return (
    <MeetingsPage
      type="DIRECTIVA"
      title="Juntas"
      description="Registro de actas de junta de comisión directiva."
      emptyTitle="Todavía no hay juntas"
      emptyDescription="Iniciá una junta para empezar a registrar el acta. Las altas y bajas de socios del período se agregan solas."
      icon={<JuntaIcon />}
    />
  );
}

function JuntaIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 21h18" />
      <path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17" />
      <path d="M14 12h.01" />
    </svg>
  );
}
