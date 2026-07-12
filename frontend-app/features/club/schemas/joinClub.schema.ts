import { z } from 'zod'

export const joinClubSchema = z.object({
  invitationCode: z
    .string()
    .min(1, "Le code d'invitation est requis"),
})

export type JoinClubFormData = z.infer<typeof joinClubSchema>