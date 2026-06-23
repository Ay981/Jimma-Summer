FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    nginx \
    nodejs \
    npm \
    postgresql-dev \
    libpng-dev \
    oniguruma-dev \
    libxml2-dev \
    zip \
    unzip \
    curl \
    supervisor

RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    xml \
    opcache

COPY --from=composer:2.7 \
    /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .

RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction

# Firebase WEB push config — these are public client-side values (they ship in
# the JS bundle and the service worker), NOT secrets. They must be present at
# `npm run build` time because Vite inlines `import.meta.env.VITE_*`. The build
# context excludes .env (see .dockerignore), so provide them here. Override per
# environment with `docker build --build-arg VITE_FIREBASE_API_KEY=... ...`.
ARG VITE_FIREBASE_API_KEY=AIzaSyCm5FhpsB1f2ajDonr4Pcok4mUpRTgS_Wg
ARG VITE_FIREBASE_AUTH_DOMAIN=irshad-muraja.firebaseapp.com
ARG VITE_FIREBASE_PROJECT_ID=irshad-muraja
ARG VITE_FIREBASE_STORAGE_BUCKET=irshad-muraja.firebasestorage.app
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=403334478043
ARG VITE_FIREBASE_APP_ID=1:403334478043:web:01d0078e1fa5f218dab4fe
ARG VITE_FIREBASE_VAPID_KEY=BMOtqGa6uVbLBNl746kLhTKXx89rqcV69j0Jqo-o079pIss2hMjU5_6jnpotSpQlJSCpGA_kZliWlciVT_DYV9w
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_VAPID_KEY=$VITE_FIREBASE_VAPID_KEY

RUN npm install --no-audit --no-fund && npm run build && rm -rf node_modules

RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www/storage \
    && chmod -R 755 /var/www/bootstrap/cache

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
    && mkdir -p /var/lib/nginx/logs /var/lib/nginx/tmp/client_body /var/lib/nginx/tmp/proxy /var/lib/nginx/tmp/fastcgi /var/run/nginx /var/log/nginx \
    && chown -R www-data:www-data /var/lib/nginx /var/run/nginx /var/log/nginx

# Switch to non-root user
USER www-data

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://127.0.0.1/up || exit 1

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
