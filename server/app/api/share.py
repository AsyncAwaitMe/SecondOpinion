from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import logging

from app.db.session import get_db
from app.db.models import User
from app.api.auth import get_current_user
from app.services.email_service import email_service
from app.services.prediction_service import PredictionService
from app.utils.pdfGenerator import generateMedicalPDF

logger = logging.getLogger(__name__)

router = APIRouter()

class ShareReportRequest(BaseModel):
    prediction_id: int
    doctor_email: EmailStr
    doctor_name: str
    sender_name: Optional[str] = None
    notes: Optional[str] = None
    include_pdf: bool = True

class ShareReportResponse(BaseModel):
    success: bool
    message: str

@router.post("/share-report", response_model=ShareReportResponse)
async def share_medical_report(
    request: ShareReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Share a medical analysis report with a doctor via email
    """
    try:
        logger.info(f"Share request received: {request}")
        logger.info(f"Current user: {current_user.id if current_user else 'None'}")
        
        # Get the prediction result
        prediction = PredictionService.get_prediction_result(db, request.prediction_id)
        logger.info(f"Prediction found: {prediction.id if prediction else 'None'}")
        if not prediction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prediction result not found"
            )
        
        # Check if current user has access to this prediction
        if prediction.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this prediction result"
            )
        
        # Get patient information
        patient = prediction.patient
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient information not found"
            )
        
        # Generate PDF if requested
        pdf_attachment = None
        pdf_filename = None
        
        if request.include_pdf:
            try:
                # Transform prediction data for PDF generation
                result_data = {
                    'prediction': prediction.prediction,
                    'confidence': prediction.confidence,
                    'created_at': prediction.created_at.isoformat() if prediction.created_at else None,
                    'model_type': getattr(prediction, 'model_type', 'unknown'),
                    'notes': prediction.notes,
                    'entropy': getattr(prediction, 'entropy', None),
                    'probabilities': getattr(prediction, 'probabilities', {}),
                    'status': prediction.status,
                }
                
                patient_data = {
                    'full_name': patient.full_name,
                    'date_of_birth': patient.date_of_birth.isoformat() if patient.date_of_birth else None,
                    'gender': patient.gender,
                    'phone': patient.phone,
                    'email': getattr(patient, 'email', None),
                }
                
                pdf_content = generateMedicalPDF(result_data, patient_data)
                pdf_attachment = pdf_content
                pdf_filename = f"medical_report_{patient.full_name.replace(' ', '_')}_{prediction.id}.pdf"
                
            except Exception as pdf_error:
                logger.error(f"Failed to generate PDF: {str(pdf_error)}")
                # Continue without PDF attachment
                pass
        
        # Prepare email data
        findings = _generate_findings_from_prediction(prediction)
        recommendations = _generate_recommendations_from_prediction(prediction)
        
        analysis_date = prediction.created_at.strftime("%B %d, %Y")
        sender_name = request.sender_name or patient.full_name or "Patient"
        
        # Send email
        confidence_value = prediction.confidence
        if confidence_value <= 1:
            confidence_value = confidence_value * 100
            
        email_sent = email_service.send_medical_report_email(
            doctor_email=request.doctor_email,
            doctor_name=request.doctor_name,
            patient_name=patient.full_name,
            patient_id=f"PT-{str(patient.id).zfill(6)}",
            analysis_result=prediction.prediction,
            confidence=confidence_value,
            analysis_date=analysis_date,
            findings=findings,
            recommendations=recommendations,
            sender_name=sender_name,
            notes=request.notes,
            pdf_attachment=pdf_attachment,
            pdf_filename=pdf_filename
        )
        
        if email_sent:
            return ShareReportResponse(
                success=True,
                message=f"Medical report successfully shared with Dr. {request.doctor_name} at {request.doctor_email}"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send email. Please try again later."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sharing report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while sharing the report"
        )

def _generate_findings_from_prediction(prediction) -> List[str]:
    """Generate clinical findings based on prediction result"""
    findings = []
    result = prediction.prediction.lower()
    
    if "normal" in result:
        findings = [
            "No significant abnormalities detected",
            "Normal tissue structure observed",
            "No mass effect or displacement",
            "Clear anatomical boundaries"
        ]
    elif "glioma" in result:
        findings = [
            f"{prediction.prediction} detected",
            "Irregular enhancement pattern observed",
            "Possible infiltrative growth pattern",
            "Requires further neurological evaluation"
        ]
    elif "meningioma" in result:
        findings = [
            f"{prediction.prediction} detected",
            "Extra-axial location characteristics",
            "Well-circumscribed appearance",
            "Dural enhancement pattern typical"
        ]
    elif "pituitary" in result:
        findings = [
            f"{prediction.prediction} detected",
            "Sellar/suprasellar region involvement",
            "Endocrine system evaluation indicated",
            "MRI with contrast recommended"
        ]
    else:
        findings = [
            f"Analysis result: {prediction.prediction}",
            f"Confidence level: {prediction.confidence * 100 if prediction.confidence <= 1 else prediction.confidence:.1f}%",
            "Clinical correlation recommended",
            "Further imaging may be warranted"
        ]
    
    if prediction.notes:
        findings.append(f"Additional notes: {prediction.notes}")
    
    return findings

def _generate_recommendations_from_prediction(prediction) -> List[str]:
    """Generate medical recommendations based on prediction result"""
    recommendations = []
    result = prediction.prediction.lower()
    
    if "normal" in result:
        recommendations = [
            "Continue routine monitoring as clinically indicated",
            "No immediate intervention required",
            "Follow standard surveillance protocols",
            "Consider repeat imaging per clinical guidelines"
        ]
    elif any(term in result for term in ["tumor", "glioma", "meningioma", "pituitary"]):
        recommendations = [
            "Immediate neurology/neurosurgery consultation recommended",
            "Consider multidisciplinary team review",
            "Additional imaging studies may be beneficial",
            "Patient counseling and support services",
            "Coordinate with oncology if malignancy suspected"
        ]
    else:
        recommendations = [
            "Clinical correlation with patient presentation",
            "Consider additional diagnostic workup",
            "Follow-up imaging as clinically appropriate",
            "Refer to appropriate specialist if indicated"
        ]
    
    return recommendations
