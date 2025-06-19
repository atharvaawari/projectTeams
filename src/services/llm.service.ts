// import OpenAI from "openai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { config } from "../config/app.config";
import { NotFoundException } from "../utils/appError";

export const llm = new ChatOpenAI({
  openAIApiKey: config.OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo",
  temperature: 0.3,
});

export async function askAI(question: string): Promise<string> {
  const prompt = PromptTemplate.fromTemplate(`Answer this: ${question}`);
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  return chain.invoke({ question });
}




// export const openai = new OpenAI({
//   apiKey: config.OPENAI_API_KEY,
// });

// export const processUserQuery = async (query: string) => {
//   if (!query) {
//     throw new NotFoundException("Query not found!");
//   }

//   const response = await openai.responses.create({
//     model: "gpt-3.5-turbo",
//     input: query,
//   });

//   const data = response.output_text;
//   return { data };
// };
