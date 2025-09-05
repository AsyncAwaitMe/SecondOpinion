"""
Scheduled OTP cleanup service with automatic background execution
"""

import asyncio
from datetime import datetime, timedelta
import logging
from typing import Optional

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.otp_service import OTPService

logger = logging.getLogger(__name__)


class OTPCleanupScheduler:
    """Scheduled service to automatically clean up expired OTPs"""

    def __init__(self, cleanup_interval_hours: int = 1):
        self.cleanup_interval_hours = cleanup_interval_hours
        self.is_running = False
        self._task: Optional[asyncio.Task] = None

    async def start_scheduler(self):
        """Start the automatic cleanup scheduler"""
        if self.is_running:
            logger.warning("OTP cleanup scheduler is already running")
            return

        self.is_running = True
        self._task = asyncio.create_task(self._cleanup_loop())
        logger.info(
            f"OTP cleanup scheduler started (interval: {self.cleanup_interval_hours}h)"
        )

    async def stop_scheduler(self):
        """Stop the automatic cleanup scheduler"""
        if not self.is_running:
            return

        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

        logger.info("OTP cleanup scheduler stopped")

    async def _cleanup_loop(self):
        """Main cleanup loop that runs periodically"""
        while self.is_running:
            try:
                await self._perform_cleanup()
                # Wait for the next cleanup interval
                await asyncio.sleep(
                    self.cleanup_interval_hours * 3600
                )  # Convert hours to seconds

            except asyncio.CancelledError:
                logger.info("OTP cleanup loop cancelled")
                break
            except Exception as e:
                logger.error(f"Error in OTP cleanup loop: {e}")
                # Wait a bit before retrying to avoid rapid failures
                await asyncio.sleep(300)  # 5 minutes

    async def _perform_cleanup(self):
        """Perform the actual cleanup operation"""
        db: Session = SessionLocal()
        try:
            otp_service = OTPService(db)

            # Clean up expired OTPs
            expired_count = otp_service.cleanup_expired_otps()

            # Also clean up old OTPs (older than 7 days)
            old_otps_count = self._cleanup_old_used_otps(db)

            total_cleaned = expired_count + old_otps_count

            if total_cleaned > 0:
                logger.info(
                    f"Cleaned up {expired_count} expired and {old_otps_count} old OTP codes"
                )
            else:
                logger.debug("No OTP codes needed cleanup")

        except Exception as e:
            logger.error(f"Error during OTP cleanup: {e}")
        finally:
            db.close()

    def _cleanup_old_used_otps(self, db: Session) -> int:
        """Clean up old OTP codes (older than 7 days)"""
        from app.db.models import OTPCode

        cutoff_date = datetime.utcnow() - timedelta(days=7)

        old_otps_count = (
            db.query(OTPCode).filter(OTPCode.created_at < cutoff_date).count()
        )

        # Delete old OTPs
        db.query(OTPCode).filter(OTPCode.created_at < cutoff_date).delete()

        db.commit()
        return old_otps_count

    async def manual_cleanup(self) -> dict:
        """Manually trigger cleanup and return results"""
        db: Session = SessionLocal()
        try:
            otp_service = OTPService(db)

            expired_count = otp_service.cleanup_expired_otps()
            old_otps_count = self._cleanup_old_used_otps(db)

            result = {
                "expired_cleaned": expired_count,
                "old_otps_cleaned": old_otps_count,
                "total_cleaned": expired_count + old_otps_count,
                "timestamp": datetime.utcnow().isoformat(),
            }

            logger.info(f"Manual cleanup completed: {result}")
            return result

        except Exception as e:
            logger.error(f"Error during manual cleanup: {e}")
            raise
        finally:
            db.close()


# Global instance
otp_cleanup_scheduler = OTPCleanupScheduler(cleanup_interval_hours=1)


async def start_otp_cleanup_service():
    """Start the OTP cleanup service"""
    await otp_cleanup_scheduler.start_scheduler()


async def stop_otp_cleanup_service():
    """Stop the OTP cleanup service"""
    await otp_cleanup_scheduler.stop_scheduler()


async def manual_otp_cleanup():
    """Manually trigger OTP cleanup"""
    return await otp_cleanup_scheduler.manual_cleanup()
