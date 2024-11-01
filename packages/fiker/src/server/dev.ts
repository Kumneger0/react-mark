#!/usr/bin/env tsx
import Koa from "koa";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { createViteRuntime, createServer as createViteServer } from "vite";

import Router from "@koa/router";
import react from "@vitejs/plugin-react";
import * as fs from "fs";
import matter from "gray-matter";
import Handlebars from "handlebars";
import mount from "koa-mount";
import serve from "koa-static";
import { createRequire } from "module";
import type { PipeableStream } from "react-dom/server";
import { PassThrough } from "stream";
import { ViteRuntime } from "vite/runtime";
import { buildRoutesMap, ContextProvider } from "../utils/utils";
import { MarkdownContent } from "../utils/markdownContent";
import { RouterContext } from "../router";

const req = createRequire(import.meta.url);
const koaConnect = req("koa-connect");

export let viteRuntime: ViteRuntime;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.join(__dirname, "__static__");

const isProduction = process.env.NODE_ENV == "production";

const clientEntry = path.resolve(
  __dirname,
  `${isProduction ? "../utils/client-entry.js" : "../utils/client-entry.tsx"}`
);

export async function createServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
    plugins: [react()],
  });
  const viteRuntime = await createViteRuntime(vite);
  const app = new Koa();
  app.use(koaConnect(vite.middlewares));
  app.use(mount("/__static__", serve(staticDir)));
  const basePath = path.join(process.cwd(), "src/app");
  const routesMap = buildRoutesMap(basePath);

  const router = new Router();
  const root = process.cwd();

  let template = isProduction
    ? await fs.promises.readFile(
        path.resolve(root, "dist/client/index.html"),
        "utf-8"
      )
    : fs.readFileSync(path.resolve(root, "index.html"), "utf-8");

  const script = `<script type="module" src="${clientEntry}"></script>`;
  template = template.replace("</body>", `${script}\n</body>`);

  console.log("template after injectin client entry file", template);

  const ssrManifest = isProduction
    ? await fs.promises.readFile(
        path.resolve(root, "dist/client/.vite/ssr-manifest.json"),
        "utf-8"
      )
    : undefined;

  router.get("/ssr", async (ctx) => {
    const { url } = ctx.query;

    if (!url) {
      ctx.status = 400;
      ctx.body = { error: "URL parameter is required" };
      return;
    }
    const pathname = new URL(url as string).pathname;
    const pathName = routesMap.get(pathname);

    if (!pathName) {
      ctx.status = 404;
      ctx.body = "404";
      console.log("not found", pathName);
      return;
    }

    ctx.body = pathName;
    return;

    const { render } = isProduction
      ? await viteRuntime.executeEntrypoint(
          path.resolve(__dirname, "../utils/server-entry.mjs")
        )
      : ((await viteRuntime.executeEntrypoint(
          path.resolve(__dirname, "../utils/server-entry.tsx")
        )) as {
          render: (app: React.FC<{}>, path: string) => Promise<PipeableStream>;
        });
    const { default: Page } = (await viteRuntime.executeEntrypoint(
      pathName
    )) as {
      default: React.FC<{}>;
    };
    const App = ContextProvider({
      //TODO: fix later
      //@ts-expect-error
      contexts: [{ Context: RouterContext, value: null }],
      //@ts-expect-error
      children: Page,
    });

    const appHtml = await render(App, pathName);

    ctx.type = "text/html";
    const passThrough = new PassThrough();
    const [before, after] = template.split("<!--ssr-outlet-->");

    passThrough.write(before);

    const writable = new PassThrough({
      write(chunk, _encoding, callback) {
        passThrough.write(chunk);
        callback();
      },
      final(callback) {
        passThrough.write(after);
        passThrough.end();
        callback();
      },
    });

    appHtml.pipe(writable);
    ctx.body = passThrough;
  });

  router.get(/.*/, async (ctx) => {
    try {
      const url = ctx.req.url;

      if (!url) {
        throw Error("failed to determine the path you are looking for");
      }

      const pathName = routesMap.get(url);

      if (!pathName) {
        ctx.body = "404";
        return;
      }

      let App: React.FC;

      const { render } = isProduction
        ? await viteRuntime.executeEntrypoint(
            path.resolve(__dirname, "../utils/server-entry.mjs")
          )
        : ((await viteRuntime.executeEntrypoint(
            path.resolve(__dirname, "../utils/server-entry.tsx")
          )) as {
            render: (
              app: React.FC<{}>,
              path: string
            ) => Promise<PipeableStream>;
          });

      if (pathName.endsWith(".mdx")) {
        const mdxString = fs.readFileSync(pathName, "utf-8");
        const { content, data: frontMatter } = matter(mdxString);
        App = () => MarkdownContent({ markdown: content });

        const comipledTemplate = Handlebars.compile(template);

        template = comipledTemplate({
          title: frontMatter.title,
          description: frontMatter.description,
        });
      } else {
        const { default: Page } = (await viteRuntime.executeEntrypoint(
          pathName
        )) as {
          default: React.FC<{}>;
        };
        App = ContextProvider({
          //TODO: fix later
          //@ts-expect-error
          contexts: [{ Context: RouterContext, value: null }],
          //@ts-expect-error
          children: Page,
        });
      }

      const appHtml = await render(App, pathName);

      ctx.type = "text/html";
      const passThrough = new PassThrough();
      template = await vite.transformIndexHtml(url, template);

      const [before, after] = template.split("<!--ssr-outlet-->");

      passThrough.write(before);

      const writable = new PassThrough({
        write(chunk, _encoding, callback) {
          passThrough.write(chunk);
          callback();
        },
        final(callback) {
          passThrough.write(after);
          passThrough.end();
          callback();
        },
      });

      appHtml.pipe(writable);
      ctx.body = passThrough;
    } catch (error) {
      if (error instanceof Error) {
        vite.ssrFixStacktrace(error);
      }
      console.error("Error in SSR rendering:", error);
      ctx.status = 500;
      ctx.body = "Internal Server Error";
    }
  });

  app.use(router.routes()).use(router.allowedMethods());

  const port = 3000;
  const server = app.listen(port, () =>
    console.log(`Server running at http://localhost:${port}`)
  );
  server.on("error", (err) => {
    if (
      err &&
      typeof err == "object" &&
      "code" in err &&
      typeof err.code == "string" &&
      err.code === "EADDRINUSE"
    ) {
      console.log(`Port ${port} is in use, trying another port...`);
      server.close();
      app.listen(port + 1, () =>
        console.log(`Server running at http://localhost:${port + 1}`)
      );
    } else {
      console.error(err);
    }
  });
}
