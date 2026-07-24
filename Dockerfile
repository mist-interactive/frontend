FROM debian:bookworm-slim AS build

ENV GODOT_VERSION "4.7.1"
ENV GODOT_EXPORT_TEMPLATES_DIR "/root/.local/share/godot/export_templates/${GODOT_VERSION}.stable"

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates wget unzip git xz-utils libfontconfig1 && update-ca-certificates

RUN wget -O godot.zip "https://downloads.godotengine.org/?version=${GODOT_VERSION}&flavor=stable&slug=linux.x86_64.zip&platform=linux.64"
RUN unzip godot.zip && \
    mv Godot_v${GODOT_VERSION}-stable_linux.x86_64 /bin/godot && \
    rm -f godot.zip

 RUN mkdir ~/.cache && \
    mkdir -p ~/.config/godot && \
    mkdir -p $GODOT_EXPORT_TEMPLATES_DIR

RUN git clone https://github.com/mist-interactive/godot_export_templates.git godot_export_templates
RUN cd godot_export_templates && \
    mv web_nothreads_release.zip "$GODOT_EXPORT_TEMPLATES_DIR" && \
    mv web_release.zip "$GODOT_EXPORT_TEMPLATES_DIR"

RUN rm -rf godot_export_templates

RUN git clone https://github.com/mist-interactive/memoir-3167.git /root/memoir-3167

# build for the web
RUN mkdir /root/web && godot --headless --path /root/memoir-3167 --export-release "Web" "/root/web/index.html"


# Use the official Bun image, which is optimized for performance
FROM oven/bun:latest

# Set the working directory inside the container
WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package.json bun.lock ./

# Install dependencies using Bun
RUN bun install

# Copy the rest of the application source code
COPY . .

# get the web export files
COPY --from=build /root/web /app/public/game

# Expose the Vite default port
EXPOSE 5173

# Start the development server and bind to all network interfaces
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]
