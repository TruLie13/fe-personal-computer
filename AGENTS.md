<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Personal Computer frontend agents

Before changing desktop UI or Zustand state, read the repo-root specs (one level up from this package):

- `../cursorrules.md` — global rules (no `any`, DRY, Win95 limits)
- `../docs/state-agent.md` — slice-based `useDesktopStore` layout (do not rebuild a god store)
- `../docs/ui-agent.md` — shared components/hooks to reuse (`MasterDetail`, delete/menu hooks, etc.)
- `../docs/plan.md` — MVP vs post-MVP scope
