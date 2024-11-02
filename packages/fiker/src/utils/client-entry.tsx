import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

declare global {
  interface Window {
    __pagePath: string;
    App: React.FC<{}>;
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
    const App = await import(/* @vite-ignore */ appPath).then(
      (module) => module.default
    );

    const root = hydrateRoot(
      document.getElementById("root")!,
      <StrictMode>
        <App />
      </StrictMode>
    );

    const updatePage = async () => {
      const response = await fetch(`/ssr?url=${window.location.href}`);
      const path = await response.text();

      const App = await import(/* @vite-ignore */ path).then(
        (module) => module.default
      );

      root?.render(<App />);
    };

    window.addEventListener("popstate", async function (event) {
      await updatePage();
    });

    window.addEventListener("updatePage", async () => {
      await updatePage();
    });
  }

  return null;
}

hydrate();
