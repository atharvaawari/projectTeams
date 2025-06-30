import { ChatOpenAI } from "@langchain/openai";
import { NotFoundException } from "../utils/appError";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { searchVectorDB } from "../utils/vectorSearch";

// Define types for better type safety
interface SearchResult {
  id: string;
  score: number;
  payload: {
    mongoId: string;
    collection: string;
    [key: string]: any;
  };
  text: string;
}

interface AIResponse {
  answer: string;
  sources: Array<{
    id: string;
    collection?: string;
    text: string;
    score: number;
  }>;
  suggestedActions?: string[];
}

// Define types for the AI response
interface AISource {
  id: string;
  collection?: string;
  text: string;
  score: number;
}

// interface AIResponse {
//   answer: string;
//   sources: AISource[];
// }

export const getAiResponseService = async (
  query: string,
  userId: string,
  collection: string = "project_teams_embeddings"
): Promise<AIResponse> => {
  if (!query) throw new NotFoundException("Query not Found");

  try {
    // Initialize LangChain's ChatOpenAI
    const model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo", 
      temperature: 0.7,
      maxTokens: 1024,
      maxRetries: 2,
    });

    // Search all relevant collections
    const results = (await searchVectorDB(
      query,
      collection,
      userId
    )) as SearchResult[];

    // Combine and sort results by score
    const combinedResults = results
      .flat()
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Take top 5 overall

    // Prepare context for LLM
    const context = combinedResults
      .map(
        (result) =>
          `From ${result.payload?.mongoId} (${result.score.toFixed(2)}): ${
            result.text
          }`
      )
      .join("\n\n");

    // Call LLM with the context using LangChain
    const response = await model.invoke([
      new SystemMessage(
        `You are a helpful project management assistant. Use the following context to answer the user's question. 
        If you don't know the answer, say so.
        
        Context:
        ${context}`
      ),
      new HumanMessage(query),
    ]);

    const responseData: AIResponse = {
      answer: response.content.toString(),
      sources: combinedResults.map((result) => ({
        id: result.payload?.mongoId,
        collection: result.payload?.collection,
        text: result.text,
        score: result.score,
      })),
    };

    return responseData;
  } catch (error) {
    console.error("AI response generation failed:", error);
    return {
      answer: "I'm having trouble accessing that information right now. Please try again later or be more specific with your request.",
      sources: [],
      suggestedActions: [
        "Try rephrasing your question",
        "Specify a time frame (e.g., 'this week')",
        "Mention specific projects or team members"
      ]
    };
  }
};
