from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import logging
import re

from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
)
from app.core.email import generate_otp
from app.core.background_tasks import (
    send_otp_email_task,
    send_welcome_email_task,
    send_password_reset_email_task,
)
from app.db.session import get_db
from app.db.models import User, OTPType
from app.services.otp_service import OTPService
from app.schemas.user import (
    UserCreate,
    UserResponse,
    Token,
    UserLogin,
    OTPVerification,
    OTPRequest,
    RegistrationResponse,
    PasswordResetRequest,
    PasswordResetOTPVerification,
    PasswordResetComplete,
    UserProfileUpdate,
    PasswordChange,
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Configure logger
logger = logging.getLogger(__name__)


def validate_email_format(email: str) -> bool:
    """Validate email format using regex."""
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(email_pattern, email) is not None


def check_password_reset_rate_limit(db: Session, email: str) -> bool:
    """Check if user has requested too many password resets recently."""
    from app.db.models import OTPCode, OTPType

    # Check if user has requested more than 3 password reset OTPs in the last hour
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)

    recent_requests = (
        db.query(OTPCode)
        .join(User, OTPCode.user_id == User.id)
        .filter(
            User.email == email,
            OTPCode.otp_type == OTPType.PASSWORD_RESET,
            OTPCode.created_at >= one_hour_ago,
        )
        .count()
    )

    return recent_requests < 3  # Allow up to 3 requests per hour


def get_user_by_email(db: Session, email: str):
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: UserCreate, background_tasks: BackgroundTasks):
    """Create a new user with OTP verification."""
    # Check if user already exists
    db_user = get_user_by_email(db, user.email)
    if db_user:
        if db_user.is_verified:  # type: ignore
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered and verified",
            )
        else:
            # User exists but not verified, update their info
            db_user.full_name = user.full_name  # type: ignore
            db_user.hashed_password = get_password_hash(user.password)  # type: ignore
    else:
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email,
            full_name=user.full_name,
            hashed_password=hashed_password,
            is_verified=False,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    # Generate and set OTP using OTP service
    otp_service = OTPService(db)
    otp_code = otp_service.create_otp(db_user, OTPType.EMAIL_VERIFICATION)

    # Send OTP email in background
    background_tasks.add_task(
        send_otp_email_task, str(db_user.email), str(db_user.full_name), otp_code
    )

    return db_user


def authenticate_user(db: Session, email: str, password: str):
    """Authenticate user with email and password."""
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not user.is_verified:  # type: ignore
        return False
    if not verify_password(password, str(user.hashed_password)):
        return False
    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    """Get current authenticated user."""
    email = verify_token(token)
    user = get_user_by_email(db, email)
    if user is None or not user.is_verified:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/register", response_model=RegistrationResponse)
def register(
    user: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    """Register a new user and send OTP for verification."""
    db_user = create_user(db, user, background_tasks)
    return RegistrationResponse(
        message="Registration successful. Please check your email for verification code.",
        email=str(db_user.email),
        requires_verification=True,
    )


@router.post("/verify-otp", response_model=Token)
def verify_otp(
    otp_data: OTPVerification,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Verify OTP and complete user registration."""
    user = get_user_by_email(db, otp_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if user.is_verified:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User already verified"
        )

    # Verify OTP using OTP service
    otp_service = OTPService(db)
    if not otp_service.verify_otp(user, otp_data.otp_code, OTPType.EMAIL_VERIFICATION):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code",
        )

    # Verify user
    user.is_verified = True  # type: ignore
    db.commit()

    # Send welcome email in background
    background_tasks.add_task(
        send_welcome_email_task, str(user.email), str(user.full_name)
    )

    # Generate access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.email)}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/resend-otp")
def resend_otp(
    otp_request: OTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Resend OTP to user email."""
    user = get_user_by_email(db, otp_request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if user.is_verified:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User already verified"
        )

    # Generate new OTP using OTP service
    otp_service = OTPService(db)
    otp_code = otp_service.create_otp(user, OTPType.EMAIL_VERIFICATION)

    # Send OTP email in background
    background_tasks.add_task(
        send_otp_email_task, str(user.email), str(user.full_name), otp_code
    )

    return {"message": "OTP sent successfully"}


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """Authenticate user and return access token."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password, or account not verified",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.email)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login-json", response_model=Token)
def login_json(user_login: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with JSON payload and return access token."""
    user = authenticate_user(db, user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password, or account not verified",
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.email)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.get("/verify-token")
async def verify_user_token(current_user: User = Depends(get_current_user)):
    """Verify if token is valid."""
    return {
        "valid": True,
        "user": {
            "email": str(current_user.email),
            "full_name": str(current_user.full_name),
        },
    }


@router.post("/forgot-password")
def forgot_password(
    password_reset_request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Send password reset OTP to user email."""

    try:
        # Validate email format
        if not validate_email_format(password_reset_request.email):
            logger.warning(
                f"Password reset attempted with invalid email format: {password_reset_request.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format"
            )

        # Check rate limiting
        if not check_password_reset_rate_limit(db, password_reset_request.email):
            logger.warning(
                f"Rate limit exceeded for password reset: {password_reset_request.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many reset requests. Please try again later.",
            )

        # Check if user exists in database
        user = get_user_by_email(db, password_reset_request.email)
        if not user:
            # Log the attempt for security monitoring
            logger.warning(
                f"Password reset attempted for non-existent email: {password_reset_request.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Email address not found"
            )

        # Check if user account is verified
        if not user.is_verified:  # type: ignore
            # Log the attempt for security monitoring
            logger.warning(
                f"Password reset attempted for unverified user: {password_reset_request.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account not verified",
            )

        # Generate new OTP for password reset using OTP service
        otp_service = OTPService(db)
        otp_code = otp_service.create_otp(user, OTPType.PASSWORD_RESET)

        # Send password reset OTP email in background
        background_tasks.add_task(
            send_password_reset_email_task,
            str(user.email),
            str(user.full_name),
            otp_code,
        )

        # Log successful OTP generation
        logger.info(f"Password reset OTP generated for user: {user.email}")

        return {"message": "Reset code has been sent to your email"}

    except HTTPException:
        raise
    except Exception as e:
        # Log the error but don't reveal it to the user
        logger.error(f"Error in forgot password process: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request",
        )


@router.post("/verify-reset-otp")
def verify_password_reset_otp(
    otp_data: PasswordResetOTPVerification,
    db: Session = Depends(get_db),
):
    """Verify password reset OTP."""
    try:
        # Check if user exists in database
        user = get_user_by_email(db, otp_data.email)
        if not user:
            logger.warning(
                f"OTP verification attempted for non-existent email: {otp_data.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Check if user account is verified
        if not user.is_verified:  # type: ignore
            logger.warning(
                f"OTP verification attempted for unverified user: {otp_data.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account not verified",
            )

        # Verify OTP using OTP service (but don't consume it yet)
        otp_service = OTPService(db)
        if not otp_service.is_otp_valid(
            user, otp_data.otp_code, OTPType.PASSWORD_RESET
        ):
            logger.warning(
                f"Invalid OTP verification attempt for user: {otp_data.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP code",
            )

        logger.info(f"OTP verified successfully for user: {user.email}")
        return {"message": "OTP verified successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in OTP verification process: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during verification",
        )


@router.post("/reset-password")
def reset_password(
    password_reset_data: PasswordResetComplete,
    db: Session = Depends(get_db),
):
    """Reset user password with verified OTP."""
    try:
        # Check if user exists in database
        user = get_user_by_email(db, password_reset_data.email)
        if not user:
            logger.warning(
                f"Password reset attempted for non-existent email: {password_reset_data.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Check if user account is verified
        if not user.is_verified:  # type: ignore
            logger.warning(
                f"Password reset attempted for unverified user: {password_reset_data.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account not verified",
            )

        # Verify and consume OTP using OTP service
        otp_service = OTPService(db)
        if not otp_service.verify_otp(
            user, password_reset_data.otp_code, OTPType.PASSWORD_RESET
        ):
            logger.warning(
                f"Invalid OTP used for password reset: {password_reset_data.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP code",
            )

        # Update password
        user.hashed_password = get_password_hash(password_reset_data.new_password)  # type: ignore
        db.commit()

        logger.info(f"Password reset completed successfully for user: {user.email}")
        return {"message": "Password reset successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in password reset process: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during password reset",
        )


@router.post("/resend-reset-otp")
def resend_password_reset_otp(
    otp_request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Resend password reset OTP to user email."""

    try:
        # Check if user exists in database
        user = get_user_by_email(db, otp_request.email)
        if not user:
            logger.warning(
                f"OTP resend attempted for non-existent email: {otp_request.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Email address not found"
            )

        # Check if user account is verified
        if not user.is_verified:  # type: ignore
            logger.warning(
                f"OTP resend attempted for unverified user: {otp_request.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account not verified",
            )

        # Generate new OTP for password reset using OTP service
        otp_service = OTPService(db)
        otp_code = otp_service.create_otp(user, OTPType.PASSWORD_RESET)

        # Send password reset OTP email in background
        background_tasks.add_task(
            send_password_reset_email_task,
            str(user.email),
            str(user.full_name),
            otp_code,
        )

        logger.info(f"Password reset OTP resent for user: {user.email}")
        return {"message": "Reset code has been sent to your email"}

    except HTTPException:
        raise
    except Exception as e:
        # Log the error but don't reveal it to the user
        logger.error(f"Error in resend OTP process: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request",
        )


@router.put("/update-profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user profile information."""
    try:
        # Update user information
        current_user.full_name = profile_data.full_name  # type: ignore

        db.commit()
        db.refresh(current_user)

        logger.info(f"Profile updated successfully for user: {current_user.email}")
        return current_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating profile",
        )


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change user password."""
    try:
        # Verify current password
        if not verify_password(password_data.current_password, str(current_user.hashed_password)):  # type: ignore
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        # Check if new password is different from current
        if verify_password(password_data.new_password, str(current_user.hashed_password)):  # type: ignore
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password",
            )

        # Update password
        current_user.hashed_password = get_password_hash(password_data.new_password)  # type: ignore
        db.commit()

        logger.info(f"Password changed successfully for user: {current_user.email}")
        return {"message": "Password changed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while changing password",
        )
