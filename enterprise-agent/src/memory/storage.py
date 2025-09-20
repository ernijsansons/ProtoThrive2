"""Memory storage abstraction."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

try:  # Optional dependency
    import pinecone  # type: ignore
except ImportError:  # pragma: no cover
    pinecone = None  # type: ignore


@dataclass
class MemoryRecord:
    value: Any
    timestamp: datetime = field(default_factory=datetime.utcnow)


class MemoryStore:
    def __init__(self, config: Dict[str, Any]) -> None:
        self.config = config or {}
        types = self.config.get("types", ["session"])
        self.stores: Dict[str, Dict[str, MemoryRecord]] = {level: {} for level in types}
        self.retention_days = int(self.config.get("retention_days", 30))

        self.pinecone_index = None
        if self.config.get("storage", "memory").startswith("hybrid") and pinecone:
            api_key = os.getenv("PINECONE_API_KEY")
            if api_key:
                try:
                    # Updated Pinecone API v3+ syntax
                    from pinecone import Pinecone

                    pc = Pinecone(api_key=api_key)
                    index_name = self.config.get("pinecone_index", "memory-index")
                    self.pinecone_index = pc.Index(index_name)
                except Exception:  # pragma: no cover - handle missing index gracefully
                    self.pinecone_index = None

    # ---------------------------------------------------------------- store/retrieve
    def store(self, level: str, key: str, value: Any) -> None:
        store = self.stores.setdefault(level, {})
        store[key] = MemoryRecord(value=value)
        if self.pinecone_index:
            self._upsert_vector(level, key, value)

    def retrieve(self, level: str, key: str, default: Any = None) -> Optional[Any]:
        record = self.stores.get(level, {}).get(key)
        return record.value if record else default

    def prune(self) -> None:
        cutoff = datetime.utcnow() - timedelta(days=self.retention_days)
        for level, store in self.stores.items():
            self.stores[level] = {
                key: record
                for key, record in store.items()
                if record.timestamp > cutoff
            }

    # ----------------------------------------------------------------- vectors (stub)
    def _upsert_vector(self, level: str, key: str, value: Any) -> None:
        if not self.pinecone_index:
            return
        vector = [0.0] * 8 if isinstance(value, str) else [0.0] * 4
        metadata = {"level": level, "key": key}
        try:  # pragma: no cover - best effort
            self.pinecone_index.upsert([(key, vector, metadata)])
        except Exception:
            pass


__all__ = ["MemoryStore"]
