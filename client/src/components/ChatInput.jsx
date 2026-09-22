import { useState } from "react";
import { Box, IconButton, InputBase, Paper } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

function ChatInput({ disabled, onSend }) {
  const [value, setValue] = useState("");

  const submit = () => {
    const question = value.trim();
    if (!question || disabled) return;
    onSend(question);
    setValue("");
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 }, pt: 0 }}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: 760,
          mx: "auto",
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          px: 1.5,
          py: 0.75,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <InputBase
          multiline
          maxRows={5}
          fullWidth
          disabled={disabled}
          placeholder="Ask something from the PDF…"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          sx={{ py: 1, fontSize: 15 }}
        />
        <IconButton
          color="primary"
          disabled={disabled || !value.trim()}
          onClick={submit}
          aria-label="Send message"
        >
          <SendRoundedIcon />
        </IconButton>
      </Paper>
    </Box>
  );
}

export default ChatInput;
