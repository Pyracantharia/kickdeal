import { z } from 'zod'

export const registerManagerSchema = z.object({
  firstname: z.string().min(1, 'Le prénom est requis'),
  lastname: z.string().min(1, 'Le nom est requis'),
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("L'adresse email n'est pas valide"),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmation: z.string().min(1, 'La confirmation du mot de passe est requise'),
  agencyName: z.string().min(1, "Le nom de l'agence est requis"),
  country: z.string().min(1, 'Le pays est requis'),
  licenseNumber: z.string().min(1, 'Le numéro de licence est requis'),
  licenseDocument: z.any()
    .refine((file) => file instanceof File, 'Le document de licence est requis'),
}).refine((data) => data.password === data.confirmation, {
  message: 'Les mots de passe ne correspondent pas',
})

export type RegisterManagerFormData = z.infer<typeof registerManagerSchema>
