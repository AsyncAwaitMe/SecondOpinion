#!/usr/bin/env python3
"""
Test email service configuration
"""
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the server directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def test_email_config():
    """Test email service configuration"""
    try:
        print("Testing email service configuration...")
        
        # Test environment variables
        smtp_host = os.getenv("SMTP_HOST")
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_port = os.getenv("SMTP_PORT")
        
        print(f"SMTP_HOST: {smtp_host}")
        print(f"SMTP_USER: {smtp_user}")
        print(f"SMTP_PASSWORD: {'*' * len(smtp_password) if smtp_password else 'None'}")
        print(f"SMTP_PORT: {smtp_port}")
        
        if not all([smtp_host, smtp_user, smtp_password]):
            print("❌ Missing SMTP configuration")
            return False
        
        # Test email service import
        from app.services.email_service import email_service
        print("✅ Email service imported successfully")
        
        # Test basic connection (without sending)
        import smtplib
        server = smtplib.SMTP(smtp_host, int(smtp_port))
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.quit()
        print("✅ SMTP connection successful")
        
        return True
        
    except Exception as e:
        print(f"❌ Email service error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Email Service Configuration")
    print("=" * 50)
    
    success = test_email_config()
    
    if success:
        print("\n✅ Email service configuration is working!")
    else:
        print("\n❌ Email service configuration has issues.")
