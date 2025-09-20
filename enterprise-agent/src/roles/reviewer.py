"""Reviewer role for scoring outputs."""
from __future__ import annotations

from typing import Dict, List

from .base import BaseRole


class Reviewer(BaseRole):
    def review(
        self, output: str, domain: str, vuln_flag: bool = False
    ) -> Dict[str, float | List[float] | List[str]]:
        models: List[str] = []
        primary = self.route_to_model(output, domain, vuln_flag)
        if primary:
            models.append(primary)
        if (
            getattr(self.orchestrator, "anthropic_client", None)
            and "claude_opus_4" not in models
        ):
            models.append("claude_opus_4")
        pack = self.domain_pack(domain)
        criteria = pack.get("review_criteria", "accuracy, safety, maintainability")

        scores: List[float] = []
        rationales: List[str] = []
        model_list = models or ([primary] if primary else [])
        for model in model_list:
            prompt = (
                f"Score the following {domain} output.\n"
                f"Criteria: {criteria}. Think step-by-step, base only on supplied text, then return JSON "
                '{"score": float between 0 and 1, "rationale": str}.\n\n'
                f"{output}"
            )
            try:
                result = self.call_model(model, prompt, "Reviewer", "score")
                parsed = self.parse_json(result)
                if isinstance(parsed, dict) and "score" in parsed:
                    score = float(parsed.get("score", 0.0))
                    rationale = str(parsed.get("rationale", "")).strip()
                else:
                    score = float(result.strip())
                    rationale = ""
            except Exception:
                score, rationale = 0.5, "fallback default"
            scores.append(max(0.0, min(1.0, score)))
            rationales.append(rationale)
        if not model_list:
            scores = [0.0]
            rationales = ["no reviewer models available"]
        confidence = sum(scores) / len(scores) if scores else 0.0
        return {
            "confidence": confidence,
            "scores": scores,
            "models": models,
            "rationales": rationales,
        }


__all__ = ["Reviewer"]
