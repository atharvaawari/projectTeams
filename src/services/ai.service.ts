import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { getRelevantContext } from "../utils/getRelevantContext";
import { NotFoundException } from "../utils/appError";
import { extractJsonFromText } from "../utils/extractJsonFromText";

// Define all possible query types
const QueryTypeSchema = z.enum([
  "PENDING_TASKS",
  "PROJECT_DETAILS",
  "TEAM_MEMBERS",
  "UPCOMING_DEADLINES",
  "GENERAL_HELP",
]);

const ResponseSchema = z.object({
  answer: z.string(),
  deeplink: z.string().optional(),
  queryType: QueryTypeSchema,
});

export const handleWorkspaceQueryService = async (
  query: string,
  userId: string,
  workspaceId: string
) => {
  //step 1: Classify query and fetch context
  //step 2: Generate structured prompt
  //step 3: Validate and return

  const context = await getRelevantContext(query, workspaceId);

  if (!context) throw new NotFoundException("User data context not found");

  const prompt = `
    You're an AI for a project management app. Respond to workspace queries.
    
    User Context:
    - Workspace ID: ${workspaceId}
    - Relevant Data: ${JSON.stringify(context, null, 2)}
    
    Query: "${query}"
    
    Respond with:
    1. Natural language answer
    2. Deeplink (if applicable)
    3. Query type (${QueryTypeSchema.options.join("|")})
    
    Example:

    {
      "answer": "Project 'Website Redesign' has 3 pending tasks",
      "deeplink": "/workspace/${workspaceId}/projects/proj123/tasks?status=TODO",
      "queryType": "PENDING_TASKS"
    }
  `;

  const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.3,
  });

  const rawResponse = await llm.invoke(prompt);
   const jsonString = extractJsonFromText(rawResponse.content.toString());

  return ResponseSchema.parse(JSON.parse(jsonString));
};