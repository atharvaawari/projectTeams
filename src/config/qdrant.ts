// db/qdrant.ts
import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "../config/app.config";

export const qdrantClient = new QdrantClient({
  url: config.QDRANT_URL || "http://localhost:6333",
  apiKey: config.QDRANT_API_KEY, // Optional (for cloud Qdrant)
});


//init Collection
export const initQdrantCollection = async (collectionName: string) => {
  try {
    const info = await qdrantClient.getCollections();
    const exists = info.collections.some((c) => c.name === collectionName);

    if (exists) {
      console.log(`Collection "${collectionName}" already exists.`);
      return;
    }

    console.log(`Creating collection: "${collectionName}"`);

    await qdrantClient.createCollection(collectionName, {
      vectors: {
        size: 1536,
        distance: "Cosine",
      },
      optimizers_config: {
        default_segment_number: 1,
      },
      use_string_id: true,
    } as any);

    console.log(`✅ Created collection: "${collectionName}"`);
  } catch (error) {
    console.error("Qdrant init error:", error);
    throw error;
  }
};

//reset collection
export const resetCollection = async (
  collectionName: string,
  vectorSize: number = 1536,
  distance: "Cosine" | "Dot" | "Euclidean" = "Cosine"
) => {
  try {
    const existing = await qdrantClient.getCollections();

    const alreadyExists = existing.collections.some(
      (c) => c.name === collectionName
    );

    if (alreadyExists) {
      console.log(`Deleting existing collection: ${collectionName}`);
      await qdrantClient.deleteCollection(collectionName);
    }

    console.log(`Creating collection: ${collectionName}`);
    await qdrantClient.createCollection(collectionName, {
      vectors: {
        size: vectorSize,
        distance: "Cosine",
      },
    });

    console.log(`✅ Collection ${collectionName} has been reset.`);
  } catch (error) {
    console.error(`❌ Failed to reset collection ${collectionName}:`, error);
  }
};

// Type guard for Qdrant conflict errors
function isQdrantConflictError(error: unknown): error is { status: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 409
  );
}

const setupCollections = async () => {
  const collections = ["workspaces", "projects", "tasks"];

  for (const collection of collections) {
    try {
      // 1. Try creating collection (may fail if exists)
      await qdrantClient.createCollection(collection, {
        vectors: { size: 1536, distance: "Cosine" },
      });
      console.log(`Created collection: ${collection}`);
    } catch (error) {
      if (isQdrantConflictError(error)) {
        console.log(`Collection already exists: ${collection}`);
      } else {
        throw error; // Re-throw unexpected errors
      }
    }

    try {
      // 2. Try creating index (idempotent operation)
      await qdrantClient.createPayloadIndex(collection, {
        field_name: "ownerId",
        field_schema: "keyword",
        wait: true,
      });
      console.log(`Ensured index exists for ownerId in ${collection}`);
    } catch (error) {
      console.error(`Failed creating index for ${collection}:`, error);
      throw error;
    }
  }
};
