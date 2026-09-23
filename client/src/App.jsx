import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Snackbar } from "@mui/material";
import AppHeader from "./components/AppHeader.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import { getFiles, sendChat, uploadFile } from "./api.js";

function App() {
  const [pdfs, setPdfs] = useState([]);
  const [activePdfId, setActivePdfId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);

  const activePdf = useMemo(
    () => pdfs.find((pdf) => pdf.id === activePdfId) ?? null,
    [pdfs, activePdfId]
  );

  useEffect(() => {
    let cancelled = false;

    getFiles()
      .then(({ files }) => {
        if (cancelled) return;
        setPdfs(files);
        setActivePdfId((current) => current ?? files[0]?.id ?? null);
      })
      .catch((error) => {
        if (!cancelled) {
          setToast({ severity: "error", message: error.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      setPdfs((current) => [uploaded, ...current.filter((pdf) => pdf.id !== uploaded.id)]);
      setActivePdfId(uploaded.id);
      setToast({ severity: "success", message: `${uploaded.name} uploaded` });
    } catch (error) {
      setToast({
        severity: "error",
        message: error.message || "Upload failed",
      });
    } finally {
      setUploading(false);
    }
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
      <AppHeader />
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
          uploading={uploading}
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
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert
            onClose={() => setToast(null)}
            severity={toast.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {toast.message}
          </Alert>
        ) : null}
      </Snackbar>
    </Box>
  );
}

export default App;
