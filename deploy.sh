#!/usr/bin/env bash
set -euo pipefail

# ==== CONFIGURE THESE ====
REMOTE_USER="feedbae9"
REMOTE_HOST="50.87.216.45"
REMOTE_PORT="22"
REMOTE_PATH="/home/${REMOTE_USER}/public_html/uwe-bsc-architecture"
# ==========================

echo "▶ Building production bundle…"
npm run build

echo "▶ Deploying to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
rsync -avz --delete \
  -e "ssh -p ${REMOTE_PORT}" \
  dist/ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

echo "✅ Deploy complete."

