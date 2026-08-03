# Use the official Bun image
FROM oven/bun:1.3.14-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package.json bun.lock ./

# Install dependencies using Bun
RUN bun install

# Copy the rest of the application source code
COPY . .

# get the web export files from the game/base-img
COPY --from=base-img /root/game /root/game

# Copy entry script
COPY ./entrypoint.sh /bin/entrypoint.sh
RUN chmod +x /bin/entrypoint.sh

# Expose the Vite default port
EXPOSE 5173

# Entryscript that start the development server and bind to all network interfaces
ENTRYPOINT [ "entrypoint.sh" ]
