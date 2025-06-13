import OpenAI from 'openai';
import { config } from '../config/app.config';


const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});



export const processUserQuery = async(query: string) =>{
  const response = await openai.responses.create({
    model:'gpt-3.5-turbo',
    input: query
  });

  const data = response.output_text; 
  return { data };

}