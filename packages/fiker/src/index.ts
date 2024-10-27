#!/usr/bin/env tsx
import Koa from "koa";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  build,
  createViteRuntime,
  createServer as createViteServer,
} from "vite";

import Router from "@koa/router";
import react from "@vitejs/plugin-react";
import * as fs from "fs";
import mount from "koa-mount";
import serve from "koa-static";
import { createRequire } from "module";
import type { PipeableStream } from "react-dom/server";
import { PassThrough } from "stream";
import { MarkdownContent } from "./utils/markdownContent.js";
import { createElement } from "react";
import matter from "gray-matter";
import Handlebars from "handlebars";

const req = createRequire(import.meta.url);
const koaConnect = req("koa-connect");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.join(__dirname, "__static__");

async function createServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
    plugins: [react()],
  });
  const runtime = await createViteRuntime(vite);
  const app = new Koa();
  app.use(koaConnect(vite.middlewares));
  app.use(mount("/__static__", serve(staticDir)));
  const basePath = path.join(process.cwd(), "src/app");
  const routesMap = buildRoutesMap(basePath);

  console.log(routesMap);

  const router = new Router();
  const root = process.cwd();
  const isProduction = process.env.NODE_ENV == "production";

  let template = isProduction
    ? await fs.promises.readFile(
        path.resolve(root, "dist/client/index.html"),
        "utf-8"
      )
    : fs.readFileSync(path.resolve(root, "index.html"), "utf-8");
  const ssrManifest = isProduction
    ? await fs.promises.readFile(
        "./dist/client/.vite/ssr-manifest.json",
        "utf-8"
      )
    : undefined;

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

      const { render } = isProduction
        ? await import(path.resolve(root, "dist/server/server-entry.mjs"))
        : ((await runtime.executeEntrypoint(
            path.resolve(root, "src/server-entry.tsx")
          )) as {
            render: (
              app: React.FC<{}>,
              path: string
            ) => Promise<PipeableStream>;
          });

      let App: React.FC;

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
        const { default: Page } = (await runtime.executeEntrypoint(
          pathName
        )) as {
          default: React.FC<{}>;
        };

        App = Page;
      }

      const appHtml = (await render(App, pathName)) as PipeableStream;

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

createServer();

function buildRoutesMap(dir: string, basePath = "") {
  const routesMap = new Map<string, string>();

  function traverse(currentDir: string, currentRoute: string) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const fileStat = fs.statSync(fullPath);

      if (fileStat.isDirectory()) {
        // Recurse into subdirectories
        traverse(fullPath, `${currentRoute}/${file}`);
      } else if (file.endsWith(".tsx") || file.endsWith(".mdx")) {
        // Determine route path
        const routePath =
          file === "page.tsx"
            ? currentRoute || "/"
            : `${currentRoute}/${file.replace(/\.(tsx|mdx)$/, "")}`;

        // Add route to the map
        routesMap.set(routePath, fullPath);
      }
    }
  }

  traverse(dir, basePath);
  return routesMap;
}
