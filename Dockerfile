# Use the official Bun image, which is optimized for performance
FROM oven/bun:latest

# Set the working directory inside the container
WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package.json bun.lockb ./

# Install dependencies using Bun
RUN bun install

# Copy the rest of the application source code
COPY . .

# Expose the Vite default port
EXPOSE 5173

# Start the development server and bind to all network interfaces
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]
