# 🐳 Docker 3-Tier Application
**FiftyFive Technologies — DevOps Intern Assessment**

---

## 1. Setup Instructions

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd docker-3tier

# 2. Create your .env from the example
cp .env.example .env
# Edit .env and set secure passwords

# 3. Build and start everything — single command
docker compose up --build
```

Once running, open **http://localhost** in your browser.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        app_network                          │
│                                                             │
│  ┌──────────────┐   /api/*   ┌──────────────┐             │
│  │   Browser    │ ─────────► │  Nginx :80   │ (Frontend)  │
│  └──────────────┘            │  nginx:alpine│             │
│                               └──────┬───────┘             │
│                         proxy_pass   │                      │
│                               ┌──────▼───────┐             │
│                               │ Node.js :3000│ (Backend)   │
│                               │ node:alpine  │             │
│                               └──────┬───────┘             │
│                            mysql2    │                      │
│                               ┌──────▼───────┐             │
│                               │  MySQL :3306 │ (Database)  │
│                               │  mysql:8.0   │             │
│                               └──────────────┘             │
│                                      │ named volume         │
│                                 [ db_data ]                 │
└─────────────────────────────────────────────────────────────┘
```

| Tier     | Image           | Port | Role                                 |
|----------|-----------------|------|--------------------------------------|
| Frontend | nginx:alpine    | 80   | Static HTML + reverse proxy /api → backend |
| Backend  | node:20-alpine  | 3000 | REST API, DB queries, health endpoint |
| Database | mysql:8.0       | 3306 | Persistent storage via named volume  |

---

## 3. How It Works

### How the backend waits for MySQL
The backend `Dockerfile` uses a custom `wait-for-db.sh` script as its `ENTRYPOINT`. This script
loops `nc -z db 3306` until the port is open, then execs `node app.js`. Additionally,
`docker-compose.yml` sets `depends_on.db.condition: service_healthy`, which waits for MySQL's
`mysqladmin ping` healthcheck to pass before Docker even starts the backend container.
This two-layer approach ensures the backend never crashes due to MySQL not being ready.

### How Nginx gets the backend URL
The `frontend/Dockerfile` copies `nginx.conf.template` to
`/etc/nginx/templates/default.conf.template`. The official `nginx:alpine` image automatically
runs `envsubst` on all files in that directory at container startup, substituting
`${BACKEND_URL}` from the environment. The resolved config is written to
`/etc/nginx/conf.d/default.conf` before Nginx starts. The `BACKEND_URL` is set in
`docker-compose.yml` as `http://backend:3000` — never hardcoded.

### How services communicate
All three services are on the custom bridge network `app_network`. Docker's internal DNS
resolves service names (`db`, `backend`, `frontend`) to their container IPs automatically.
No IP addresses are ever hardcoded — only service names are used.

---

## 4. Testing Steps

**Access the frontend:**
```
http://localhost
```

**Hit the API directly (via Nginx proxy):**
```bash
# Basic OK response
curl http://localhost/api/

# DB health status
curl http://localhost/api/health
```

**Expected health response (all services up):**
```json
{
  "status": "ok",
  "database": "ok",
  "timestamp": "2026-03-19T10:00:00.000Z"
}
```

**View all logs:**
```bash
docker compose logs -f
```

**View individual service logs:**
```bash
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f frontend
```

---

## 5. Failure Scenario — MySQL Restart

### What happens when MySQL restarts

```bash
docker restart mysql_db
```

1. **Immediately after restart**: The backend's DB connection pool becomes stale.
   The next `/health` request returns `503 { "database": "error" }`.

2. **Automatic recovery**: The backend's `app.js` resets `pool = null` on every failed
   DB query. The next incoming request will create a fresh pool and reconnect.

3. **Recovery time**: MySQL typically takes 10–20 seconds to become ready after restart.
   Once it's accepting connections, the very next backend request to `/health` will
   succeed and the pool will re-establish. No backend restart is required.

4. **Healthcheck confirmation**: The `backend` healthcheck polls `GET /health` every 10s.
   Within ~30 seconds of MySQL recovering, Docker marks the backend healthy again.

### Summary
| Event | Behaviour |
|-------|-----------|
| MySQL container stops | Backend returns `503` on `/health`; app stays up |
| MySQL container restarting | Backend retries connection on each request |
| MySQL ready again | Backend auto-reconnects, returns `200` on next request |
| Total downtime | ~10–30 seconds depending on MySQL startup time |

---

## Repo Structure

```
.
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf.template
│   ├── .dockerignore
│   └── index.html
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── app.js
│   ├── wait-for-db.sh
│   └── package.json
├── docker-compose.yml
├── .env.example          ← commit this
├── .env                  ← DO NOT commit (in .gitignore)
└── README.md
```

---

## Bonus Features Implemented

- ✅ **Multi-stage builds** — both frontend and backend Dockerfiles use multi-stage builds
- ✅ **Non-root USER** — backend runs as `appuser`, frontend runs as `nginx`
- ✅ **wait-for script** — `wait-for-db.sh` ensures backend waits for MySQL
- ✅ **healthcheck-based depends_on** — `service_healthy` condition in Compose
- ✅ **All logs to stdout/stderr** — visible via `docker compose logs -f`
- ✅ **All config via .env** — no values hardcoded in code or configs
