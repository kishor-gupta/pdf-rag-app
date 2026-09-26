import { Box, Paper, Stack, Typography } from "@mui/material";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import MessageList from "./MessageList.jsx";
import ChatInput from "./ChatInput.jsx";

function ChatPanel({ activePdf, messages, sending, onSend }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 1.75,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="subtitle2">
          {activePdf ? activePdf.name : "No PDF selected"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Ask a question about the selected document
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: { xs: 2, md: 3 } }}>
        {messages.length === 0 ? (
          <Stack
            component={Paper}
            elevation={0}
            alignItems="center"
            spacing={1.25}
            sx={{
              maxWidth: 480,
              mx: "auto",
              mt: { xs: 6, md: 12 },
              p: 4,
              textAlign: "center",
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <ForumOutlinedIcon sx={{ fontSize: 40, color: "primary.main" }} />
            <Typography variant="h6">Start a PDF conversation</Typography>
            <Typography variant="body2" color="text.secondary">
              Choose a PDF on the left, then ask a question below.
            </Typography>
          </Stack>
        ) : (
          <MessageList messages={messages} sending={sending} />
        )}
      </Box>

      <ChatInput disabled={sending} onSend={onSend} />
    </Box>
  );
}

export default ChatPanel;
