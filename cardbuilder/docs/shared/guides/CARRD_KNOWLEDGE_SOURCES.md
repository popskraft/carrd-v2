# Carrd Knowledge Sources

## Purpose

Document where to find Carrd documentation when you need it during workspace operations.

## When To Use

- before looking up a Carrd Builder feature, API, or UI behavior
- before inferring Carrd behavior from memory or first principles
- when the in-repo docs do not cover the needed detail

## Primary Source: Local RAG API

A local documentation search service is available at `/Users/popskraft/Projects/docs-rag-mvp`.

It indexes the official Carrd documentation and exposes a local HTTP API.

### Start the service

```bash
cd /Users/popskraft/Projects/docs-rag-mvp && pnpm run dev:local
```

The server starts at `http://127.0.0.1:8788`.

### Query the Carrd index

```bash
curl -s "http://127.0.0.1:8788/search?kb=carrd&q=your+question+here"
```

Or use the MCP WebFetch tool to fetch from `http://127.0.0.1:8788/search?kb=carrd&q=...` during a session.

### Index location

- `data/local-index/carrd.json` — the crawled Carrd documentation index.
- To rebuild: `pnpm run crawl:index:local:carrd` from the docs-rag-mvp root.

### Verify the service is running

```bash
curl -s "http://127.0.0.1:8788/health" 2>/dev/null && echo "running" || echo "not running"
```

## Secondary Source: In-Repo Builder Docs

For Builder-specific runtime behavior already verified in this repo, prefer in-repo docs over RAG:

- [CARRD_BROWSER_CONTROL_ARCHITECTURE.md](CARRD_BROWSER_CONTROL_ARCHITECTURE.md) — session bootstrap, CDP, verified stable APIs
- [CARRD_DETERMINISTIC_AUDIT.md](CARRD_DETERMINISTIC_AUDIT.md) — proven audit workflow
- [CARRD_PER_SITE_PROCESS.md](CARRD_PER_SITE_PROCESS.md) — multi-site process
- Per-site `data/snapshots/` — ground truth for the Builder state of each registered site

## Priority Order

1. In-repo scan artifacts and verified runtime docs (most specific to this Builder state).
2. Local RAG API at `http://127.0.0.1:8788?kb=carrd` (official docs).
3. Ask the operator.
