import { AppBar, Toolbar, Typography } from "@mui/material";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";

function AppHeader() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "#0F172A",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Toolbar sx={{ gap: 1.5 }}>
        <PictureAsPdfRoundedIcon sx={{ color: "#5EEAD4" }} />
        <Typography variant="h6" sx={{ flex: 1, color: "white" }}>
          PDF RAG Chat
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default AppHeader;
