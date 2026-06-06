"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { signIn } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  totpRequired?: boolean;
} | null;

const ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "Datos inválidos.",
  invalid_credentials: "Email o contraseña incorrectos.",
  locked: "Cuenta bloqueada temporalmente por intentos fallidos. Probá en 15 minutos.",
  ip_rate_limited: "Demasiados intentos desde tu red. Esperá unos minutos.",
  totp_invalid: "Código 2FA inválido.",
  totp_required: "Ingresá tu código 2FA.",
};

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    totp: formData.get("totp") ?? "",
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      totp: parsed.data.totp ?? "",
      redirectTo: "/socio",
    });
  } catch (err) {
    if (err instanceof CredentialsSignin) {
      const code = err.code ?? "invalid_credentials";
      if (code === "totp_required") {
        return {
          totpRequired: true,
          error: ERROR_MESSAGES.totp_required,
        };
      }
      return {
        error: ERROR_MESSAGES[code] ?? "No se pudo iniciar sesión.",
        totpRequired: code === "totp_invalid" ? true : undefined,
      };
    }
    if (err instanceof AuthError) {
      return { error: "No se pudo iniciar sesión." };
    }
    throw err;
  }
  return null;
}
