FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Railway will set PORT dynamically
# Don't hardcode it - let Railway control it

# Start the server
CMD ["node", "src/index.js"]
