FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Environment variables with defaults
ENV PORT=5000
ENV NODE_ENV=production
ENV MONGO_URI=mongodb://mongodb:27017/sacred6
ENV FRONTEND_URL=http://frontend:3000

# Start the application
CMD ["npm", "start"]
