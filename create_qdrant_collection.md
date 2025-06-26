# Create collection

### create collections for models

``` 
initQdrantCollection("task_embeddings");
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
```

### add indexing for Index for mongoId
```
 await qdrantClient.createPayloadIndex("task_embeddings", {
field_name: "mongoId",
field_schema: "keyword",
});
```

### Reset collection
``` 
await resetCollection('workspace_embeddings', 1536, 'Cosine');
```