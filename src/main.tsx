import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./lib/theme";
import { TouchFeedbackProvider } from "./lib/haptics";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/app.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <TouchFeedbackProvider>
        <App />
      </TouchFeedbackProvider>
    </ThemeProvider>
  </StrictMode>,
);
