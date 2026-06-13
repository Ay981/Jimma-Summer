#!/bin/sh
set -e

cd /var/www

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force

exec /usr/bin/supervisord -c /etc/supervisord.conf
