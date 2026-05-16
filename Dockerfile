# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files ensuring both package.json and package-lock.json are copied
COPY package.json package-lock.json ./

# Install dependencies
# Using ci for more reliable builds
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
