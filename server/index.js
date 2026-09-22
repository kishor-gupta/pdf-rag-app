import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "pdf-rag-server",
    message: "Backend is running. Wire RAG logic here later.",
  });
});

app.post("/api/chat", (req, res) => {
  const { question, pdfName } = req.body ?? {};

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({
      error: "question is required",
    });
  }

  res.json({
    answer:
      "Backend stub: aap ka question mil gaya. Yahan RAG pipeline (PDF parse → embed → retrieve → LLM) lagani hai.",
    question: question.trim(),
    pdfName: pdfName ?? null,
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
