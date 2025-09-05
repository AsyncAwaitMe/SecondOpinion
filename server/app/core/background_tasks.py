"""
Background tasks for email sending and other async operations.
"""

import logging
from typing import Optional

from app.core.email import (
    send_otp_email as _send_otp_email,
    send_password_reset_email as _send_password_reset_email,
)

logger = logging.getLogger(__name__)


def send_otp_email_task(email: str, full_name: str, otp_code: str) -> None:
    """
    Background task for sending OTP emails.

    Args:
        email: Recipient email address
        full_name: User's full name
        otp_code: OTP code to send
    """
    try:
        logger.info(f"Starting background task to send OTP email to {email}")
        success = _send_otp_email(email, full_name, otp_code)

        if success:
            logger.info(f"OTP email sent successfully to {email}")
        else:
            logger.error(f"Failed to send OTP email to {email}")

    except Exception as e:
        logger.error(f"Error in background task sending OTP email to {email}: {str(e)}")


def send_welcome_email_task(email: str, full_name: str) -> None:
    """
    Background task for sending welcome emails after successful verification.

    Args:
        email: User's email address
        full_name: User's full name
    """
    try:
        logger.info(f"Starting background task to send welcome email to {email}")
        from app.core.email import send_welcome_email

        success = send_welcome_email(email, full_name)

        if success:
            logger.info(f"Welcome email sent successfully to {email}")
        else:
            logger.error(f"Failed to send welcome email to {email}")

    except Exception as e:
        logger.error(
            f"Error in background task sending welcome email to {email}: {str(e)}"
        )


def send_password_reset_email_task(email: str, full_name: str, otp_code: str) -> None:
    """
    Background task for sending password reset emails.

    Args:
        email: User's email address
        full_name: User's full name
        otp_code: OTP code for password reset
    """
    try:
        logger.info(f"Starting background task to send password reset email to {email}")
        success = _send_password_reset_email(email, full_name, otp_code)

        if success:
            logger.info(f"Password reset email sent successfully to {email}")
        else:
            logger.error(f"Failed to send password reset email to {email}")

    except Exception as e:
        logger.error(
            f"Error in background task sending password reset email to {email}: {str(e)}"
        )
