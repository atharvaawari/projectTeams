import { z } from "zod";
import { workspaceIdSchema } from "./workspace.validation";


export const handleQuerySchema = z.object({
  query: z.string().trim().min(1, { message: "query cannot be empty" })
})

export const handleWorkspaceQuerySchema = z.object({
  query: z.string().trim().min(1, { message: "query cannot be empty" }),
  workspaceId: workspaceIdSchema
})
  