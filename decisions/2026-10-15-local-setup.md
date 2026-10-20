## 2026-10-15: Local setup

- **Repo lives at `~/Developer/theludarium`.** Code stays apart from business docs on the Desktop. Folder name matches the planned GitHub repo.
- **Node 22 LTS installed per user at `~/.local/node`**, added to PATH in `~/.zprofile`. No admin password needed and nothing system-wide. Astro 7 requires Node 22.22 or newer. `.nvmrc` pins 22 so Cloudflare Pages builds with the same major version.
