import os
import json
import sys
from datetime import datetime
from typing import Any, Dict, Optional, Union
from pathlib import Path
from loguru import logger
from functools import wraps
import time

class StructuredLogger:
    def __init__(self, service_name: str, version: str = "1.0.0"):
        self.service_name = service_name
        self.version = version
        self.environment = os.getenv("ENVIRONMENT", "development")
        self.instance_id = os.getenv("HOSTNAME", "unknown")

        # Remove default logger
        logger.remove()

        # Configure log level based on environment
        log_level = self._get_log_level()

        # Add console handler with appropriate format
        if self.environment == "development":
            # Human-readable format for development
            logger.add(
                sys.stderr,
                level=log_level,
                format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{extra[service]}</cyan> | <level>{message}</level> | {extra}",
                colorize=True
            )
        else:
            # JSON format for production
            logger.add(
                sys.stderr,
                level=log_level,
                format=self._json_formatter,
                serialize=False
            )

        # Add file handlers for non-development environments
        if self.environment != "development":
            log_dir = Path("logs")
            log_dir.mkdir(exist_ok=True)

            # Combined log
            logger.add(
                log_dir / "combined_{time:YYYY-MM-DD}.log",
                level=log_level,
                format=self._json_formatter,
                rotation="1 day",
                retention="14 days",
                compression="gz"
            )

            # Error log
            logger.add(
                log_dir / "error_{time:YYYY-MM-DD}.log",
                level="ERROR",
                format=self._json_formatter,
                rotation="1 day",
                retention="30 days",
                compression="gz"
            )

        # Bind default context
        self.logger = logger.bind(
            service=self.service_name,
            environment=self.environment,
            version=self.version,
            instance=self.instance_id
        )

    def _get_log_level(self) -> str:
        env_level = os.getenv("LOG_LEVEL")
        if env_level:
            return env_level.upper()

        level_map = {
            "production": "INFO",
            "staging": "INFO",
            "development": "DEBUG",
            "test": "ERROR"
        }
        return level_map.get(self.environment, "DEBUG")

    def _json_formatter(self, record: Dict[str, Any]) -> str:
        """Format log record as JSON"""
        log_dict = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record["level"].name,
            "message": record["message"],
            "service": record["extra"].get("service", self.service_name),
            "environment": record["extra"].get("environment", self.environment),
            "version": record["extra"].get("version", self.version),
            "instance": record["extra"].get("instance", self.instance_id)
        }

        # Add extra fields
        for key, value in record["extra"].items():
            if key not in ["service", "environment", "version", "instance"]:
                log_dict[key] = self._sanitize_value(value)

        # Add exception info if present
        if record.get("exception"):
            log_dict["exception"] = {
                "type": record["exception"].type.__name__,
                "message": str(record["exception"].value),
                "traceback": record["exception"].traceback.format()
            }

        return json.dumps(log_dict)

    def _sanitize_value(self, value: Any, depth: int = 0) -> Any:
        """Sanitize sensitive data from log values"""
        if depth > 5:  # Prevent deep recursion
            return "[DEPTH_EXCEEDED]"

        sensitive_keys = ["password", "token", "secret", "key", "authorization", "cookie", "api_key"]

        if isinstance(value, dict):
            sanitized = {}
            for k, v in value.items():
                if any(sensitive in k.lower() for sensitive in sensitive_keys):
                    sanitized[k] = "[REDACTED]"
                else:
                    sanitized[k] = self._sanitize_value(v, depth + 1)
            return sanitized
        elif isinstance(value, (list, tuple)):
            return [self._sanitize_value(item, depth + 1) for item in value]
        elif isinstance(value, str):
            # Check if the string looks like a secret
            if len(value) > 20 and any(c in value for c in ["=", "-", "_"]):
                for sensitive in sensitive_keys:
                    if sensitive in value.lower():
                        return "[REDACTED]"
            return value
        else:
            return value

    def debug(self, message: str, **kwargs):
        self.logger.debug(message, **self._sanitize_value(kwargs))

    def info(self, message: str, **kwargs):
        self.logger.info(message, **self._sanitize_value(kwargs))

    def warning(self, message: str, **kwargs):
        self.logger.warning(message, **self._sanitize_value(kwargs))

    def error(self, message: str, error: Optional[Exception] = None, **kwargs):
        if error:
            kwargs["error"] = {
                "type": type(error).__name__,
                "message": str(error),
                "args": error.args
            }
        self.logger.error(message, **self._sanitize_value(kwargs))

    def critical(self, message: str, **kwargs):
        self.logger.critical(message, **self._sanitize_value(kwargs))

    def metric(self, name: str, value: float, unit: str = "ms", tags: Optional[Dict[str, str]] = None):
        """Log a metric value"""
        self.logger.info(
            "metric",
            metric={
                "name": name,
                "value": value,
                "unit": unit,
                "tags": tags or {},
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )

    def audit(self, action: str, user_id: str, details: Dict[str, Any]):
        """Log an audit event for compliance"""
        self.logger.info(
            "AUDIT",
            audit={
                "action": action,
                "user_id": user_id,
                "details": self._sanitize_value(details),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )

    def ai_inference(
        self,
        model: str,
        task_type: str,
        prompt_tokens: int,
        completion_tokens: int,
        duration_ms: float,
        cost_usd: float,
        success: bool = True,
        **kwargs
    ):
        """Log AI inference metrics"""
        self.logger.info(
            "AI inference completed",
            ai={
                "model": model,
                "task_type": task_type,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
                "duration_ms": duration_ms,
                "cost_usd": cost_usd,
                "success": success
            },
            **self._sanitize_value(kwargs)
        )

        # Also log as metrics
        self.metric(f"ai.tokens.{model}", prompt_tokens + completion_tokens, "tokens", {"task_type": task_type})
        self.metric(f"ai.duration.{model}", duration_ms, "ms", {"task_type": task_type})
        self.metric(f"ai.cost.{model}", cost_usd, "usd", {"task_type": task_type})

    def performance(self, operation: str):
        """Decorator to measure and log operation performance"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                start_time = time.time()
                success = False
                error = None

                try:
                    result = func(*args, **kwargs)
                    success = True
                    return result
                except Exception as e:
                    error = e
                    raise
                finally:
                    duration = (time.time() - start_time) * 1000  # Convert to ms

                    self.logger.info(
                        f"Operation {operation} completed",
                        operation=operation,
                        duration_ms=duration,
                        success=success,
                        error=str(error) if error else None
                    )

                    self.metric(f"operation.{operation}", duration, "ms", {"success": str(success)})

            return wrapper
        return decorator

    def child(self, component: str, **extra) -> "StructuredLogger":
        """Create a child logger with additional context"""
        child_logger = StructuredLogger(
            service_name=f"{self.service_name}:{component}",
            version=self.version
        )

        # Add extra context to child logger
        child_logger.logger = child_logger.logger.bind(**extra)

        return child_logger

# Singleton instance
_logger_instance: Optional[StructuredLogger] = None

def get_logger(service_name: str = "ai-core", version: str = "1.0.0") -> StructuredLogger:
    """Get or create the logger instance"""
    global _logger_instance

    if _logger_instance is None:
        _logger_instance = StructuredLogger(service_name, version)

    return _logger_instance

def initialize_logger(service_name: str, version: str = "1.0.0") -> StructuredLogger:
    """Initialize the global logger instance"""
    global _logger_instance
    _logger_instance = StructuredLogger(service_name, version)
    return _logger_instance