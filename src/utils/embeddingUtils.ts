// import { v4 as uuidv4 } from "uuid";
import { v4 as uuidv4, v5 as uuidv5 } from "uuid";
import { embeddings } from "./embeddings";
import { qdrantClient } from "../config/qdrant";

const NAMESPACE = "5c0b59b2-dc3e-4d1f-9e71-1234567890ab";

export const generateQdrantId = (mongoId: string) => {
  return uuidv5(mongoId, NAMESPACE);
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
    };

    const qdrantId =  generateQdrantId(id);

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


// Task	title, description	Users search for tasks like "Fix login bug" or "Review PRs".
// Project	name, description, goals	Semantic search for projects like "Find AI research initiatives".
// Workspace	name, description	Rarely needed, but useful for large multi-workspace platforms.
// User	name, bio	Optional: If users search for teammates by expertise ("Find UX designers").
// Member/Role-Permissions	❌ Skip	No semantic value (IDs/roles are structured).

// 🧠 Architecture Overview
// Here’s what a typical architecture would look like:

// User Input (Query) → via UI (chatbox or input field)

// Embed the Query using OpenAI Embedding Model

// Search in Qdrant → Find relevant documents/entities (e.g., tasks, projects, comments)

// Build Context using LangChain (e.g., RetrievalQA, ConversationalRetrievalQA)

// Generate Answer → Use OpenAI (GPT-4) with LangChain to answer based on retrieved context

// Display Answer to user