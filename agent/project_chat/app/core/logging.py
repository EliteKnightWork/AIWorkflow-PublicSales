"""
Structured logging configuration for the agent project.
"""

import logging
import logging.config
import sys
from datetime import datetime
import json
from .config import get_config


class StructuredFormatter(logging.Formatter):
    """構造化JSONログ用のカスタムフォーマッター"""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        if hasattr(record, "error_id"):
            log_entry["error_id"] = record.error_id
        if hasattr(record, "error_code"):
            log_entry["error_code"] = record.error_code
        if hasattr(record, "path"):
            log_entry["path"] = record.path
        if hasattr(record, "method"):
            log_entry["method"] = record.method
        if hasattr(record, "client_ip"):
            log_entry["client_ip"] = record.client_ip
        if hasattr(record, "user_agent"):
            log_entry["user_agent"] = record.user_agent
        if hasattr(record, "details"):
            log_entry["details"] = record.details
        if hasattr(record, "traceback"):
            log_entry["traceback"] = record.traceback

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, ensure_ascii=False)


class RequestLoggingFilter(logging.Filter):
    """ログレコードにリクエストコンテキストを追加するフィルター"""

    def filter(self, record: logging.LogRecord) -> bool:
        return True


def setup_logging():
    """構造化ログ設定をセットアップ"""

    config = get_config()

    log_level = getattr(config.server, "log_level", "INFO").upper()

    import os
    log_dir = os.path.dirname(config.server.log_file_path)
    os.makedirs(log_dir, exist_ok=True)

    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "structured": {
                "()": StructuredFormatter,
            },
            "simple": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            },
        },
        "filters": {
            "request_context": {
                "()": RequestLoggingFilter,
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": log_level,
                "formatter": "structured",
                "stream": sys.stdout,
                "filters": ["request_context"],
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": log_level,
                "formatter": "structured",
                "filename": config.server.log_file_path,
                "maxBytes": config.server.log_max_bytes,
                "backupCount": config.server.log_backup_count,
                "filters": ["request_context"],
            },
        },
        "loggers": {
            "": {
                "level": log_level,
                "handlers": ["console"],
                "propagate": False,
            },
            "app": {
                "level": log_level,
                "handlers": ["console", "file"],
                "propagate": False,
            },
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False,
            },
            "fastapi": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False,
            },
        },
    }

    logging.config.dictConfig(logging_config)

    return logging.getLogger("app")


def get_logger(name: str = None) -> logging.Logger:
    if name:
        return logging.getLogger(f"app.{name}")
    return logging.getLogger("app")


class LoggerMixin:
    """任意のクラスにログ機能を追加するミックスインクラス"""

    @property
    def logger(self) -> logging.Logger:
        return get_logger(self.__class__.__name__)


def log_function_call(func_name: str, **kwargs):
    def decorator(func):
        def wrapper(*args, **func_kwargs):
            logger = get_logger(func.__module__)
            logger.info(
                f"Calling {func_name}",
                extra={
                    "function": func_name,
                    "args_count": len(args),
                    "kwargs": func_kwargs,
                },
            )

            try:
                result = func(*args, **func_kwargs)
                logger.info(f"Successfully completed {func_name}")
                return result
            except Exception as e:
                logger.error(
                    f"Error in {func_name}: {str(e)}",
                    extra={
                        "function": func_name,
                        "error": str(e),
                        "error_type": type(e).__name__,
                    },
                )
                raise

        return wrapper

    return decorator


def log_database_operation(operation: str, table: str = None, **kwargs):
    logger = get_logger("database")
    logger.info(
        f"Database operation: {operation}",
        extra={
            "operation": operation,
            "table": table,
            **kwargs,
        },
    )


def log_llm_operation(operation: str, model: str = None, **kwargs):
    logger = get_logger("llm")
    logger.info(
        f"LLM operation: {operation}",
        extra={
            "operation": operation,
            "model": model,
            **kwargs,
        },
    )


def log_auth_operation(operation: str, user_id: str = None, **kwargs):
    logger = get_logger("auth")
    logger.info(
        f"Auth operation: {operation}",
        extra={
            "operation": operation,
            "user_id": user_id,
            **kwargs,
        },
    )


