import fs from "fs/promises";
import ollama from "ollama";
import { PDFParse } from "pdf-parse";

const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
const CHUNK_SIZE = 1500;

function chunkText(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const chunks = [];
  for (let i = 0; i < cleaned.length; i += CHUNK_SIZE) {
    chunks.push(cleaned.slice(i, i + CHUNK_SIZE));
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

export async function embedUploadedPdf(filePath, originalName) {
  const text = await extractPdfText(filePath);

  if (!text) {
    console.log(`[embed] ${originalName}: PDF se text nahi mila`);
    return;
  }

  const chunks = chunkText(text);
  console.log(
    `[embed] ${originalName}: ${chunks.length} chunk(s), model=${EMBED_MODEL}`
  );

  for (let i = 0; i < chunks.length; i++) {
    const response = await ollama.embed({
      model: EMBED_MODEL,
      input: chunks[i],
    });
    const embedding = response.embeddings?.[0];

    console.log(
      `[embed] ${originalName} chunk ${i + 1}/${chunks.length} (${embedding?.length ?? 0} dims)`
    );
    console.log(embedding);
  }
}
