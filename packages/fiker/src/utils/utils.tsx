import fs from "node:fs";
import path from "node:path";
import React from "react";

export function buildRoutesMap(dir: string, basePath = "") {
  const routesMap = new Map<string, string>();

  function traverse(currentDir: string, currentRoute: string) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const fileStat = fs.statSync(fullPath);

      if (fileStat.isDirectory()) {
        traverse(fullPath, `${currentRoute}/${file}`);
      } else if (file.endsWith(".tsx") || file.endsWith(".mdx")) {
        const routePath =
          file === "page.tsx"
            ? currentRoute || "/"
            : `${currentRoute}/${file.replace(/\.(tsx|mdx)$/, "")}`;

        routesMap.set(routePath, fullPath);
      }
    }
  }

  traverse(dir, basePath);
  return routesMap;
}

export const ContextProvider = <T,>({
  contexts,
  children,
}: {
  contexts: Array<{
    Context: React.Context<T>;
    value: T;
  }>;
  children: React.ReactNode;
}) => {
  const WrappedComponent = () => {
    return contexts.reduce((acc, { Context, value }) => {
      return <Context.Provider value={value}>{acc}</Context.Provider>;
    }, children);
  };

  return WrappedComponent;
};
