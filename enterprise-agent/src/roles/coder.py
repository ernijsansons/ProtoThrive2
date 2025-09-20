"""Coder role responsible for generation."""
from __future__ import annotations

from typing import Any, Dict, List

from .base import BaseRole


class Coder(BaseRole):
    def _build_prompt(self, plan_text: str, domain: str, guidelines: List[str]) -> str:
        checklist = (
            "\n".join(f"- {item}" for item in guidelines)
            if guidelines
            else "- Follow domain standards."
        )
        return (
            "Follow the structured plan below to produce the requested artefact.\n"
            "Think step-by-step: 1) analyse each epic, 2) implement required changes, 3) self-validate "
            "(lint/tests) and summarise results. Base strictly on provided repository context.\n"
            f"Domain: {domain}\nChecklist:\n{checklist}\nPlan:\n{plan_text}\n"
            "Respond with the final artefact only after completing a brief self-check summary."
        )

    def generate(
        self, plan: str, domain: str, vuln_flag: bool = False
    ) -> Dict[str, Any]:
        plan_text = plan or "No plan available."
        pack = self.domain_pack(domain)
        guidelines = pack.get("generation_guidelines", [])
        prompt = self._build_prompt(plan_text, domain, guidelines)
        model = self.route_to_model(prompt, domain, vuln_flag)
        if model == "openai_gpt_5_codex":
            output = self.invoke_codex_cli("auto-edit", ["--prompt", prompt], domain)
            source = "codex_cli"
        else:
            output = self.call_model(model, prompt, "Coder", "generate")
            source = "model"
        self.store_memory("session", "coder_prompt", prompt)
        return {"output": output, "model": model, "source": source}


__all__ = ["Coder"]
