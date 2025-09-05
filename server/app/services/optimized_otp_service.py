"""
Enhanced OTP Service with performance optimizations
"""

from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
import logging

from app.db.models import User, OTPCode, OTPType
from app.core.email import generate_otp

logger = logging.getLogger(__name__)


class OptimizedOTPService:
    """Enhanced OTP Service with database optimizations"""

    def __init__(self, db: Session):
        self.db = db

    def create_otp(
        self, user: User, otp_type: OTPType, expires_in_minutes: int = 10
    ) -> str:
        """Create a new OTP with batch optimization"""
        user_id = int(user.id)  # type: ignore

        # Generate new OTP
        otp_code = generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=expires_in_minutes)

        try:
            # Deactivate existing OTPs and create new one in single transaction
            self._deactivate_existing_otps(user_id, otp_type)

            # Create new OTP record
            db_otp = OTPCode(
                user_id=user_id,
                otp_code=otp_code,
                otp_type=otp_type,
                expires_at=expires_at,
            )

            self.db.add(db_otp)
            self.db.commit()
            logger.debug(f"OTP created for user {user_id}, type: {otp_type.value}")

        except Exception as e:
            logger.error(f"Database error creating OTP: {e}")
            self.db.rollback()
            raise

        return otp_code

    def verify_otp(self, user: User, otp_code: str, otp_type: OTPType) -> bool:
        """Verify OTP with optimized database query"""
        user_id = int(user.id)  # type: ignore

        return self._verify_otp_from_db(user_id, otp_code, otp_type)

    def is_otp_valid(self, user: User, otp_code: str, otp_type: OTPType) -> bool:
        """Check if an OTP is valid without marking it as used"""
        user_id = int(user.id)  # type: ignore

        db_otp = (
            self.db.query(OTPCode)
            .filter(
                OTPCode.user_id == user_id,
                OTPCode.otp_code == otp_code,
                OTPCode.otp_type == otp_type,
                OTPCode.expires_at > datetime.utcnow(),
            )
            .order_by(OTPCode.created_at.desc())
            .first()
        )

        return db_otp is not None

    def _verify_otp_from_db(
        self, user_id: int, otp_code: str, otp_type: OTPType
    ) -> bool:
        """Database-based OTP verification with transaction safety and deletion after success"""
        try:
            db_otp = (
                self.db.query(OTPCode)
                .filter(
                    OTPCode.user_id == user_id,
                    OTPCode.otp_code == otp_code,
                    OTPCode.otp_type == otp_type,
                    OTPCode.expires_at > datetime.utcnow(),
                )
                .order_by(OTPCode.created_at.desc())
                .first()
            )

            if not db_otp:
                return False

            # Delete the OTP record after successful verification
            self.db.delete(db_otp)
            self.db.commit()
            logger.debug(f"OTP verified and deleted for user {user_id}")

            return True

        except Exception as e:
            logger.error(f"Error verifying OTP: {e}")
            self.db.rollback()
            return False

    def _deactivate_existing_otps(self, user_id: int, otp_type: OTPType) -> None:
        """Delete existing active OTPs (batch operation)"""
        try:
            affected_rows = (
                self.db.query(OTPCode)
                .filter(
                    OTPCode.user_id == user_id,
                    OTPCode.otp_type == otp_type,
                )
                .delete()
            )

            if affected_rows > 0:
                logger.debug(
                    f"Deleted {affected_rows} existing OTPs for user {user_id}"
                )

        except Exception as e:
            logger.error(f"Error deleting existing OTPs: {e}")
            raise

    def cleanup_expired_otps(self) -> int:
        """Clean up expired OTP codes with batch operation"""
        try:
            expired_count = (
                self.db.query(OTPCode)
                .filter(OTPCode.expires_at <= datetime.utcnow())
                .count()
            )

            if expired_count > 0:
                # Delete expired OTPs
                self.db.query(OTPCode).filter(
                    OTPCode.expires_at <= datetime.utcnow()
                ).delete()

                self.db.commit()
                logger.info(f"Cleaned up {expired_count} expired OTP codes")

            return expired_count

        except Exception as e:
            logger.error(f"Error cleaning up expired OTPs: {e}")
            self.db.rollback()
            return 0

    def cleanup_old_used_otps(self, days_old: int = 7) -> int:
        """Clean up old OTP codes (batch operation)"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)

            old_otps_count = (
                self.db.query(OTPCode).filter(OTPCode.created_at < cutoff_date).count()
            )

            if old_otps_count > 0:
                # Delete old OTPs
                self.db.query(OTPCode).filter(OTPCode.created_at < cutoff_date).delete()

                self.db.commit()
                logger.info(f"Cleaned up {old_otps_count} old OTP codes")

            return old_otps_count

        except Exception as e:
            logger.error(f"Error cleaning up old OTPs: {e}")
            self.db.rollback()
            return 0

    def get_otp_stats(self, days: int = 7) -> dict:
        """Get OTP usage statistics for monitoring"""
        try:
            since_date = datetime.utcnow() - timedelta(days=days)

            stats = {
                "total_generated": self.db.query(OTPCode)
                .filter(OTPCode.created_at >= since_date)
                .count(),
                "email_verification": self.db.query(OTPCode)
                .filter(
                    OTPCode.created_at >= since_date,
                    OTPCode.otp_type == OTPType.EMAIL_VERIFICATION,
                )
                .count(),
                "password_reset": self.db.query(OTPCode)
                .filter(
                    OTPCode.created_at >= since_date,
                    OTPCode.otp_type == OTPType.PASSWORD_RESET,
                )
                .count(),
                "active_otps": self._get_active_otps_count(),
                "expired_otps": self._get_expired_otps_count(),
            }

            return stats

        except Exception as e:
            logger.error(f"Error getting OTP statistics: {e}")
            return {}

    def _get_active_otps_count(self) -> int:
        """Get count of currently active OTPs"""
        try:
            return (
                self.db.query(OTPCode)
                .filter(OTPCode.expires_at > datetime.utcnow())
                .count()
            )
        except Exception as e:
            logger.error(f"Error getting active OTPs count: {e}")
            return 0

    def _get_expired_otps_count(self) -> int:
        """Get count of expired OTPs"""
        try:
            return (
                self.db.query(OTPCode)
                .filter(OTPCode.expires_at <= datetime.utcnow())
                .count()
            )
        except Exception as e:
            logger.error(f"Error getting expired OTPs count: {e}")
            return 0

    def get_user_active_otps(
        self, user: User, otp_type: Optional[OTPType] = None
    ) -> list:
        """Get active OTPs for a user"""
        try:
            query = self.db.query(OTPCode).filter(
                OTPCode.user_id == user.id,
                OTPCode.expires_at > datetime.utcnow(),
            )

            if otp_type:
                query = query.filter(OTPCode.otp_type == otp_type)

            return query.order_by(OTPCode.created_at.desc()).all()

        except Exception as e:
            logger.error(f"Error getting user active OTPs: {e}")
            return []
