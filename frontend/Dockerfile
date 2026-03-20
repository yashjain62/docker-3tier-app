# Stage 1: build (nothing to compile for static HTML, but shows multi-stage pattern)
FROM nginx:alpine AS builder
COPY index.html /usr/share/nginx/html/index.html

# Stage 2: final image
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy static files from builder
COPY --from=builder /usr/share/nginx/html/index.html /usr/share/nginx/html/index.html

# Copy nginx template (NOT the rendered config)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Run as non-root user
# nginx:alpine has 'nginx' user (uid 101) — use it
# Adjust permissions so nginx user can write pid/cache
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

# nginx:alpine docker image already has an entrypoint that processes
# /etc/nginx/templates/*.template via envsubst and starts nginx.
# No custom CMD needed.
