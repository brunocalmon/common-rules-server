# Builds the MCP server (maestro-mcp) — stdio transport, connected by
# whatever launches the container (`docker run -i ...`).

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
COPY resources ./resources
COPY scripts ./scripts
COPY .version-checksum.json ./
# Runs prebuild (scripts/check-version-checksum.mjs) before tsc: an image
# never builds from a source tree whose checksum has drifted from the
# version recorded in package.json.
RUN npm run build

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --omit=dev

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY resources ./resources
COPY package.json ./

CMD ["node", "dist/mcp/main.js"]
