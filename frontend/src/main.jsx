import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ProgramProvider } from "./context/ProgramContext";
import "./global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ProgramProvider>
        <App />
      </ProgramProvider>
    </BrowserRouter>
  </StrictMode>
);
