import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("L'adresse email n'est pas valide"),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(5, 'Le mot de passe doit contenir au moins 6 caractères'),
  twoFactorCode: z.string().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
