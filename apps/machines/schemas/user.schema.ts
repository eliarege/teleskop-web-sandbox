import { z } from 'zod'

export const userUpdateSchema = z.object({
  userId: z.number().positive(),
  userName: z.string().min(1).max(50),
  userSurname: z.string().min(1).max(50),
  userPass: z.string().min(4).max(9),
  userMode: z.string().max(250),
  userInfo: z.string().optional(),
  userActive: z.boolean(),
  userMode2: z.string(),
  userType: z.number(),
})

export type UserUpdate = z.infer<typeof userUpdateSchema>
