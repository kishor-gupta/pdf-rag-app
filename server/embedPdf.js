import fs from "fs/promises";
import ollama from "ollama";
import { Document } from "@langchain/core/documents";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFParse } from "pdf-parse";
import { queryChunks, upsertChunks } from "./pineconeStore.js";

const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "llama3.1";
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 200;
const TOP_K = 5;

const embeddings = new OllamaEmbeddings({
  model: EMBED_MODEL,
  baseUrl: "http://127.0.0.1:11434",
});

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
});

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

async function loadPdfDocuments(filePath, originalName) {
  const data = await fs.readFile(filePath);
  const parser = new PDFParse({ data });

  try {
    const result = await parser.getText();
    if (result.pages?.length) {
      return result.pages
        .filter((page) => page.text?.trim())
        .map(
          (page) =>
            new Document({
              pageContent: page.text.trim(),
              metadata: { source: originalName, page: page.num },
            })
        );
    }

    if (result.text?.trim()) {
      return [
        new Document({
          pageContent: result.text.trim(),
          metadata: { source: originalName },
        }),
      ];
    }

    return [];
  } finally {
    await parser.destroy();
  }
}

export async function embedUploadedPdf(filePath, originalName, pdfId) {
  const docs = await loadPdfDocuments(filePath, originalName);

  if (!docs.length) {
    console.log(`[embed] ${originalName}: text not found from PDF`);
    return [];
  }

  const splits = await splitter.splitDocuments(docs);
  const texts = splits.map((doc) => doc.pageContent).filter(Boolean);

  console.log(`[embed] ${originalName}: ${texts.length} LangChain chunk(s)`);

  const vectors = await embeddings.embedDocuments(texts);

  const records = texts.map((text, i) => ({
    pdfId,
    pdfName: originalName,
    chunkIndex: i,
    text,
    embedding: vectors[i] ?? [],
  }));

  await upsertChunks(records);
  return records;
}

export async function embedUserQuery(fileInfo, question) {
  const searchQuery = await rewriteQuery(question);
  console.log("[search] query:", question);
  console.log("[search] rewritten:", searchQuery);

  const queryEmbedding = await embeddings.embedQuery(searchQuery);
  console.log(`[search] query embedding dims=${queryEmbedding?.length ?? 0}`);

  const matches = await queryChunks(fileInfo, queryEmbedding, TOP_K);

  if (!matches.length) {
    console.log("[search] no chunks found", { fileInfo });
    return [];
  }

  console.log("[search] top matches:", matches.length);
  matches.forEach((match, index) => {
    console.log(
      `  ${index + 1}. score=${match.score.toFixed(4)} chunk=${match.chunkIndex} text=${match.text.slice(0, 80)}`
    );
  });

  return matches;
}
