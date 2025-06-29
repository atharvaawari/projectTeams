import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { NotFoundException } from "../utils/appError";
import OpenAI from "openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { searchVectorDB } from "../utils/vectorSearch";

// Define types for better type safety
interface SearchResult {
  id: string;
  score: number;
  payload: {
    mongoId: string;
    collection?: string;
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
}

export const getAiResponseService = async (
  query: string,
  userId: string,
  collections: string[] = ["workspace_embeddings", "project_embeddings", "task_embeddings", "member_embeddings"]
) => {
  if (!query) throw new NotFoundException("Query not Found");

  try {
    // Initialize LangChain's ChatOpenAI
    const model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo", // or "gpt-4" if available
      temperature: 0.7,
      maxRetries: 3,
    });

    // Search all relevant collections
    const searchPromises = collections.map((collection) =>
      searchVectorDB(query, collection, userId)
    );

    const allResults = await Promise.all(searchPromises);

    // Combine and sort results by score
    const combinedResults = allResults
      .flat()
      .sort((a , b) => b.score - a.score)
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

      console.log("context", context );

    // // Call LLM with the context using LangChain
    // const response = await model.invoke([
    //   new SystemMessage(
    //     `You are a helpful project management assistant. Use the following context to answer the user's question. 
    //     If you don't know the answer, say so.
        
    //     Context:
    //     ${context}`
    //   ),
    //   new HumanMessage(query),
    // ]);

    // return {
    //   answer: response.content.toString() || "I couldn't generate a response.",
    //   sources: combinedResults.map((result) => ({
    //     id: result.payload?.mongoId,
    //     collection: collections.find(
    //       (collection) => result.payload?.collection === collection
    //     ),
    //     text: result.text,
    //     score: result.score,
    //   })),
    // };
  } catch (error) {
    console.error("AI response generation failed:", error);
  }
};
