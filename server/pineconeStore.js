import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), ".env"),
});

const EMBED_DIMS = 768;

function getIndexName() {
  return process.env.PINECONE_INDEX || "pdf-rag";
}

let indexPromise;

function getClient() {
  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "PINECONE_API_KEY is missing. Add it to server/.env"
    );
  }

  return new Pinecone({ apiKey });
}

async function waitUntilReady(client, name) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const description = await client.describeIndex(name);
    if (description.status?.ready) return;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`Pinecone index "${name}" is not ready yet`);
}

export async function getPineconeIndex() {
  if (!indexPromise) {
    indexPromise = (async () => {
      const client = getClient();
      const name = getIndexName();
      const existing = await client.listIndexes();
      const found = existing.indexes?.some((item) => item.name === name);

      if (!found) {
        console.log(`[pinecone] creating index ${name} (768, cosine)`);
        await client.createIndex({
          name,
          dimension: EMBED_DIMS,
          metric: "cosine",
          spec: {
            serverless: {
              cloud: process.env.PINECONE_CLOUD || "aws",
              region: process.env.PINECONE_REGION || "us-east-1",
            },
          },
        });
      }

      await waitUntilReady(client, name);
      console.log(`[pinecone] using index ${name}`);
      return client.index(name);
    })();
  }

  return indexPromise;
}

function ns(index) {
  return typeof index.namespace === "function" ? index.namespace("") : index;
}

function toMatches(matches = []) {
  return matches
    .map((match) => ({
      chunkIndex: match.metadata?.chunkIndex ?? 0,
      text: match.metadata?.text ?? "",
      score: match.score ?? 0,
    }))
    .filter((match) => match.text);
}

export async function upsertChunks(records) {
  const index = ns(await getPineconeIndex());
  const vectors = records.map((record) => ({
    id: `${record.pdfId}-${record.chunkIndex}`,
    values: record.embedding,
    metadata: {
      pdfId: String(record.pdfId),
      pdfName: record.pdfName,
      chunkIndex: record.chunkIndex,
      text: record.text,
    },
  }));

  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    await index.upsert({ records: vectors.slice(i, i + batchSize) });
  }

  console.log(`[pinecone] upserted ${vectors.length} vector(s)`);
}

export async function queryChunks(pdfId, queryEmbedding, topK = 5) {
  if (!pdfId) {
    console.log("[pinecone] skip query: no pdfId");
    return [];
  }

  const index = ns(await getPineconeIndex());
  const pdfKey = String(pdfId);

  const filtered = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    filter: { pdfId: { $eq: pdfKey } },
  });

  const filteredMatches = toMatches(filtered.matches);
  if (filteredMatches.length) {
    console.log(`[pinecone] query hits=${filteredMatches.length} (filtered)`);
    return filteredMatches;
  }

  const unfiltered = await index.query({
    vector: queryEmbedding,
    topK: Math.max(topK * 4, 20),
    includeMetadata: true,
  });

  const scoped = (unfiltered.matches ?? [])
    .filter((match) => String(match.metadata?.pdfId ?? "") === pdfKey)
    .slice(0, topK);

  console.log(
    `[pinecone] query hits=${scoped.length} (fallback) raw=${unfiltered.matches?.length ?? 0}`
  );

  return toMatches(scoped);
}

export async function getPineconeSummary() {
  const index = await getPineconeIndex();
  const stats = await index.describeIndexStats();

  return {
    store: "pinecone",
    index: getIndexName(),
    vectorCount: stats.totalRecordCount ?? 0,
    dimension: stats.dimension ?? EMBED_DIMS,
  };
}
