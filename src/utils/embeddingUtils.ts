// utils/embeddingUtils.ts
import { embeddings } from "./embeddings";
import { qdrantClient } from "../config/qdrant";


export const safeUpsertEmbedding = async (
  collection: string,
  id: string,
  text: string,
  metadata: Record<string, any>
) => {
  try {
    // 1. Generate embedding (failures possible here)
    // 2. Store in Qdrant (failures possible here)

    const vector = await embeddings.embedQuery(text);

    const payload = {
      ...metadata,
      ownerId: metadata?.ownerId?.toString(),
      text: text.substring(0, 1000),
    };

    console.log("Attempting upsert with:", {
     points: [{
          id: id,
          payload: payload,
          vector: vector.length,
        }]
    });

    await qdrantClient.upsert(collection, {
      points: [
        {
          id: id,
          payload: payload,
          vector: vector,
        },
      ],
    });
  } catch (error) {
    console.error(`Embedding failed for ${collection}/${id}:`, {
      error,
      text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
    });

    // Continue without throwing
  }
};

export const safeDeleteEmbedding = async (collection: string, id: string) => {
  try {
    await qdrantClient.delete(collection, {
      points: [id],
    });
  } catch (error) {
    console.error(`Embedding deletion failed for ${collection}/${id}:`, error);
  }
};
