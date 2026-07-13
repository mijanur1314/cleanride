FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build typescript
RUN npx prisma generate
RUN npm run build

# Switch to non-root user
USER node

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
