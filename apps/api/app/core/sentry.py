"""
ComplyArc — Backend Sentry Error Tracking Module
Provides seamless exception capture with graceful fallback when SENTRY_DSN is absent.
"""
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger("complyarc.sentry")

class BackendSentryClient:
    def __init__(self, dsn: Optional[str] = None):
        self.dsn = dsn or settings.SENTRY_DSN
        self.is_enabled = False
        if self.dsn:
            self.init_sentry()

    def init_sentry(self) -> bool:
        if not self.dsn:
            self.is_enabled = False
            return False
        try:
            import sentry_sdk
            sentry_sdk.init(
                dsn=self.dsn,
                environment=settings.ENVIRONMENT,
                traces_sample_rate=0.2 if settings.ENVIRONMENT == "production" else 1.0,
            )
            self.is_enabled = True
            logger.info("sentry_initialized", environment=settings.ENVIRONMENT)
            return True
        except Exception as e:
            logger.warning("sentry_init_failed", error=str(e))
            self.is_enabled = False
            return False

    def capture_exception(self, exc: Exception, context: Optional[Dict[str, Any]] = None) -> Optional[str]:
        if not self.is_enabled:
            return None
        try:
            import sentry_sdk
            with sentry_sdk.push_scope() as scope:
                if context:
                    for k, v in context.items():
                        scope.set_extra(k, v)
                return sentry_sdk.capture_exception(exc)
        except Exception:
            return None


sentry = BackendSentryClient()
