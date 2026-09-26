import ollama from "ollama";

const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "llama3.1";

export async function answerWithOllama(question, matches) {
  const context = matches
    .map((match, index) => `[Chunk ${index + 1}]\n${match.text}`)
    .join("\n\n");

  console.log(`[llm] generating answer with ${CHAT_MODEL}`);

  const response = await ollama.chat({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Answer using only the provided context. The question may be informal. If the context does not contain the answer, say you do not know. Do not invent facts. Keep the answer short.",
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  const answer = response.message?.content?.trim() ?? "";
  console.log(`[llm] answer: ${answer.slice(0, 120)}`);
  return answer;
}
