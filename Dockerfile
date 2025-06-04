# Arguments
ARG NODE_VERSION=lts-alpine
ARG API_BASE_URL=http://localhost:5050
ARG AUTH_ENABLED=FALSE
ARG PAYER_SIM_BRAND_ICON=""
ARG PAYEE_SIM_BRAND_ICON=""

# NOTE: Ensure you set NODE_VERSION Build Argument as follows...
#
#  export NODE_VERSION="$(cat .nvmrc)-alpine" \
#  docker build \
#    --build-arg NODE_VERSION=$NODE_VERSION \
#    -t mojaloop/ml-testing-toolkit-ui:local \
#    .
#

# Build Image
FROM node:${NODE_VERSION} as builder
WORKDIR /opt/app

RUN apk add --no-cache -t build-dependencies make gcc g++ python3 libtool openssl-dev autoconf automake bash \
    && cd $(npm root -g)/npm \
    && npm install -g node-gyp

COPY package.json package-lock.json* /opt/app/

RUN npm ci

COPY src /opt/app/src
COPY public /opt/app/public
COPY index.html vite.config.js eslint.config.js tsconfig.json /opt/app/

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Use an intermediate stage with a shell to prepare nginx configuration
FROM alpine:3.19 as config
WORKDIR /tmp

# Environment variables
ARG API_BASE_URL
ARG AUTH_ENABLED
ARG PAYER_SIM_BRAND_ICON
ARG PAYEE_SIM_BRAND_ICON

# Copy nginx config
COPY nginx/nginx.conf /tmp/nginx.conf
COPY nginx/prestart.sh /tmp/prestart.sh

# Create necessary directories for Chainguard nginx
RUN mkdir -p /tmp/var/lib/nginx/tmp \
    /tmp/var/run \
    /tmp/etc/nginx \
    /tmp/usr/share/nginx/html

# Copy build artifacts
COPY --from=builder /opt/app/build /tmp/usr/share/nginx/html/

# Apply environment variable substitution
RUN chmod +x /tmp/prestart.sh && \
    cd /tmp && \
    API_BASE_URL=${API_BASE_URL} \
    AUTH_ENABLED=${AUTH_ENABLED} \
    PAYER_SIM_BRAND_ICON="${PAYER_SIM_BRAND_ICON}" \
    PAYEE_SIM_BRAND_ICON="${PAYEE_SIM_BRAND_ICON}" \
    ./prestart.sh

# Final image
FROM cgr.dev/chainguard/nginx:latest

# Copy pre-prepared nginx configuration
COPY --from=config /tmp/nginx.conf /etc/nginx/nginx.conf

# Copy the prepared html directory and required tmp/run directories
COPY --from=config /tmp/usr/share/nginx/html /usr/share/nginx/html
COPY --from=config /tmp/var/lib/nginx/tmp /var/lib/nginx/tmp
COPY --from=config /tmp/var/run /var/run

# Configuration done - use the default entrypoint/cmd
EXPOSE 6060
