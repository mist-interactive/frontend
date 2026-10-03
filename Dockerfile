# Stage 1: Base - install dependencies and prepare source
FROM oven/bun:1.3.14-alpine AS base

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package.json bun.lock ./
RUN bun install

# Copy application source code
COPY . .

# Copy web export files from game/base-img
COPY --from=game/base-img /root/game /root/game

EXPOSE 5173

# Stage 2a: Development server with hot-reloading
FROM base AS dev

COPY ./entrypoint.sh /bin/entrypoint.sh
RUN chmod +x /bin/entrypoint.sh

ENTRYPOINT [ "entrypoint.sh" ]

# Stage 2b: Production builder
FROM base AS builder

RUN rm -rf ./public/game && cp -r /root/game ./public/game
RUN bun run build

# Stage 3: Production runner
FROM oven/bun:1.3.14-alpine AS production

WORKDIR /app

# Copy package manifests and node_modules needed to run vite preview
COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/node_modules /app/node_modules
# Copy compiled static files
COPY --from=builder /app/dist /dist

EXPOSE 5173

CMD ["bun", "run", "preview", "--", "--outDir", "/dist", "--host", "0.0.0.0", "--port", "5173"]
