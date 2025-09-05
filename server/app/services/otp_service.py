"""
OTP Service for handling OTP operations separately from user data
"""

from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from app.db.models import User, OTPCode, OTPType
from app.core.email import generate_otp


class OTPService:
    """Service to handle OTP operations"""

    def __init__(self, db: Session):
        self.db = db

    def create_otp(
        self, user: User, otp_type: OTPType, expires_in_minutes: int = 10
    ) -> str:
        """Create a new OTP for the user"""
        # First, delete any existing active OTPs of the same type
        self._deactivate_existing_otps(user.id, otp_type)  # type: ignore

        # Generate new OTP
        otp_code = generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=expires_in_minutes)

        # Create new OTP record
        db_otp = OTPCode(
            user_id=user.id,  # type: ignore
            otp_code=otp_code,
            otp_type=otp_type,
            expires_at=expires_at,
        )

        self.db.add(db_otp)
        self.db.commit()
        self.db.refresh(db_otp)

        return otp_code

    def verify_otp(self, user: User, otp_code: str, otp_type: OTPType) -> bool:
        """Verify an OTP code for the user and delete it after successful verification"""
        # Find the most recent active OTP of the specified type
        db_otp = (
            self.db.query(OTPCode)
            .filter(
                OTPCode.user_id == user.id,
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

        return True

    def is_otp_valid(self, user: User, otp_code: str, otp_type: OTPType) -> bool:
        """Check if an OTP is valid without marking it as used"""
        db_otp = (
            self.db.query(OTPCode)
            .filter(
                OTPCode.user_id == user.id,
                OTPCode.otp_code == otp_code,
                OTPCode.otp_type == otp_type,
                OTPCode.expires_at > datetime.utcnow(),
            )
            .order_by(OTPCode.created_at.desc())
            .first()
        )

        return db_otp is not None

    def cleanup_expired_otps(self) -> int:
        """Clean up expired OTP codes"""
        expired_count = (
            self.db.query(OTPCode)
            .filter(OTPCode.expires_at <= datetime.utcnow())
            .count()
        )

        # Delete expired OTPs
        self.db.query(OTPCode).filter(OTPCode.expires_at <= datetime.utcnow()).delete()

        self.db.commit()
        return expired_count

    def cleanup_old_used_otps(self, days_old: int = 7) -> int:
        """Clean up old OTP codes (default: older than 7 days)"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        old_otps_count = (
            self.db.query(OTPCode).filter(OTPCode.created_at < cutoff_date).count()
        )

        # Delete old OTPs
        self.db.query(OTPCode).filter(OTPCode.created_at < cutoff_date).delete()

        self.db.commit()
        return old_otps_count

    def get_otp_statistics(self) -> dict:
        """Get statistics about OTP usage"""
        total_otps = self.db.query(OTPCode).count()
        active_otps = (
            self.db.query(OTPCode)
            .filter(OTPCode.expires_at > datetime.utcnow())
            .count()
        )
        expired_otps = (
            self.db.query(OTPCode)
            .filter(OTPCode.expires_at <= datetime.utcnow())
            .count()
        )

        return {
            "total_otps": total_otps,
            "active_otps": active_otps,
            "expired_otps": expired_otps,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _deactivate_existing_otps(self, user_id: int, otp_type: OTPType) -> None:
        """Delete existing active OTPs of the same type"""
        self.db.query(OTPCode).filter(
            OTPCode.user_id == user_id,
            OTPCode.otp_type == otp_type,
        ).delete()

        self.db.commit()

    def get_user_active_otps(
        self, user: User, otp_type: Optional[OTPType] = None
    ) -> list:
        """Get active OTPs for a user"""
        query = self.db.query(OTPCode).filter(
            OTPCode.user_id == user.id,
            OTPCode.expires_at > datetime.utcnow(),
        )

        if otp_type:
            query = query.filter(OTPCode.otp_type == otp_type)

        return query.order_by(OTPCode.created_at.desc()).all()
