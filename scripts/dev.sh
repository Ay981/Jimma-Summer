#!/usr/bin/env bash
LAN_IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}')
LAN_IP=${LAN_IP:-localhost}
export APP_URL="http://${LAN_IP}:8000"
echo "APP_URL → $APP_URL"
npx concurrently \
  -c "#93c5fd,#c4b5fd,#fb7185,#fdba74" \
  "php artisan serve --host=0.0.0.0" \
  "php artisan queue:listen --tries=1 --timeout=0" \
  "php artisan pail --timeout=0" \
  "npm run dev" \
  --names=server,queue,logs,vite \
  --kill-others
