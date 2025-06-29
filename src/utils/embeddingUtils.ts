import { v5 as uuidv5 } from "uuid";
import { embeddings } from "./embeddings";
import { qdrantClient } from "../config/qdrant";
import { config } from "../config/app.config";

export const generateQdrantId = (mongoId: string) => {
  return uuidv5(mongoId, config.UUIDNAMESPACE);
};

export const safeUpsertEmbedding = async (
  collection: string,
  id: string,
  text: string,
  metadata: Record<string, any>
) => {
  try {
    // 1. Generate embedding (failures possible here)
    // 2. Store in Qdrant (failures possible here)
    //change uuid4 to uuid5 then go for https://chatgpt.com/share/685c5d8b-06e8-8000-acd9-f3c27d86853b

    const vector = await embeddings.embedQuery(text);

    const payload = {
      ...metadata,
      ownerId: metadata.ownerId.toString(),
      mongoId: id,
      text: text.substring(0, 1000),
      timestamp: new Date().toISOString(),
    };

    const qdrantId = generateQdrantId(id);

    const addedEm = await qdrantClient.upsert(collection, {
      points: [
        {
          id: qdrantId,
          payload: payload,
          vector: vector,
        },
      ],
    });

    console.log("success adding embedding", addedEm);
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
  const qdrantId = generateQdrantId(mongoId);

  try {
    const deleteEm = await qdrantClient.delete(collection, {
      points: [qdrantId],
    });

    console.log("success delete embeddings", deleteEm);
  } catch (error) {
    console.error(
      `Embedding deletion failed for ${collection}/${mongoId}:`,
      error
    );
  }
};
