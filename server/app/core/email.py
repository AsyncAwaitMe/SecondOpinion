import smtplib
import random
import string
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings


def generate_otp() -> str:
    """Generate a 6-digit OTP code."""
    return "".join(random.choices(string.digits, k=6))


def create_otp_email_content(full_name: str, otp_code: str) -> str:
    """Create OTP email content."""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #0070c0, #c00000);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 10px 10px;
                border: 1px solid #e9ecef;
            }}
            .otp-code {{
                background: #007bff;
                color: white;
                padding: 15px 30px;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                border-radius: 8px;
                margin: 20px 0;
                letter-spacing: 4px;
            }}
            .footer {{
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Second Opinion</h1>
            <p>Email Verification</p>
        </div>
        <div class="content">
            <h2>Welcome, {full_name}!</h2>
            <p>Thank you for signing up with Second Opinion. To complete your registration, please verify your email address using the OTP code below:</p>
            
            <div class="otp-code">
                {otp_code}
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
                <li>This OTP is valid for 10 minutes only</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't create an account, please ignore this email</li>
            </ul>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>The Second Opinion Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </body>
    </html>
    """
    return html_content


def create_password_reset_email_content(full_name: str, otp_code: str) -> str:
    """Create password reset email content."""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #0070c0, #c00000);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 10px 10px;
                border: 1px solid #e9ecef;
            }}
            .otp-code {{
                background: #dc3545;
                color: white;
                padding: 15px 30px;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                border-radius: 8px;
                margin: 20px 0;
                letter-spacing: 4px;
            }}
            .footer {{
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Second Opinion</h1>
            <p>Password Reset Request</p>
        </div>
        <div class="content">
            <h2>Hello, {full_name}!</h2>
            <p>We received a request to reset your password for your Second Opinion account. Use the verification code below to proceed with resetting your password:</p>
            
            <div class="otp-code">
                {otp_code}
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
                <li>This code is valid for 10 minutes only</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request a password reset, please ignore this email</li>
                <li>Your account will remain secure and unchanged</li>
            </ul>
            
            <p>If you have any questions or concerns, please contact our support team immediately.</p>
            
            <p>Best regards,<br>The Second Opinion Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </body>
    </html>
    """
    return html_content


def send_password_reset_email(email: str, full_name: str, otp_code: str) -> bool:
    """Send password reset OTP email to user."""
    try:
        # Check if SMTP is properly configured
        if (
            not settings.SMTP_HOST
            or not settings.SMTP_USER
            or not settings.SMTP_PASSWORD
        ):
            # For development - just print the OTP
            print(f"=== PASSWORD RESET EMAIL SIMULATION ===")
            print(f"To: {email}")
            print(f"Subject: Second Opinion - Password Reset Code")
            print(f"OTP Code: {otp_code}")
            print(f"Full Name: {full_name}")
            print(f"=======================================")
            return True

        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Second Opinion - Password Reset Code"
        msg["From"] = settings.SMTP_USER
        msg["To"] = email

        # Create HTML content
        html_content = create_password_reset_email_content(full_name, otp_code)

        # Create plain text version
        text_content = f"""
        Hello {full_name},
        
        We received a request to reset your password for your Second Opinion account.
        
        Your password reset code is: {otp_code}
        
        This code is valid for 10 minutes only.
        
        If you didn't request a password reset, please ignore this email.
        
        Best regards,
        The Second Opinion Team
        """

        # Attach parts
        text_part = MIMEText(text_content, "plain")
        html_part = MIMEText(html_content, "html")

        msg.attach(text_part)
        msg.attach(html_part)

        # Send email
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        print(f"Password reset email sent successfully to {email}")
        return True

    except Exception as e:
        # Log error but don't fail the process in background tasks
        import logging

        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send password reset email to {email}: {e}")

        # Fallback to console output for development
        print(f"Failed to send password reset email (using console fallback): {e}")
        print(f"=== PASSWORD RESET EMAIL FALLBACK ===")
        print(f"To: {email}")
        print(f"Subject: Second Opinion - Password Reset Code")
        print(f"OTP Code: {otp_code}")
        print(f"Full Name: {full_name}")
        print(f"=====================================")
        return True  # Return True so the flow continues


def send_otp_email(email: str, full_name: str, otp_code: str) -> bool:
    try:
        # Check if SMTP is properly configured
        if (
            not settings.SMTP_HOST
            or not settings.SMTP_USER
            or not settings.SMTP_PASSWORD
        ):
            # For development - just print the OTP
            print(f"=== EMAIL SIMULATION (No SMTP Config) ===")
            print(f"To: {email}")
            print(f"Subject: Second Opinion - Email Verification Code")
            print(f"OTP Code: {otp_code}")
            print(f"Full Name: {full_name}")
            print(f"========================================")
            return True

        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Second Opinion - Email Verification Code"
        msg["From"] = settings.SMTP_USER
        msg["To"] = email

        # Create HTML content
        html_content = create_otp_email_content(full_name, otp_code)

        # Create plain text version
        text_content = f"""
        Welcome to Second Opinion, {full_name}!
        
        Your verification code is: {otp_code}
        
        This code is valid for 10 minutes only.
        
        If you didn't create an account, please ignore this email.
        
        Best regards,
        The Second Opinion Team
        """

        # Attach parts
        text_part = MIMEText(text_content, "plain")
        html_part = MIMEText(html_content, "html")

        msg.attach(text_part)
        msg.attach(html_part)

        # Send email
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        print(f"OTP email sent successfully to {email}")
        return True

    except Exception as e:
        # Log error but don't fail the process in background tasks
        import logging

        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send email to {email}: {e}")

        # Fallback to console output for development
        print(f"Failed to send email (using console fallback): {e}")
        print(f"=== EMAIL FALLBACK ===")
        print(f"To: {email}")
        print(f"Subject: Second Opinion - Email Verification Code")
        print(f"OTP Code: {otp_code}")
        print(f"Full Name: {full_name}")
        print(f"===================")
        return True  # Return True so the flow continues


def get_otp_expiry_time() -> datetime:
    """Get OTP expiry time (10 minutes from now)."""
    return datetime.utcnow() + timedelta(minutes=10)


def is_otp_expired(expiry_time: Optional[datetime]) -> bool:
    """Check if OTP has expired."""
    if not expiry_time:
        return True
    return datetime.utcnow() > expiry_time


def send_welcome_email(email: str, fullname: str):
    """Send a welcome email to a new user."""
    try:
        # Check if SMTP is properly configured
        if (
            not settings.SMTP_HOST
            or not settings.SMTP_USER
            or not settings.SMTP_PASSWORD
        ):
            # For development - just print the welcome message
            print(f"=== WELCOME EMAIL SIMULATION ===")
            print(f"To: {email}")
            print(f"Subject: Second Opinion - Welcome!")
            print(f"Full Name: {fullname}")
            print(f"Welcome to Second Opinion! We're excited to have you on board.")
            print(f"================================")
            return True

        # Create message
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.SMTP_USER
        msg["To"] = email
        msg["Subject"] = "Second Opinion - Welcome!"

        # Create HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #0070c0, #c00000);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: #f8f9fa;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                    border: 1px solid #e9ecef;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    font-size: 12px;
                    color: #666;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Second Opinion</h1>
                <p>Welcome!</p>
            </div>
            <div class="content">
                <h2>Hello, {fullname}!</h2>
                <p>Welcome to <strong>Second Opinion</strong>! We're excited to have you join our community.</p>
                <p>With Second Opinion, you can get fast, reliable, and secure medical image analysis powered by AI. Explore our platform and discover how we can help you get a second opinion on your medical images.</p>
                <p>If you have any questions or need assistance, feel free to contact our support team.</p>
                <p>Best regards,<br>The Second Opinion Team</p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
            </div>
        </body>
        </html>
        """

        # Create plain text version
        text_content = f"""
        Hello {fullname},

        Welcome to Second Opinion! We're excited to have you join our community.

        With Second Opinion, you can get fast, reliable, and secure medical image analysis powered by AI. Explore our platform and discover how we can help you get a second opinion on your medical images.

        If you have any questions or need assistance, feel free to contact our support team.

        Best regards,
        The Second Opinion Team
        """

        # Attach parts
        text_part = MIMEText(text_content, "plain")
        html_part = MIMEText(html_content, "html")
        msg.attach(text_part)
        msg.attach(html_part)

        # Send email
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        print(f"Welcome email sent successfully to {email}")
        return True

    except Exception as e:
        # Log error but don't fail the process in background tasks
        import logging

        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send welcome email to {email}: {e}")

        # Fallback to console output for development
        print(f"Failed to send welcome email (using console fallback): {e}")
        print(f"=== WELCOME EMAIL FALLBACK ===")
        print(f"To: {email}")
        print(f"Subject: Second Opinion - Welcome!")
        print(f"Full Name: {fullname}")
        print(f"Welcome to Second Opinion! We're excited to have you on board.")
        print(f"================================")
        return True
