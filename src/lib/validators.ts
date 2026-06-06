import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase(),
  password: z.string().min(1, "Ingresá tu contraseña"),
  totp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Código de 6 dígitos")
    .optional()
    .or(z.literal("")),
});

const COMMON_PASSWORDS = new Set([
  "password", "password1", "contraseña", "123456789", "1234567890",
  "qwerty123", "admin1234", "socio1234", "clubcannabico", "clubcannabico1",
  "claveclave", "changeme1", "welcome123",
]);

export const passwordPolicy = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(200, "Contraseña demasiado larga")
  .refine((v) => /[a-z]/.test(v), "Debe incluir una minúscula")
  .refine((v) => /[A-Z]/.test(v), "Debe incluir una mayúscula")
  .refine((v) => /\d/.test(v), "Debe incluir un número")
  .refine(
    (v) => /[^a-zA-Z0-9]/.test(v),
    "Debe incluir un carácter especial (!@#$%...)",
  )
  .refine(
    (v) => !COMMON_PASSWORDS.has(v.toLowerCase()),
    "Contraseña demasiado común",
  );

export const PASSWORD_REQUIREMENTS =
  "Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.";

export const cambiarPasswordSchema = z
  .object({
    actual: z.string().min(1, "Ingresá tu contraseña actual"),
    nueva: passwordPolicy,
    confirmar: z.string(),
  })
  .refine((d) => d.nueva === d.confirmar, {
    message: "No coinciden",
    path: ["confirmar"],
  })
  .refine((d) => d.nueva !== d.actual, {
    message: "La nueva contraseña debe ser distinta",
    path: ["nueva"],
  });

export const retiroItemSchema = z.object({
  strainId: z.string().min(1),
  amount: z
    .number()
    .int()
    .min(10)
    .max(40)
    .refine((n) => n % 10 === 0, "La cantidad debe ser múltiplo de 10"),
});

export const retiroSchema = z.object({
  date: z.string().min(1, "Seleccioná una fecha"),
  timeSlot: z.string().min(1, "Seleccioná un horario"),
  items: z.array(retiroItemSchema).min(1, "Agregá al menos una variedad"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const postulacionSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre").max(80),
  email: z.string().email("Email inválido").toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(6, "Teléfono muy corto")
    .max(30),
  message: z.string().max(800).optional().or(z.literal("")),
});

export const editSocioSchema = z.object({
  name: z.string().trim().min(2, "Ingresá el nombre").max(80),
  email: z.string().email("Email inválido").toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(6, "Teléfono muy corto")
    .max(30)
    .optional()
    .or(z.literal("")),
});

export const createSocioSchema = z.object({
  name: z.string().trim().min(2, "Ingresá el nombre").max(80),
  email: z.string().email("Email inválido").toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(6, "Teléfono muy corto")
    .max(30)
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(1, "Ingresá una contraseña")
    .max(200, "Contraseña demasiado larga"),
  mustChangePassword: z.boolean().default(true),
  active: z.boolean().default(true),
});

export const geneticaSchema = z.object({
  name: z.string().min(2).max(80),
  bank: z.string().max(80).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  sourceUrl: z.url("URL inválida").optional().or(z.literal("")),
  photos: z.array(z.string().trim().min(1)).max(12).default([]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RetiroInput = z.infer<typeof retiroSchema>;
export type RetiroItemInput = z.infer<typeof retiroItemSchema>;
export type GeneticaInput = z.infer<typeof geneticaSchema>;
export type CreateSocioInput = z.infer<typeof createSocioSchema>;
export type EditSocioInput = z.infer<typeof editSocioSchema>;
export type PostulacionInput = z.infer<typeof postulacionSchema>;
