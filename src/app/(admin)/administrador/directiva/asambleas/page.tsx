import { MeetingsPage } from "../juntas/meetings-page";

export const metadata = { title: "Asambleas (directiva)" };

export default function AsambleasPage() {
  return (
    <MeetingsPage
      type="ASAMBLEA"
      title="Asambleas"
      description="Registro de actas de asamblea general."
      emptyTitle="Todavía no hay asambleas"
      emptyDescription="Iniciá una asamblea para empezar a registrar el acta."
      icon={<AsambleaIcon />}
    />
  );
}

function AsambleaIcon() {
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
      <path d="M3 11l18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}
