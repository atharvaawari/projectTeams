import { ChatOpenAI } from "@langchain/openai";
import { NotFoundException } from "../utils/appError";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { searchVectorDB } from "../utils/vectorSearch";
import ChatModel from "../models/chat.model";
import { addMessageToChatService } from "./chat.service";

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

// Define types for the AI response
interface Source {
  id: string;
  text: string;
  score?: number;
}

interface AIResponse {
  content: string;
  role: string;
  sources: Source[];
}

export const getAiResponseService = async (
  query: string,
  chatId: string,
  userId: string,
  collection: string = "project_teams_embeddings"
): Promise<AIResponse> => {
  if (!query) throw new NotFoundException("Query not Found");
  if (!chatId) throw new NotFoundException("Chat ID not found");

  // 1. Save user message first
  await addMessageToChatService(chatId, userId, query, "user");

  //   //Update user message in chat
  //   const updatedChat = await ChatModel.findOneAndUpdate(
  //   { _id: chatId, user: userId }, // Ensure chat belongs to user
  //   {
  //     $push: {
  //       messages: {
  //         role: "user",
  //         content: query,
  //       }
  //     }
  //   },
  //   { new: true }
  // ).populate("project", "title");

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
    content: response.content.toString(),
    role: "assistance",
    sources: combinedResults.map((result) => ({
      id: result.payload?.mongoId,
      collection: result.payload?.collection,
      text: result.text,
      score: result.score,
    })),
  };

  // 3. Save assistant message
  await addMessageToChatService(
    chatId,
    userId,
    responseData.content,
    "assistant",
    responseData.sources.map(source => ({
      title: source.id,
      url: source.text,
      score: source.score
    }))
  );

  return responseData;
};
