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
    supervisor \
    chromium \
    chromium-chromedriver

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

COPY --from=composer:latest \
    /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .

RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction

RUN npm install && npm run build
RUN rm -rf node_modules

RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www/storage \
    && chmod -R 755 /var/www/bootstrap/cache

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

EXPOSE 80
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
