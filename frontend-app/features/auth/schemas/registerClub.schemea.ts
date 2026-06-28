import { z } from 'zod'

export const registerClubSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z
    .email("L'adresse email n'est pas valide")
    .min(1, "L'email est requis"),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(5, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmation: z.string().min(1, 'La confirmation du mot de passe est requise'),
  jobTitle: z.string().min(1, 'Le titre du poste est requis'),
  professionalContact: z.string().optional(),
}).refine((data) => data.password === data.confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmation'],
})

export type RegisterClubFormData = z.infer<typeof registerClubSchema>
