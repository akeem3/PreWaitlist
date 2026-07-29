# Memsearch Setup Guide

## What it is

[memsearch](https://github.com/zilliztech/memsearch) is a semantic memory layer for AI coding agents (OpenCode, Claude Code, Codex CLI, OpenClaw). It captures conversations, indexes them into a vector database (Milvus), and lets the agent recall past decisions and context across sessions — without re-reading everything each time.

**Key properties:**

- Markdown files are the source of truth — human-readable, git-friendly, no lock-in
- Milvus is a rebuildable shadow index — delete it and re-index from the .md files
- ONNX embeddings run locally on CPU — no API key, no cost
- Auto-isolates per project — index multiple projects in the same Milvus without collisions

---

## Prerequisites

| Requirement              | Version tested | How to check       |
| ------------------------ | -------------- | ------------------ |
| Windows 10/11 with WSL 2 | WSL 2.7.11.0+  | `wsl --version`    |
| Docker Desktop           | 4.x+           | `docker --version` |
| Python 3.10+             | 3.12+          | `python --version` |
| pip                      | 24.x+          | `pip --version`    |

### Installing WSL 2 (if not already done)

```powershell
wsl --install -d Ubuntu
wsl --set-default-version 2
```

Restart after installation, then verify:

```powershell
wsl --version
```

Expected output shows WSL version, kernel version, WSLg version, etc.

---

## Step 1 — Install Docker Desktop

1. Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Download **Docker Desktop for Windows**
3. Run the installer — ensure **WSL 2 backend** is checked
4. Restart your computer
5. Launch Docker Desktop and wait for the engine to start (whale icon stops spinning)

Verify:

```powershell
docker --version
docker ps
```

---

## Step 2 — Install memsearch CLI

```powershell
pip install "memsearch[onnx]"
```

This installs:

- The `memsearch` CLI
- The ONNX runtime for local CPU embeddings (bge-m3 model, ~558 MB, downloaded on first use)

Verify:

```powershell
memsearch --help
```

### Optional: other embedding providers

```powershell
pip install "memsearch[openai]"      # uses OpenAI API key
pip install "memsearch[ollama]"      # fully local via Ollama
pip install "memsearch[all]"         # all providers
```

---

## Step 3 — Register the OpenCode plugin

Add the plugin entry to OpenCode's config file at `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["@zilliz/memsearch-opencode"]
}
```

This enables:

- Auto-capture: each conversation turn is summarized and saved to a daily `.md` file
- Semantic search: the agent can recall past decisions via `/memory-recall`
- Cold-start context: recent memories are injected into new sessions automatically

---

## Step 4 — Start Milvus (vector database)

Milvus Lite (the default) does not support Windows. Instead, run Milvus Server in Docker.

### 4a — Create a working directory

```powershell
mkdir C:\Users\<you>\milvus
cd C:\Users\<you>\milvus
```

### 4b — Download the docker-compose file

```powershell
Invoke-WebRequest https://github.com/milvus-io/milvus/releases/download/v2.5.1/milvus-standalone-docker-compose.yml -OutFile docker-compose.yml
```

### 4c — Start the containers

```powershell
docker compose up -d
```

This starts three containers:

- `milvus-etcd` — configuration store
- `milvus-minio` — object storage
- `milvus-standalone` — the vector database itself, listening on port 19530

### 4d — Verify

```powershell
docker ps
```

Expected output — all three `Up` and `(healthy)`:

```
CONTAINER ID   IMAGE                                      STATUS                    PORTS
xxx            milvusdb/milvus:v2.5.1                     Up 42 seconds (healthy)   0.0.0.0:19530->19530/tcp
xxx            quay.io/coreos/etcd:v3.5.14                Up 43 seconds (healthy)   2379-2380/tcp
xxx            minio/minio:RELEASE.2023-03-20T20-16-18Z   Up 43 seconds (healthy)   0.0.0.0:9000-9001->9000-9001/tcp
```

---

## Step 5 — Configure memsearch to use the Docker Milvus

```powershell
memsearch config set milvus.uri http://localhost:19530
memsearch config set embedding.provider onnx
```

This sets the persistent defaults so you don't need `--milvus-uri` and `--provider` flags every time.

---

## Step 6 — Create and index your project's memory folder

### 6a — Create `.memory/` in your project root

```
your-project/
├── .memory/
│   └── MEMORY.md        # decisions, setup status, architecture rationale
│   └── YYYY-MM-DD.md    # daily session logs (created automatically by the plugin)
```

Seed `MEMORY.md` with at least:

```markdown
# Project Memory — Durable Decisions

## Tech Stack

- **Framework:** Next.js 16
- **Database:** Supabase (Postgres)
- **AI agent:** OpenCode
```

### 6b — Index

```powershell
memsearch index "C:\path\to\your-project\.memory"
```

Output should look like:

```
Indexed N chunks.
```

---

## Step 7 — Verify it works

### Search for something

```powershell
memsearch search "what stack are we using"
```

You should see the chunks from your MEMORY.md returned.

### Let the plugin auto-capture

Chat in OpenCode as usual. After a few turns, check that daily logs are being written:

```powershell
dir C:\path\to\your-project\.memory\
```

You should see a `YYYY-MM-DD.md` file.

### Cold-start retrieval

On your next OpenCode session, the agent should have context from previous sessions without being told.

---

## Per-Project Isolation

memsearch automatically isolates projects from each other. When indexing, it derives a unique collection name from the project's absolute path (e.g., `ms_opencode_myproject`). This means:

- **Index Project A** → stored in collection `ms_opencode_project_a`
- **Index Project B** → stored in collection `ms_opencode_project_b`
- **No collision** — same Milvus, separate collections

### If using the CLI directly (without the plugin)

The CLI defaults to the `memsearch_chunks` collection. For a second project, specify a unique collection name:

```powershell
memsearch index --collection my_second_project "C:\path\to\other-project\.memory"
```

And when searching:

```powershell
memsearch search --collection my_second_project "query"
```

### If using the OpenCode plugin

Per-project isolation is automatic — the plugin derives the collection name from the project path. No extra configuration needed.

---

## Starting fresh on a new project (quick checklist)

```
1. Install Docker Desktop          [skip if already done]
2. Start Milvus containers         [skip if already running]
3. pip install "memsearch[onnx]"   [skip if already installed]
4. Create .memory/MEMORY.md        [per project]
5. memsearch index "path\.memory"  [per project]
```

Green items are done once, shared across all projects. Blue items are per project.

---

## Troubleshooting

### Milvus container exits immediately

**Error:** `exec standalone failed: No such file or directory`

**Cause:** Running `docker run milvusdb/milvus standalone` passes `standalone` as a shell command, but the correct command inside the container is `milvus run standalone`. Use docker-compose instead:

```powershell
docker rm milvus
Invoke-WebRequest https://github.com/milvus-io/milvus/releases/download/v2.5.1/milvus-standalone-docker-compose.yml -OutFile docker-compose.yml
docker compose up -d
```

### Docker volumes "Access is denied"

**Error:** `mkdir C:\WINDOWS\system32\volumes: Access is denied.`

**Cause:** The docker-compose file was placed in a protected system directory. Move it to a user folder:

```powershell
mkdir C:\Users\<you>\milvus
cd C:\Users\<you>\milvus
# re-download and run docker compose up -d here
```

### "memsearch is not recognized"

The CLI isn't in your PATH. Either:

- Re-run from the Python Scripts folder, or
- Use `python -m memsearch` instead, or
- Add `C:\Users\<you>\AppData\Local\Programs\Python\Python312\Scripts` to your PATH

### Memory not being recalled across sessions

1. Verify Milvus is running: `docker ps` (check milvus-standalone is Up)
2. Re-index: `memsearch index "path\.memory"`
3. Check the collection has data: `memsearch stats`
4. Ensure `.memory/` exists in your project root (the plugin looks for it relative to the project)
