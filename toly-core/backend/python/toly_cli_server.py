#!/usr/bin/env python3
"""Minimal private API for publishing Toly company news.

Run from the private directory:
  python backend/python/toly_cli_server.py

Endpoints:
  GET  /api/posts
  POST /api/posts
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT / "data" / "news.json"
HOST = "127.0.0.1"
PORT = 8787


def slugify(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.lower().strip())
    return value.strip("-") or "update"


def load_posts() -> list[dict[str, Any]]:
    if not DATA_FILE.exists():
        return []
    with DATA_FILE.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        raise ValueError("data/news.json must contain a JSON array.")
    return data


def save_posts(posts: list[dict[str, Any]]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with DATA_FILE.open("w", encoding="utf-8") as handle:
        json.dump(posts, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def build_post(payload: dict[str, Any]) -> dict[str, str]:
    title = str(payload.get("title", "")).strip()
    summary = str(payload.get("summary", "")).strip()
    category = str(payload.get("category", "company")).strip()
    body = str(payload.get("body", "")).strip()
    date = str(payload.get("date") or datetime.now(timezone.utc).strftime("%Y-%m-%d")).strip()

    if not title or not summary:
        raise ValueError("title and summary are required.")
    if category not in {"company", "tools", "games", "studio"}:
        raise ValueError("category must be company, tools, games, or studio.")
    datetime.strptime(date, "%Y-%m-%d")

    return {
        "id": f"{date}-{slugify(title)}",
        "date": date,
        "category": category,
        "title": title,
        "summary": summary,
        "body": body,
    }


class Handler(BaseHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def send_json(self, status: int, payload: Any) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path != "/api/posts":
            self.send_json(404, {"error": "not found"})
            return
        self.send_json(200, load_posts())

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/api/posts":
            self.send_json(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            post = build_post(payload)
            posts = [item for item in load_posts() if item.get("id") != post["id"]]
            posts = sorted([post, *posts], key=lambda item: item.get("date", ""), reverse=True)
            save_posts(posts)
            self.send_json(201, {"post": post, "count": len(posts)})
        except Exception as exc:
            self.send_json(400, {"error": str(exc)})


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Toly private API listening on http://{HOST}:{PORT}")
    server.serve_forever()
