import { Resend } from "resend";

let cached: Resend | null = null;

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY no está configurada");
  }
  if (!cached) cached = new Resend(apiKey);
  return cached;
}

export async function sendContactEmail(input: {
  message: string;
  contact: string;
}): Promise<void> {
  const client = getClient();
  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "consultas@clubcannabico.app";
  const toEmail = process.env.CONTACT_TO_EMAIL ?? "clubcannabicoapp@gmail.com";
  const safeMessage = escapeHtml(input.message);
  const safeContact = escapeHtml(input.contact);

  const html = `
    <p><strong>Nuevo mensaje desde el sitio</strong></p>
    <p><strong>Cómo contactar:</strong> ${safeContact}</p>
    <p><strong>Mensaje:</strong></p>
    <pre style="font-family: inherit; white-space: pre-wrap; margin: 0;">${safeMessage}</pre>
  `;

  const text = `Nuevo mensaje desde el sitio\n\nCómo contactar: ${input.contact}\n\nMensaje:\n${input.message}`;

  const result = await client.emails.send({
    from: fromEmail,
    to: [toEmail],
    subject: "Nuevo mensaje desde clubcannabico.app",
    text,
    html,
  });
  if (result.error) {
    throw new Error(`Resend rechazó el envío: ${result.error.message}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
