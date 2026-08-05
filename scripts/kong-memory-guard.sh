#!/bin/bash
# ==============================================================================
# FTTH GIS — Kong Memory Guard
# Checks Kong container memory usage every 15-30 minutes and restarts Kong
# if RAM exceeds 420MiB to prevent memory leaks and server OOM.
# ==============================================================================

set -euo pipefail

KONG_CONTAINER=$(docker ps -q --filter "name=kong" 2>/dev/null || true)
if [ -n "$KONG_CONTAINER" ]; then
  KONG_MEM_RAW=$(docker stats --no-stream --format "{{.MemUsage}}" kong 2>/dev/null | awk '{print $1}' || echo "0")
  if [[ "$KONG_MEM_RAW" =~ ([0-9]+)(\.[0-9]+)?MiB ]] && [ "${BASH_REMATCH[1]}" -gt 420 ]; then
    echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] ⚠️ Kong RAM (${KONG_MEM_RAW}) exceeds 420MiB threshold — restarting container..."
    docker restart kong >/dev/null 2>&1 || true
    echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] ✅ Kong container restarted & memory flushed."
  fi
fi
