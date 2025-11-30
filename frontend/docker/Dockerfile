# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments
ARG VITE_API_URL
ARG VITE_TELEGRAM_GROUP_URL
ARG VITE_TELEGRAM_BOT_URL

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_TELEGRAM_GROUP_URL=${VITE_TELEGRAM_GROUP_URL}
ENV VITE_TELEGRAM_BOT_URL=${VITE_TELEGRAM_BOT_URL}

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]