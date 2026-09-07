# ---- stage 1: build the Vue frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
RUN npm ci --workspace frontend --workspace backend --include-workspace-root
COPY frontend frontend
RUN npm run build --workspace frontend

# ---- stage 2: install backend deps (needs a C toolchain for bcrypt) ----
FROM node:20-alpine AS backend-build
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace backend --include-workspace-root --omit=dev

# ---- stage 3: slim production runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=backend-build /app/node_modules node_modules
COPY backend backend
COPY --from=frontend-build /app/frontend/dist backend/public

WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "src/server.js"]
