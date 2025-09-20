import re
import subprocess
from typing import List

PII_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")


def scrub_pii(text: str) -> str:
    """Redact PII like emails."""
    return PII_PATTERN.sub("[REDACTED]", text)


def sandboxed_shell(cmd: List[str], allowed_commands: set = {"codex", "pytest"}) -> str:
    """Run shell with allow-list."""
    if cmd[0] not in allowed_commands:
        raise ValueError(f"Command {cmd[0]} not allowed.")
    # SAFETY: Subprocess with check=True, no shell=True to avoid injection.
    result = subprocess.run(
        cmd, capture_output=True, text=True, check=True, timeout=300
    )
    return scrub_pii(result.stdout)


# WHY: Prevents PII leaks and command injection in CLI calls.
