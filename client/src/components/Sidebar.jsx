import { useRef } from "react";
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Sidebar({ pdfs, activePdfId, uploading, onSelectPdf, onUpload }) {
  const inputRef = useRef(null);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        borderRight: { sm: "1px solid" },
        borderBottom: { xs: "1px solid", sm: "none" },
        borderColor: "divider",
        bgcolor: "background.paper",
        minHeight: 0,
        maxHeight: { xs: 220, sm: "none" },
      }}
    >
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Documents
        </Typography>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(event) => {
            onUpload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Button
          fullWidth
          variant="contained"
          disabled={uploading}
          startIcon={<CloudUploadRoundedIcon />}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Upload PDF"}
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.25 }}>
          PDFs are saved in the server uploads folder.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 1, pb: 2 }}>
        {pdfs.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 6, px: 2, textAlign: "center" }}>
            <DescriptionRoundedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
            <Typography variant="body2" color="text.secondary">
              No PDFs yet. Upload one to start chatting.
            </Typography>
          </Stack>
        ) : (
          <List disablePadding>
            {pdfs.map((pdf) => (
              <ListItemButton
                key={pdf.id}
                selected={pdf.id === activePdfId}
                onClick={() => onSelectPdf(pdf.id)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemText
                  primary={pdf.name}
                  secondary={formatSize(pdf.size)}
                  primaryTypographyProps={{ noWrap: true, fontWeight: 600, fontSize: 14 }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}

export default Sidebar;
