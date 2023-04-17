import { z } from "zod";

export const UserSchema = z.object({
  Id: z.number(),
  AccountID: z.number().optional(),
  FirstName: z.string(),
  LastName: z.string(),
  IsEmployee: z.boolean(),
  GroupId: z.number().optional(),
})

export type UserPartial = z.infer<typeof UserSchema>;

export const UserTransformer = UserSchema.transform((data) => {
  return {
    id: data.Id,
    accountID: data.AccountID,
    firstName: data.FirstName,
    lastName: data.LastName,
    isEmployee: data.IsEmployee,
    groupID: data.GroupId,
  }
})

export type User = z.infer<typeof UserTransformer>;