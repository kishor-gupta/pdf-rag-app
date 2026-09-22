# PDF RAG Chat

Base React + MUI UI and Express backend. RAG logic is left for you to add step by step.

## Run

```bash
npm install
npm run install:all
npm run dev
```

- UI: http://localhost:5173
- API: http://localhost:5050

## Routes

- `GET /api/health` — backend status
- `POST /api/chat` — `{ question, pdfName }` → stub `{ answer }`
