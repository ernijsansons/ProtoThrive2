"""Reflector role to iterate on failures."""
from __future__ import annotations

import json
from typing import Any, Dict

from .base import BaseRole


class Reflector(BaseRole):
    def reflect(
        self,
        validation: Dict[str, Any],
        current_output: str,
        domain: str,
        iterations: int,
        vuln_flag: bool = False,
    ) -> Dict[str, Any]:
        if iterations >= 5:
            return {
                "output": current_output,
                "halt": True,
                "iterations": iterations,
                "confidence": 0.0,
            }

        model = self.route_to_model(json.dumps(validation), domain, vuln_flag)
        prompt = (
            "Analyze the validation feedback and propose targeted fixes.\n"
            'Respond with JSON: {"analysis": str, "fixes": [{"description": str, "risks": str}], '
            '"selected_fix": int, "revised_output": str, "confidence": float}.\n'
            "Base only on provided data.\n"
            f"Validation feedback: {validation}\nCurrent output:\n{current_output}\n"
        )
        response = self.call_model(model, prompt, "Reflector", "reflect")
        try:
            parsed = self.parse_json(response)
        except Exception:  # pragma: no cover - stub orchestrators may raise
            parsed = None
        if isinstance(parsed, dict) and parsed:
            confidence = float(parsed.get("confidence", 0.0))
            revised = parsed.get("revised_output", current_output)
            analysis = parsed
        else:
            confidence = 0.0
            revised = response.strip() or current_output
            analysis = {"raw": response}
        halt = confidence >= 0.8
        return {
            "output": revised,
            "halt": halt,
            "iterations": iterations + 1,
            "model": model,
            "confidence": confidence,
            "analysis": analysis,
        }


__all__ = ["Reflector"]
