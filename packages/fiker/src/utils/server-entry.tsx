import React, { StrictMode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { RouterContext } from "../router";

export async function render(App: React.FC<{}>, __pagePath: string) {
  const html = renderToPipeableStream(
    <StrictMode>
      <App />
    </StrictMode>,
    {
      bootstrapScriptContent: `
     window.__pagePath = "${__pagePath}"
   `,
    }
  );
  return html;
}
