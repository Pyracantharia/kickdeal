import { z } from 'zod'

export const registerClubSchema = z.object({
  firstname: z.string().min(1, 'Le prénom est requis'),
  lastname: z.string().min(1, 'Le nom est requis'),
  email: z
    .email("L'adresse email n'est pas valide")
    .min(1, "L'email est requis"),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmation: z.string().min(1, 'La confirmation du mot de passe est requise'),
  clubName: z.string().min(1, 'Le nom du club est requis'),
  clubCountry: z.string().min(1, 'Le pays du club est requis'),
  roleInCLub: z.string().min(1, 'Le rôle dans le club est requis'),
  clubPhoneNumber: z.string().min(1, 'Le numéro de téléphone du club est requis'),
}).refine((data) => data.password === data.confirmation, {
  message: 'Les mots de passe ne correspondent pas',
})

export type RegisterClubFormData = z.infer<typeof registerClubSchema>
