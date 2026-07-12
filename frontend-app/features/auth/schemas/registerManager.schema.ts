import { z } from 'zod'
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '@/features/account/passwordPolicy'

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
    .refine(isStrongPassword, PASSWORD_POLICY_MESSAGE),
  confirmation: z.string().min(1, 'La confirmation du mot de passe est requise'),
  agencyName: z.string().optional(),
  country: z.string().optional(),
  termsAccepted: z.boolean().refine((value) => value, {
    message: 'Vous devez accepter les CGU et la Politique de Confidentialité pour créer un compte',
  }),
}).refine((data) => data.password === data.confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmation'],
})

export type RegisterManagerFormData = z.infer<typeof registerManagerSchema>
