const API_BASE = "/api";

export async function sendChat({ question, pdfName }) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, pdfName }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Chat request failed");
  }
  return data;
}
