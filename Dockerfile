# Build Stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy env generator script
COPY env.sh /docker-entrypoint.d/40-env-generator.sh
RUN chmod +x /docker-entrypoint.d/40-env-generator.sh

# Expose port 80
EXPOSE 80

# Start Nginx (scripts in /docker-entrypoint.d/ run automatically)
CMD ["nginx", "-g", "daemon off;"]
