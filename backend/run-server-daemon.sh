#!/bin/bash
# Daemon wrapper for Wingo API server
# Provides auto-restart capability with crash detection

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/server.log"
PID_FILE="$SCRIPT_DIR/server.pid"
PORT="${PORT:-8001}"
MIN_UPTIME=10
BACKOFF_TIMES=(5 10 15 20 60)
BACKOFF_INDEX=0

# Virtual environment python and uvicorn
VENV_PYTHON="$SCRIPT_DIR/venv/bin/python3"
UVICORN="$SCRIPT_DIR/venv/bin/uvicorn"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cleanup() {
    log "Received shutdown signal, stopping server..."
    if [ -f "$PID_FILE" ]; then
        kill "$(cat "$PID_FILE")" 2>/dev/null
        rm -f "$PID_FILE"
    fi
    exit 0
}

trap cleanup SIGTERM SIGINT

# Kill any process using our port
if lsof -i ":$PORT" | grep -q LISTEN; then
    log "Port $PORT in use, killing existing process..."
    lsof -ti ":$PORT" | xargs kill -9 2>/dev/null || true
    sleep 1
fi

log "Starting Wingo API daemon on port $PORT..."

cd "$SCRIPT_DIR" || exit 1

while true; do
    START_TIME=$(date +%s)
    log "Starting server on port $PORT..."

    # Run uvicorn and capture PID
    "$UVICORN" main:app --port "$PORT" --host 127.0.0.1 &
    SERVER_PID=$!
    echo "$SERVER_PID" > "$PID_FILE"

    # Wait for server to exit
    wait "$SERVER_PID"
    EXIT_CODE=$?

    END_TIME=$(date +%s)
    UPTIME=$((END_TIME - START_TIME))

    rm -f "$PID_FILE"

    if [ $EXIT_CODE -eq 0 ]; then
        log "Server exited cleanly"
        break
    fi

    log "Server crashed with exit code $EXIT_CODE after ${UPTIME}s uptime"

    # Reset backoff if server ran for more than MIN_UPTIME
    if [ $UPTIME -gt $MIN_UPTIME ]; then
        BACKOFF_INDEX=0
    fi

    # Get backoff time
    if [ $BACKOFF_INDEX -ge ${#BACKOFF_TIMES[@]} ]; then
        BACKOFF_INDEX=$((${#BACKOFF_TIMES[@]} - 1))
    fi
    BACKOFF=${BACKOFF_TIMES[$BACKOFF_INDEX]}

    log "Restarting in ${BACKOFF}s (backoff index: $BACKOFF_INDEX)"
    sleep "$BACKOFF"

    BACKOFF_INDEX=$((BACKOFF_INDEX + 1))
done

log "Daemon stopped"
