# Toly Private Prototype

This directory is the private side of the Toly website. It is intentionally not tracked by the public repository.

## Pages

- `index.html` - private prototype hub
- `tools.html` - future tools structure
- `games.html` - future games structure
- `studio.html` - general Axerith Studios description
- `news.html` - consumer-facing company news feed
- `admin.html` - browser-based writing and preview workspace
- `cli.html` - UI for local Python/Rust publishing backends

## Private Backends

Python backend:

```bash
python backend/python/toly_cli_server.py
```

Rust backend:

```bash
cd backend/rust
cargo run
```

Both backends expose:

```text
GET  /api/posts
POST /api/posts
```

The Python backend listens on `http://127.0.0.1:8787/api/posts`.
The Rust backend listens on `http://127.0.0.1:8788/api/posts`.

## Publishing Flow

Use `cli.html` to send updates to a running backend. Successful API publishes update:

```text
data/news.json
```

This is still private scaffolding. A real public one-click publisher should add authentication before it writes to public site data.
