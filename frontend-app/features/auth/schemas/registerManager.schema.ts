import { z } from 'zod'

export const registerManagerSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("L'adresse email n'est pas valide"),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmation: z.string().min(1, 'La confirmation du mot de passe est requise'),
  agencyName: z.string().optional(),
  country: z.string().optional(),
}).refine((data) => data.password === data.confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmation'],
})

export type RegisterManagerFormData = z.infer<typeof registerManagerSchema>
