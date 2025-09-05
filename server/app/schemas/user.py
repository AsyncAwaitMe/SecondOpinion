from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None


class OTPVerification(BaseModel):
    email: EmailStr
    otp_code: str


class OTPRequest(BaseModel):
    email: EmailStr


class RegistrationResponse(BaseModel):
    message: str
    email: str
    requires_verification: bool


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetOTPVerification(BaseModel):
    email: EmailStr
    otp_code: str


class PasswordResetComplete(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str


class UserProfileUpdate(BaseModel):
    full_name: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
