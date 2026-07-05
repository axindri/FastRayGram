#!/bin/sh
set -eu

APP_URL="${APP_URL:-http://app:8000}"
CHECK_INTERVAL_SEC="${CHECK_INTERVAL_SEC:-30}"

if [ -z "${APP__SUPERUSER_TOKEN:-}" ]; then
  echo "APP__SUPERUSER_TOKEN is not set"
  exit 1
fi

echo "Invoice worker started (interval=${CHECK_INTERVAL_SEC}s, app=${APP_URL})"

until curl -sf "${APP_URL}/api/health" >/dev/null; do
  echo "waiting for app..."
  sleep 2
done

while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] GET /api/admin/invoices/check"
  if curl -sf -H "Authorization: Bearer ${APP__SUPERUSER_TOKEN}" "${APP_URL}/api/admin/invoices/check"; then
    echo ""
  else
    echo "request failed"
  fi
  sleep "${CHECK_INTERVAL_SEC}"
done
