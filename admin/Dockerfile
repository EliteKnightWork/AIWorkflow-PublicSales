# This Dockerfile uses `serve` npm package to serve the static files with node process.
# You can find the Dockerfile for nginx in the following link:
# https://github.com/refinedev/dockerfiles/blob/main/vite/Dockerfile.nginx
FROM refinedev/node:18 AS base

FROM base as deps

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

FROM base as builder

ENV NODE_ENV production

COPY --from=deps /app/refine/node_modules ./node_modules

COPY . .

RUN npm run build

FROM nginx:1.23.1 AS build

ARG BASIC_AUTH_USER
ARG BASIC_AUTH_PASSWORD

# Basic 認証ファイルを生成
RUN crypt_pass=`openssl passwd -crypt ${BASIC_AUTH_PASSWORD}` && \
  echo "${BASIC_AUTH_USER}:${crypt_pass}" > .htpasswd

FROM nginx:1.23.1

ENV NODE_ENV production

COPY --from=builder /app/refine/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build .htpasswd /etc/nginx/.htpasswd

# nginx の必要な設定
# nginx の必要な設定
RUN touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid && \
    chown -R nginx:nginx /var/cache/nginx && \
    chmod -R g+w /var/cache/nginx

# ログ設定
RUN mkdir -p /var/log/nginx && \
    ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

# nginx ユーザでコンテナを起動
USER nginx
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]