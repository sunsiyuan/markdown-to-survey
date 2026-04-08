FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/mcp-server/package.json ./packages/mcp-server/

RUN pnpm install --frozen-lockfile

COPY packages/mcp-server ./packages/mcp-server
COPY tsconfig.json ./

RUN pnpm --filter humansurvey-mcp exec tsup src/index.ts --format esm

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/packages/mcp-server/dist ./dist
COPY --from=builder /app/packages/mcp-server/package.json ./
COPY --from=builder /app/node_modules ./node_modules

ENTRYPOINT ["node", "dist/index.js"]
