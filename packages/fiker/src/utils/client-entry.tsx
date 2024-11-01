import { StrictMode, useContext, useEffect, useRef } from "react";
import { createRoot, hydrateRoot, Root } from "react-dom/client";
import { RouterContext } from "../router";

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

    const AppWrapper = () => {
      const rootRef = useRef<Root>();

      useEffect(() => {
        const abortController = new AbortController();

        const updatePage = async () => {
          const response = await fetch(`/ssr?url=${window.location.href}`);
          const path = await response.text();

          const App = await import(/* @vite-ignore */ path).then(
            (module) => module.default
          );

          rootRef.current?.render(<App />);
        };

        window.addEventListener(
          "updatePage",
          async () => {
            await updatePage();
          },

          { signal: abortController.signal }
        );

        window.addEventListener("popstate", async function (event) {
          console.log("Back button clicked or navigation detected.");
          await updatePage();
        });

        return () => {
          abortController.abort();
        };
      }, []);

      if (!rootRef.current) {
        rootRef.current = hydrateRoot(
          document.getElementById("root")!,
          <StrictMode>
            {RouterContext && (
              <RouterContext.Provider value={{ root: rootRef.current }}>
                <App />
              </RouterContext.Provider>
            )}
          </StrictMode>
        );
      }

      return null;
    };

    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <AppWrapper />
      </StrictMode>
    );
  }
}

hydrate();

const updateContent = (App: React.FC<{}>) => {
  const value = useContext(RouterContext!);
  console.log("root", value.root);
};
