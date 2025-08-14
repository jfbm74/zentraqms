FROM node:20-alpine

# Install necessary packages for native dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy root package.json and package-lock.json (workspace configuration)
COPY package*.json ./

# Copy frontend package.json to its subdirectory
COPY frontend/package.json ./frontend/

# Install workspace dependencies and specifically install frontend workspace
RUN npm ci && npm ci --workspace=frontend

# Install the missing native rollup package
WORKDIR /app/frontend
RUN npm install @rollup/rollup-linux-arm64-musl --save-dev

# Copy frontend source code
COPY frontend/ ./frontend/

# Use npx to run vite from the workspace node_modules
WORKDIR /app/frontend

EXPOSE 3000

CMD ["./node_modules/.bin/vite", "--host", "0.0.0.0", "--port", "3000"]