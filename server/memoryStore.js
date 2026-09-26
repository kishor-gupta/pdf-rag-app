const chunks = [];

export function addChunks(nextChunks) {
  chunks.push(...nextChunks);
  return chunks.length;
}

export function listChunks() {
  return chunks;
}

export function getStoreSummary() {
  return {
    count: chunks.length,
    chunks: chunks.map((chunk) => ({
      id: chunk.id,
      pdfId: chunk.pdfId,
      pdfName: chunk.pdfName,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      dims: chunk.embedding.length,
      embedding: chunk.embedding,
    })),
  };
}

export function getRecordByPDFId(pdfId) {
  const records = chunks.filter((d) => d.pdfId == pdfId);
  return {
    pdfId,
    embedding: records.map((chunk) => ({
      embedding: chunk.embedding,
      text: chunk.text,
      chunkIndex: chunk.chunkIndex,
    })),
  };
}
