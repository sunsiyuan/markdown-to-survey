# Contributing

## Setup
```bash
pnpm install
pnpm dev
```

## Branch conventions
- `feat/<name>` — new features
- `fix/<name>` — bug fixes
- Always PR into `main`, never push directly

## Commit messages
- `task N: short description` (during initial build)
- `feat: description` / `fix: description` (after v0.1.0)

## Testing
- Parser: `pnpm --filter @mts/parser test`
- Web: `pnpm --filter web dev` then manual smoke test
