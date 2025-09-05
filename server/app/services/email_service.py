import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.smtp_use_tls = os.getenv("SMTP_USE_TLS", "True").lower() == "true"
        
    def send_medical_report_email(
        self,
        doctor_email: str,
        doctor_name: str,
        patient_name: str,
        patient_id: str,
        analysis_result: str,
        confidence: float,
        analysis_date: str,
        findings: List[str],
        recommendations: List[str],
        sender_name: str = "Patient",
        notes: Optional[str] = None,
        pdf_attachment: Optional[bytes] = None,
        pdf_filename: Optional[str] = None
    ) -> bool:
        """
        Send medical report email to a doctor
        """
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.smtp_user
            msg['To'] = doctor_email
            msg['Subject'] = f"Medical Analysis Report - {patient_name} ({patient_id})"
            
            # Create email body
            html_body = self._create_medical_email_template(
                doctor_name=doctor_name,
                patient_name=patient_name,
                patient_id=patient_id,
                analysis_result=analysis_result,
                confidence=confidence,
                analysis_date=analysis_date,
                findings=findings,
                recommendations=recommendations,
                sender_name=sender_name,
                notes=notes
            )
            
            msg.attach(MIMEText(html_body, 'html'))
            
            # Add PDF attachment if provided
            if pdf_attachment and pdf_filename:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(pdf_attachment)
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {pdf_filename}'
                )
                msg.attach(part)
            
            # Send email
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            if self.smtp_use_tls:
                server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            text = msg.as_string()
            server.sendmail(self.smtp_user, doctor_email, text)
            server.quit()
            
            logger.info(f"Medical report email sent successfully to {doctor_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send medical report email: {str(e)}")
            return False
    
    def _create_medical_email_template(
        self,
        doctor_name: str,
        patient_name: str,
        patient_id: str,
        analysis_result: str,
        confidence: float,
        analysis_date: str,
        findings: List[str],
        recommendations: List[str],
        sender_name: str,
        notes: Optional[str] = None
    ) -> str:
        """
        Create professional medical email template
        """
        
        # Determine result color and urgency
        result_color = "#28a745"  # Green for normal
        urgency_level = "Routine"
        
        if any(keyword in analysis_result.lower() for keyword in ["tumor", "glioma", "meningioma", "pituitary"]):
            result_color = "#dc3545"  # Red for abnormal
            urgency_level = "Urgent"
        
        findings_html = "".join([f"<li>{finding}</li>" for finding in findings])
        recommendations_html = "".join([f"<li>{rec}</li>" for rec in recommendations])
        
        notes_section = ""
        if notes:
            notes_section = f"""
            <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px;">
                <h4 style="color: #007bff; margin: 0 0 10px 0;">Additional Notes:</h4>
                <p style="margin: 0; color: #495057;">{notes}</p>
            </div>
            """
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Medical Analysis Report</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 28px;">Medical Analysis Report</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Second Opinion AI Platform</p>
            </div>
            
            <!-- Greeting -->
            <div style="margin-bottom: 25px;">
                <p style="font-size: 16px; margin: 0;">Dear Dr. {doctor_name},</p>
                <p style="margin: 10px 0 0 0; color: #666;">
                    I hope this email finds you well. I am sharing a medical analysis report for your review and professional opinion.
                </p>
            </div>
            
            <!-- Urgency Banner -->
            <div style="background-color: {'#fff5f5' if urgency_level == 'Urgent' else '#f0f9ff'}; border: 1px solid {'#fed7d7' if urgency_level == 'Urgent' else '#bfdbfe'}; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 20px; margin-right: 10px;">{'⚠️' if urgency_level == 'Urgent' else '📋'}</span>
                    <div>
                        <strong style="color: {'#c53030' if urgency_level == 'Urgent' else '#1e40af'};">Priority: {urgency_level}</strong>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
                            {'This case may require immediate attention' if urgency_level == 'Urgent' else 'Standard review timeline applies'}
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Patient Information -->
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #495057; margin: 0 0 15px 0; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">
                    🏥 Patient Information
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <strong>Patient Name:</strong> {patient_name}<br>
                        <strong>Patient ID:</strong> {patient_id}
                    </div>
                    <div>
                        <strong>Analysis Date:</strong> {analysis_date}<br>
                        <strong>Shared by:</strong> {sender_name}
                    </div>
                </div>
            </div>
            
            <!-- Analysis Results -->
            <div style="background-color: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #495057; margin: 0 0 15px 0; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">
                    🔬 AI Analysis Results
                </h3>
                
                <div style="background-color: #f1f3f4; border-left: 4px solid {result_color}; padding: 15px; margin: 15px 0; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: {result_color}; font-size: 18px;">Primary Finding:</h4>
                        <span style="background-color: {result_color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                            {confidence:.1f}% Confidence
                        </span>
                    </div>
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #333;">{analysis_result}</p>
                </div>
            </div>
            
            <!-- Clinical Findings -->
            <div style="background-color: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #495057; margin: 0 0 15px 0; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">
                    📋 Clinical Findings
                </h3>
                <ul style="margin: 0; padding-left: 20px;">
                    {findings_html}
                </ul>
            </div>
            
            <!-- Recommendations -->
            <div style="background-color: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #495057; margin: 0 0 15px 0; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">
                    💡 AI Recommendations
                </h3>
                <ul style="margin: 0; padding-left: 20px;">
                    {recommendations_html}
                </ul>
            </div>
            
            {notes_section}
            
            <!-- Disclaimer -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 25px 0;">
                <h4 style="color: #856404; margin: 0 0 10px 0; display: flex; align-items: center;">
                    ⚠️ Important Medical Disclaimer
                </h4>
                <p style="margin: 0; color: #856404; font-size: 14px;">
                    This AI analysis is provided for supplementary information only and should not replace professional medical judgment. 
                    Please review the findings in conjunction with clinical presentation, patient history, and additional diagnostic information as appropriate.
                </p>
            </div>
            
            <!-- Request for Review -->
            <div style="margin: 25px 0; padding: 20px; background-color: #e7f3ff; border-radius: 8px; border-left: 4px solid #007bff;">
                <h4 style="color: #0056b3; margin: 0 0 10px 0;">Request for Professional Review</h4>
                <p style="margin: 0; color: #004085;">
                    I would greatly appreciate your professional opinion on these findings. If you have any questions or need additional information, 
                    please don't hesitate to contact me. Your expertise and guidance are invaluable in ensuring the best possible care.
                </p>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px; text-align: center; color: #6c757d;">
                <p style="margin: 0; font-size: 14px;">
                    Generated by Second Opinion AI Medical Platform<br>
                    <em>Advanced AI-Assisted Diagnostic Imaging Analysis</em>
                </p>
                <p style="margin: 10px 0 0 0; font-size: 12px;">
                    Report generated on {datetime.now().strftime("%B %d, %Y at %I:%M %p")}
                </p>
            </div>
            
        </body>
        </html>
        """

# Create singleton instance
email_service = EmailService()
