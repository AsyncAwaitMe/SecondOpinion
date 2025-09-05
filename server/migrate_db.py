"""
Migration script to update database schema with new OTP table
This removes OTP fields from User table and creates a separate OTP table
"""

import os
import sys

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import Base
from app.db.session import engine
from app.db.models import User, Patient, PredictionResult, OTPCode


def recreate_database():
    """Recreate all database tables"""
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)

    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)

    print("Database migration completed successfully!")
    print("Changes made:")
    print("- Removed otp_code and otp_expires_at columns from users table")
    print("- Created new otp_codes table for separate OTP management")
    print("- Removed is_used column from otp_codes table (OTPs are deleted after use)")
    print(
        "- OTP table supports different OTP types (email verification, password reset)"
    )


if __name__ == "__main__":
    recreate_database()
