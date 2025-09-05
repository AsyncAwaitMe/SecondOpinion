"""
Background task to clean up expired OTP codes
"""

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.otp_service import OTPService
import logging

logger = logging.getLogger(__name__)


def cleanup_expired_otps_task():
    """Background task to clean up expired OTP codes"""
    db: Session = SessionLocal()
    try:
        otp_service = OTPService(db)

        expired_count = otp_service.cleanup_expired_otps()

        if expired_count > 0:
            logger.info(f"Cleaned up {expired_count} expired OTP codes")

    except Exception as e:
        logger.error(f"Error cleaning up expired OTPs: {e}")
    finally:
        db.close()
