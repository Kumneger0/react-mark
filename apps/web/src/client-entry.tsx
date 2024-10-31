import { StrictMode } from "react";
import { hydrateRoot, Root } from "react-dom/client";

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    __pagePath: string;
    App: React.FC<{}>;
  }
}

export let root: Root;

async function hydrate() {
  if (typeof window !== "undefined") {
    const appPath = window.__pagePath;
    if (!appPath) {
      throw new Error(
        "failed to find the page you are looking for if this was mistake please open an issue in our github page"
      );
    }
    const App = await import(appPath).then((module) => module.default);
    root = hydrateRoot(
      document.getElementById("root")!,
      <StrictMode>
        <App />
      </StrictMode>
    );
    window.addEventListener("updatePage", () => {
      const App = window.App;
      updateContent(App);
    });
  }
}

hydrate();

const updateContent = (App: React.FC<{}>) => {
  root.render(<App />);
};
