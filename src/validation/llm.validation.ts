import { z } from "zod";


export const handleQuerySchema = z.object({
  query: z.string().trim().min(1, { message: "query cannot be empty" })
})
  