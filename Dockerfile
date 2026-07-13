# Use a lightweight Alpine Linux image with Node.js 20 installed
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies inside the container
RUN npm install

# Expose the Vite default port to the host machine
EXPOSE 5173

# Start the dev server and bind it to all network interfaces (0.0.0.0) so it can accept connections from outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
