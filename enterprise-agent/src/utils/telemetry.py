"""Telemetry helpers."""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict

logger = logging.getLogger(__name__)


def _emit(payload: Dict[str, Any]) -> None:
    logger.debug("Telemetry event: %s", payload)
    path = os.getenv("TELEMETRY_FILE")
    if not path:
        return
    line = json.dumps(payload, default=str)
    with open(path, "a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def record_event(event: str, **data: Any) -> None:
    payload = {
        "type": "event",
        "event": event,
        "timestamp": datetime.utcnow().isoformat(),
        **data,
    }
    _emit(payload)


def record_metric(name: str, value: Any, **labels: Any) -> None:
    payload = {
        "type": "metric",
        "metric": name,
        "value": value,
        "labels": labels,
        "timestamp": datetime.utcnow().isoformat(),
    }
    _emit(payload)


__all__ = ["record_event", "record_metric"]
