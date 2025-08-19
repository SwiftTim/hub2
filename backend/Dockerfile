# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup --system --gid 1001 backend
RUN adduser --system --uid 1001 backend

# Change ownership
RUN chown -R backend:backend /app
USER backend

EXPOSE 5000

CMD ["npm", "start"]
