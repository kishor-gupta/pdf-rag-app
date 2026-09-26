import fs from "fs/promises";
import ollama from "ollama";
import { PDFParse } from "pdf-parse";
import { getRecordByPDFId } from "./memoryStore.js"

const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "llama3.1";
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 200;
const TOP_K = 5;

async function rewriteQuery(question) {
  const response = await ollama.chat({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Rewrite the user's question as a clear English search query. Expand slang, typos, and abbreviations. Do not answer the question. Do not assume any document type. Return only the rewritten query.",
      },
      {
        role: "user",
        content: question,
      },
    ],
  });

  const rewritten = response.message?.content?.trim();
  return rewritten || question;
}

async function createEmbed(text) {
  return await ollama.embed({
    model: EMBED_MODEL,
    input: text,
  });
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

function chunkText(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const chunks = [];
  const step = CHUNK_SIZE - CHUNK_OVERLAP;

  for (let i = 0; i < cleaned.length; i += step) {
    chunks.push(cleaned.slice(i, i + CHUNK_SIZE));
    if (i + CHUNK_SIZE >= cleaned.length) break;
  }

  return chunks;
}

async function extractPdfText(filePath) {
  const data = await fs.readFile(filePath);
  const parser = new PDFParse({ data });

  try {
    const result = await parser.getText();
    return result.text?.trim() ?? "";
  } finally {
    await parser.destroy();
  }
}

export async function embedUploadedPdf(filePath, originalName, pdfId) {
  const text = await extractPdfText(filePath);

  if (!text) {
    console.log(`[embed] ${originalName}: text not found from PDF`);
    return [];
  }

  const parts = chunkText(text);
  const records = [];

  for (let i = 0; i < parts.length; i++) {
    const response = await createEmbed(parts[i]);
    const embedding = response.embeddings?.[0] ?? [];

    records.push({
      id: crypto.randomUUID(),
      pdfId,
      pdfName: originalName,
      chunkIndex: i,
      text: parts[i],
      embedding,
    });
  }

  return records;
}

export async function embedUserQuery(fileInfo, question) {
  const searchQuery = await rewriteQuery(question);
  console.log("[search] query:", question);
  console.log("[search] rewritten:", searchQuery);

  const emb = await createEmbed(searchQuery);
  const queryEmbedding = emb?.embeddings?.[0];
  const findMatchPdf = getRecordByPDFId(fileInfo);
  const pdfChunks = findMatchPdf.embedding ?? [];

  if (!queryEmbedding?.length || pdfChunks.length === 0) {
    console.log("[search] no chunks found", { fileInfo, chunks: pdfChunks.length });
    return [];
  }

  const matches = pdfChunks
    .map((chunk) => ({
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  console.log("[search] top matches:", matches.length);
  matches.forEach((match, index) => {
    console.log(
      `  ${index + 1}. score=${match.score.toFixed(4)} chunk=${match.chunkIndex} text=${match.text.slice(0, 80)}`
    );
  });

  return matches;
}
