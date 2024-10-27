import * as React from "react";
import { hydrateRoot } from "react-dom/client";

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    __pagePath: string;
  }
}

async function hydrate() {
  if (typeof window !== "undefined") {
    const appPath = window.__pagePath;
    if (!appPath) {
      throw new Error(
        "failed to find the page you are looking for if this was mistake please open an issue in our github page"
      );
    }
    // const App = await import(appPath).then((module) => module.default);
    // hydrateRoot(document.getElementById("root")!, <App />);
  }
}

hydrate();
