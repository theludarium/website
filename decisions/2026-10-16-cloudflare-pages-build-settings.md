## 2026-10-16: Cloudflare Pages build settings

- **Node pinned to 22.23.3 in `.nvmrc`.** Cloudflare's v3 build image defaults to Node 22.16.0, below Astro 7's 22.22 minimum. Pages reads `.nvmrc`, so builds match local exactly.
- **Build settings:** production branch `main`, build command `npm run build`, output directory `dist`, no adapter (static output). Every other branch and pull request gets its own preview URL.
