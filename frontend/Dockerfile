# Stage 1: Build the Next.js application
FROM node:18 AS builder
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy application files
COPY . .

# Build the Next.js application in standalone mode
RUN npm run build

# Stage 2: Create the final container
FROM node:18
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nextjs /app

# Copy necessary files from the builder stage
COPY --from=builder /app/.next/standalone ./  # Fixing reference
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
