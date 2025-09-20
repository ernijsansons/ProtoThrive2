"""Validator role for domain-specific checks."""
from __future__ import annotations

import os
from typing import Any, Dict

from .base import BaseRole
from .validators import (
    validate_coding,
    validate_content,
    validate_real_estate,
    validate_social_media,
    validate_trading,
)


class Validator(BaseRole):
    def validate(self, output: str, domain: str) -> Dict[str, Any]:
        pack = self.domain_pack(domain)
        agent_cfg = getattr(self.orchestrator, "agent_cfg", {}) or {}
        workspace_root = agent_cfg.get("workspace_root") or os.getcwd()
        secrets = getattr(self.orchestrator, "secrets", {}) or {}
        payload = {
            "output": output,
            "coverage_threshold": float(pack.get("coverage_threshold", 0.97)),
            "workspace": workspace_root,
            "secrets": secrets,
        }
        domain_validators = {
            "coding": validate_coding,
            "social_media": validate_social_media,
            "content": validate_content,
            "trading": validate_trading,
            "real_estate": validate_real_estate,
        }
        validator_fn = domain_validators.get(domain)
        parsed = validator_fn(payload) if validator_fn else {}
        model = self.route_to_model(output, domain)
        return {"raw": parsed, "parsed": parsed, "model": model}


__all__ = ["Validator"]
