FROM node:20-alpine

WORKDIR /app

# Copy root package.json and package-lock.json (workspace configuration)
COPY package*.json ./

# Copy frontend package.json to its subdirectory
COPY frontend/package.json ./frontend/

# Install all workspace dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./frontend/

# Set working directory to frontend
WORKDIR /app/frontend

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]