"""Planner role for decomposing tasks."""
from __future__ import annotations

from typing import Any, Dict

from .base import BaseRole


class Planner(BaseRole):
    def decompose(self, task: str, domain: str) -> Dict[str, Any]:
        pack = self.domain_pack(domain)
        adapter = pack.get("prompt_adapter", domain)
        examples = pack.get("generation_guidelines", [])
        guidelines = "\n".join(f"- {item}" for item in examples) if examples else ""
        model = self.route_to_model(task, domain)
        prompt = (
            "Think step-by-step: Decompose the following task into actionable epics or steps.\n"
            "Base on provided data only; do not invent requirements.\n"
            f"Domain focus: {adapter}.\n"
            f"Task: {task}\n"
        )
        if guidelines:
            prompt += f"Guidelines:\n{guidelines}\n"
        plan_text = self.call_model(model, prompt, "Planner", "decompose")
        epics = [line.strip() for line in plan_text.splitlines() if line.strip()]
        self.store_memory("session", "plan", plan_text)
        return {"text": plan_text, "epics": epics, "model": model}


__all__ = ["Planner"]
