import { v4 as uuidv4 } from "uuid";
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
      mongoId: id,
      text: text.substring(0, 1000),
    };

    const qdrantId = uuidv4();

    await qdrantClient.upsert(collection, {
      points: [
        {
          id: qdrantId,
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
  }
};

export const safeDeleteEmbedding = async (
  collection: string,
  mongoId: string
) => {
  try {
    // Since UUIDv4 is not derived from mongoId, we need to delete by filter
    await qdrantClient.delete(collection, {
      filter: {
        must: [
          {
            key: "mongoId",
            match: {
              value: mongoId,
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error(
      `Embedding deletion failed for ${collection}/${mongoId}:`,
      error
    );
  }
};
