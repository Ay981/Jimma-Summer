#!/bin/sh
set -e

cd /var/www

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force

# Only seed on first deploy or when explicitly requested
if [ "${RUN_SEEDERS}" = "true" ]; then
    php artisan db:seed --force
fi

exec /usr/bin/supervisord -c /etc/supervisord.conf
