import express, { type Express } from "express";
import path from "path";

export function serveStatic(app: Express) {
  const clientDistPath = path.resolve(import.meta.dirname, "..", "dist", "client");
  app.use(express.static(clientDistPath));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(clientDistPath, "index.html"));
  });
}