import asyncio
import json
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections grouped by timer_type (30S / 1M)."""

    def __init__(self):
        # timer_type -> set of WebSocket connections
        self._connections: Dict[str, Set[WebSocket]] = {}
        # The running asyncio loop (set once at startup)
        self._loop: asyncio.AbstractEventLoop | None = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop

    async def connect(self, ws: WebSocket, timer_type: str):
        await ws.accept()
        self._connections.setdefault(timer_type, set()).add(ws)
        logger.info(f"WS connected: {timer_type} (total={len(self._connections.get(timer_type, []))})")

    def disconnect(self, ws: WebSocket, timer_type: str):
        conns = self._connections.get(timer_type)
        if conns:
            conns.discard(ws)
        logger.info(f"WS disconnected: {timer_type}")

    async def _broadcast(self, timer_type: str, message: dict):
        conns = list(self._connections.get(timer_type, []))
        dead = []
        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, timer_type)

    def notify(self, timer_type: str, last_issue: str | None = None):
        """
        Called from the synchronous fetcher thread.
        Schedules an async broadcast on the main event loop.
        """
        if not self._loop:
            return
        msg = {"type": "new_result", "timer": timer_type, "issue": last_issue}
        asyncio.run_coroutine_threadsafe(self._broadcast(timer_type, msg), self._loop)


# Singleton
manager = ConnectionManager()
