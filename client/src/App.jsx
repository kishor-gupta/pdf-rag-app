import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import AppHeader from "./components/AppHeader.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import { sendChat } from "./api.js";

function App() {
  const [pdfs, setPdfs] = useState([]);
  const [activePdfId, setActivePdfId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  const activePdf = useMemo(
    () => pdfs.find((pdf) => pdf.id === activePdfId) ?? null,
    [pdfs, activePdfId]
  );


  const handleUpload = (file) => {
    if (!file) return;

    const next = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      addedAt: new Date().toISOString(),
    };

    setPdfs((current) => [next, ...current]);
    setActivePdfId(next.id);
  };

  const handleSend = async (question) => {
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: question,
    };

    setMessages((current) => [...current, userMessage]);
    setSending(true);

    try {
      const data = await sendChat({
        question,
        pdfName: activePdf?.name ?? null,
      });

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.answer,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: error.message || "Request failed. Check that the backend is running.",
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <AppHeader/>
      <Box
        sx={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "280px 1fr" },
          gridTemplateRows: { xs: "auto 1fr", sm: "1fr" },
          minHeight: 0,
        }}
      >
        <Sidebar
          pdfs={pdfs}
          activePdfId={activePdfId}
          onSelectPdf={setActivePdfId}
          onUpload={handleUpload}
        />
        <ChatPanel
          activePdf={activePdf}
          messages={messages}
          sending={sending}
          onSend={handleSend}
        />
      </Box>
    </Box>
  );
}

export default App;
