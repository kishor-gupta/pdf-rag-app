import { Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";

function MessageList({ messages, sending }) {
  return (
    <Stack spacing={1.5} sx={{ maxWidth: 760, mx: "auto" }}>
      {messages.map((message) => {
        const isUser = message.role === "user";

        return (
          <Box
            key={message.id}
            sx={{
              display: "flex",
              justifyContent: isUser ? "flex-end" : "flex-start",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 1.25,
                maxWidth: "80%",
                bgcolor: isUser
                  ? "primary.main"
                  : message.isError
                    ? "#FEF2F2"
                    : "background.paper",
                color: isUser ? "white" : message.isError ? "#B91C1C" : "text.primary",
                border: isUser ? "none" : "1px solid",
                borderColor: message.isError ? "#FECACA" : "divider",
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {message.text}
              </Typography>
            </Paper>
          </Box>
        );
      })}

      {sending && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            Thinking…
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}

export default MessageList;
