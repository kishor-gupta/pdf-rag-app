import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express from "express";
import multer from "multer";
import { embedUploadedPdf } from "./embedPdf.js";

const app = express();
const PORT = process.env.PORT || 5050;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const id = randomUUID();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${id}__${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      cb(new Error("Only PDF files are allowed"));
      return;
    }

    cb(null, true);
  },
});

function fileFromDisk(filename) {
  const [id, ...rest] = filename.split("__");
  const name = rest.join("__") || filename;
  const stat = fs.statSync(path.join(UPLOAD_DIR, filename));

  return {
    id,
    name,
    size: stat.size,
    storedName: filename,
    addedAt: stat.mtime.toISOString(),
  };
}

function listUploadedFiles() {
  return fs
    .readdirSync(UPLOAD_DIR)
    .filter((filename) => filename.toLowerCase().endsWith(".pdf"))
    .map(fileFromDisk)
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
}

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "pdf-rag-server",
    message: "Backend is running. Wire RAG logic here later.",
  });
});

app.get("/api/files", (_req, res) => {
  res.json({ files: listUploadedFiles() });
});

app.post("/api/upload", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    const uploaded = fileFromDisk(req.file.filename);

    try {
      await embedUploadedPdf(req.file.path, uploaded.name);
    } catch (error) {
      console.error(`[embed] ${uploaded.name} failed:`, error.message);
    }

    res.json(uploaded);
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
