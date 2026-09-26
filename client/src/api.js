const API_BASE = "/api";

async function readError(response, fallback) {
  const data = await response.json().catch(() => ({}));
  throw new Error(data.error || fallback);
}

export async function getFiles() {
  const response = await fetch(`${API_BASE}/files`);
  if (!response.ok) {
    await readError(response, "Could not load files");
  }
  return response.json();
}

export async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    await readError(response, "Upload failed");
  }

  return response.json();
}

export async function sendChat({ question, pdfId }) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, pdfId }),
  });

  if (!response.ok) {
    await readError(response, "Chat request failed");
  }

  return response.json();
}
