# frontend_apps/claude/Dockerfile

# ── ビルドステージ ──────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# パッケージインストール
COPY package*.json ./
RUN npm ci

# ソースコードコピー・ビルド
COPY . .
RUN npm run build

# ── 本番ステージ ────────────────────────
FROM nginx:alpine

# ビルド成果物をnginxの配信ディレクトリにコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# React Router対応（リロード時に404にならないよう）
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

