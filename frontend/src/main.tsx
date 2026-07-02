import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App as AntApp } from "antd";

import App from "./App";
import { AuthProvider } from "./auth";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ThemeProvider>
  </StrictMode>,
);
