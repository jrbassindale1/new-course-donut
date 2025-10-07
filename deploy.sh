#!/usr/bin/env bash
set -euo pipefail

# ==== CONFIGURE THESE ====
REMOTE_USER="feedbae9"
REMOTE_HOST="50.87.216.45"
REMOTE_PORT="22"
REMOTE_PATH="/home/${REMOTE_USER}/public_html/uwe-bsc-architecture/open-day/"
# ==========================

echo "▶ Building production bundle…"
npm run build

echo "▶ Deploying to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
rsync -rlvz --delete \
  --no-perms --no-owner --no-group \
  --chmod=Du=rwx,go=rx,Fu=rw,go=r \
  -e "ssh -p ${REMOTE_PORT}" \
  dist/ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

# Ensure correct permissions on the server (directories 755, files 644)
ssh -p "${REMOTE_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" \
  "find '${REMOTE_PATH}' -type d -exec chmod 755 {} \; && find '${REMOTE_PATH}' -type f -exec chmod 644 {} \;"

echo "✅ Deploy complete."
