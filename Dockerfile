# Arguments
ARG NODE_VERSION=lts-alpine

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
COPY .eslintrc tsconfig.json /opt/app/

RUN npm run build

FROM nginx:1.24-alpine
WORKDIR /usr/share/nginx/html

# Replace the nginx config files
RUN rm -f /etc/nginx/conf.d/default.conf /etc/nginx/nginx.conf
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Create a non-root user: ml-user
RUN adduser -D ml-user

# Change permissions for nginx folders
RUN chown -R ml-user:ml-user /var/log/nginx
RUN chown -R ml-user:ml-user /var/cache/nginx
RUN chown -R ml-user:ml-user /usr/share/nginx

USER ml-user

COPY --chown=ml-user --from=builder /opt/app/build .
COPY nginx/start.sh /usr/share/nginx/start.sh

EXPOSE 6060
CMD ["sh", "/usr/share/nginx/start.sh"]
