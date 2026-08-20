"""
ComplyArc — Structured Logging Configuration
Configures structlog for JSON logging in production with safe fallback to stdlib logging.
"""
import logging
import sys
from app.core.config import settings

try:
    import structlog
    HAS_STRUCTLOG = True
except ImportError:
    HAS_STRUCTLOG = False


def configure_logging():
    """Configure structured logging pipeline for ComplyArc."""
    log_level = logging.INFO if not settings.DEBUG else logging.DEBUG

    if HAS_STRUCTLOG:
        try:
            shared_processors = [
                structlog.contextvars.merge_contextvars,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.processors.UnicodeDecoder(),
            ]

            if settings.ENVIRONMENT.lower() == "production":
                processors = shared_processors + [
                    structlog.processors.dict_tracebacks,
                    structlog.processors.JSONRenderer(),
                ]
            else:
                processors = shared_processors + [
                    structlog.dev.ConsoleRenderer(),
                ]

            structlog.configure(
                processors=processors,
                logger_factory=structlog.stdlib.LoggerFactory(),
                wrapper_class=structlog.stdlib.BoundLogger,
                cache_logger_on_first_use=True,
            )
        except Exception:
            pass

    logging.basicConfig(
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stdout,
        level=log_level,
    )


def get_logger(name: str = __name__):
    """Retrieve a structlog bound logger or standard library logger."""
    if HAS_STRUCTLOG:
        try:
            return structlog.get_logger(name)
        except Exception:
            pass
    return logging.getLogger(name)
