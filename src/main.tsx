// main.tsx
import React from "react"
import ReactDOM from "react-dom/client"
import Providers from "./providers"
import App from "./App"
import "./index.css"

const rootElem = document.getElementById("root")!
ReactDOM.createRoot(rootElem).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
)
