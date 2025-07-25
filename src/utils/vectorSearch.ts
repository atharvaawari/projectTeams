import { qdrantClient } from "../config/qdrant";
import { embeddings } from "./embeddings";

export const searchVectorDB = async (
  query: string,
  collection: string,
  ownerId: string,
  limit: number = 7
) => {
  try {
    // Generate embedding for the query
    const queryVector = await embeddings.embedQuery(query);

    // Prepare the filter (if ownerId is provided)
    const filter = {
      must: [
        {
          key: "ownerId",
          match: {
            value: ownerId.toString(),
          },
        },
      ],
    };

    // Search Qdrant
    const results = await qdrantClient.search(collection, {
      vector: queryVector,
      limit,
      filter,
      with_payload: true,
      with_vector: false,
    });

    return results.map((result) => ({
      id: result.id,
      score: result.score,
      payload: result.payload,
      text: result.payload?.text || " no text context found",
    }));
  } catch (error) {
    console.error("Vector Search failed:", error);
    throw error;
  }
};
