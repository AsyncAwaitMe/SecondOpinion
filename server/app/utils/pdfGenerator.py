"""
PDF generation utilities for medical reports
"""
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.colors import HexColor, black, blue, green, red
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from io import BytesIO
import os
from datetime import datetime
from typing import Dict, List, Optional, Any


def generateMedicalPDF(result_data: Dict[str, Any], patient_data: Dict[str, Any]) -> bytes:
    """
    Generate a professional medical report PDF
    
    Args:
        result_data: Analysis result data
        patient_data: Patient information
        
    Returns:
        bytes: PDF file content
    """
    buffer = BytesIO()
    
    # Create the PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Container for the 'Flowable' objects
    story = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=18,
        spaceAfter=30,
        textColor=HexColor('#1a365d'),
        alignment=1  # Center alignment
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        textColor=HexColor('#2d3748'),
        borderWidth=1,
        borderColor=HexColor('#e2e8f0'),
        borderPadding=8,
        backColor=HexColor('#f7fafc')
    )
    
    normal_style = styles['Normal']
    normal_style.fontSize = 11
    normal_style.spaceAfter = 6
    
    # Title
    story.append(Paragraph("MEDICAL ANALYSIS REPORT", title_style))
    story.append(Spacer(1, 20))
    
    # Patient Information Section
    story.append(Paragraph("PATIENT INFORMATION", heading_style))
    
    patient_info = [
        ['Patient Name:', patient_data.get('full_name', 'N/A')],
        ['Date of Birth:', patient_data.get('date_of_birth', 'N/A')],
        ['Gender:', patient_data.get('gender', 'N/A')],
        ['Phone:', patient_data.get('phone', 'N/A')],
        ['Email:', patient_data.get('email', 'N/A')],
    ]
    
    patient_table = Table(patient_info, colWidths=[2*inch, 4*inch])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), HexColor('#edf2f7')),
        ('TEXTCOLOR', (0, 0), (-1, -1), black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#e2e8f0'))
    ]))
    
    story.append(patient_table)
    story.append(Spacer(1, 20))
    
    # Analysis Results Section
    story.append(Paragraph("ANALYSIS RESULTS", heading_style))
    
    analysis_info = [
        ['Analysis Type:', get_analysis_type_display(result_data.get('model_type', 'unknown'))],
        ['Result:', result_data.get('prediction', 'N/A')],
        ['Confidence Score:', f"{(result_data.get('confidence', 0) * 100):.1f}%"],
        ['Analysis Date:', format_datetime(result_data.get('created_at'))],
        ['Model Used:', get_model_name(result_data.get('model_type', 'unknown'))],
        ['Status:', result_data.get('status', 'Completed').title()],
    ]
    
    if result_data.get('entropy'):
        analysis_info.append(['Entropy Score:', f"{result_data.get('entropy'):.3f}"])
    
    analysis_table = Table(analysis_info, colWidths=[2*inch, 4*inch])
    analysis_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), HexColor('#edf2f7')),
        ('TEXTCOLOR', (0, 0), (-1, -1), black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#e2e8f0'))
    ]))
    
    story.append(analysis_table)
    story.append(Spacer(1, 20))
    
    # Clinical Findings Section
    story.append(Paragraph("CLINICAL FINDINGS", heading_style))
    
    findings = generate_findings(result_data)
    for i, finding in enumerate(findings, 1):
        finding_text = f"{i}. {finding}"
        story.append(Paragraph(finding_text, normal_style))
    
    story.append(Spacer(1, 20))
    
    # Medical Recommendations Section
    story.append(Paragraph("MEDICAL RECOMMENDATIONS", heading_style))
    
    recommendations = generate_recommendations(result_data)
    for i, rec in enumerate(recommendations, 1):
        rec_text = f"{i}. {rec}"
        story.append(Paragraph(rec_text, normal_style))
    
    story.append(Spacer(1, 20))
    
    # Additional Notes
    if result_data.get('notes'):
        story.append(Paragraph("ADDITIONAL NOTES", heading_style))
        story.append(Paragraph(result_data['notes'], normal_style))
        story.append(Spacer(1, 20))
    
    # Disclaimer
    story.append(Paragraph("IMPORTANT MEDICAL NOTICE", heading_style))
    disclaimer_text = """
    This AI analysis is designed to assist healthcare professionals and should not replace 
    professional medical diagnosis. Please consult with a qualified healthcare provider 
    for proper medical evaluation and treatment decisions. This report is generated by 
    Second Opinion AI - Medical Analysis Platform.
    """
    
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=normal_style,
        textColor=HexColor('#744210'),
        backColor=HexColor('#fef5e7'),
        borderWidth=1,
        borderColor=HexColor('#d69e2e'),
        borderPadding=10
    )
    
    story.append(Paragraph(disclaimer_text.strip(), disclaimer_style))
    
    # Footer
    story.append(Spacer(1, 30))
    footer_style = ParagraphStyle(
        'Footer',
        parent=normal_style,
        fontSize=8,
        textColor=HexColor('#718096'),
        alignment=1  # Center alignment
    )
    
    footer_text = f"Generated by Second Opinion AI - Medical Analysis Platform | {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    story.append(Paragraph(footer_text, footer_style))
    
    # Build PDF
    doc.build(story)
    
    # Get the value of the BytesIO buffer
    pdf_content = buffer.getvalue()
    buffer.close()
    
    return pdf_content


def get_analysis_type_display(model_type: str) -> str:
    """Get display name for analysis type"""
    type_mapping = {
        'tumor': 'Brain Tumor Detection',
        'chest_xray': 'Pneumonia Detection',
        'unknown': 'Medical Analysis'
    }
    return type_mapping.get(model_type, 'Medical Analysis')


def get_model_name(model_type: str) -> str:
    """Get model name for display"""
    model_mapping = {
        'tumor': 'BrainTumor ViT v3.2',
        'chest_xray': 'ChestXray ViT v2.1',
        'unknown': 'Medical AI Model'
    }
    return model_mapping.get(model_type, 'Medical AI Model')


def format_datetime(dt_string: Optional[str]) -> str:
    """Format datetime string for display"""
    if not dt_string:
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    try:
        # Try to parse ISO format
        dt = datetime.fromisoformat(dt_string.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except:
        # Return as-is if parsing fails
        return str(dt_string)


def generate_findings(result_data: Dict[str, Any]) -> List[str]:
    """Generate clinical findings based on analysis results"""
    prediction = result_data.get('prediction', '').lower()
    confidence = result_data.get('confidence', 0) * 100
    
    findings = []
    
    if 'normal' in prediction:
        findings.extend([
            "No significant abnormalities detected",
            "Normal tissue structure observed",
            "Clear anatomical features",
            "No mass effect or suspicious lesions identified"
        ])
    elif 'glioma' in prediction:
        findings.extend([
            f"{result_data.get('prediction', 'Glioma')} detected",
            "Irregular enhancement pattern observed",
            "Possible mass effect present",
            "Requires further neurological evaluation"
        ])
    elif 'meningioma' in prediction:
        findings.extend([
            f"{result_data.get('prediction', 'Meningioma')} detected",
            "Extra-axial location likely",
            "Well-circumscribed appearance",
            "Characteristic imaging features present"
        ])
    elif 'pituitary' in prediction:
        findings.extend([
            f"{result_data.get('prediction', 'Pituitary tumor')} detected",
            "Sellar/suprasellar region involvement",
            "Endocrine evaluation may be required",
            "Specialized imaging recommended"
        ])
    elif 'pneumonia' in prediction:
        findings.extend([
            "Pneumonia-like changes detected",
            "Consolidation or infiltrates present",
            "Respiratory system involvement",
            "Clinical correlation recommended"
        ])
    else:
        findings.extend([
            f"Analysis result: {result_data.get('prediction', 'Unknown')}",
            f"AI confidence level: {confidence:.1f}%",
            "Medical review recommended for interpretation",
            "Consider additional diagnostic studies if clinically indicated"
        ])
    
    # Add confidence-based findings
    if confidence >= 90:
        findings.append("High confidence in AI analysis results")
    elif confidence >= 75:
        findings.append("Moderate confidence in AI analysis results")
    else:
        findings.append("Low confidence - manual review strongly recommended")
    
    return findings


def generate_recommendations(result_data: Dict[str, Any]) -> List[str]:
    """Generate medical recommendations based on analysis results"""
    prediction = result_data.get('prediction', '').lower()
    
    recommendations = []
    
    if 'normal' in prediction:
        recommendations.extend([
            "Continue routine monitoring as clinically indicated",
            "No immediate intervention required based on imaging",
            "Follow standard surveillance protocols",
            "Consult healthcare provider for ongoing care plan"
        ])
    elif any(tumor in prediction for tumor in ['glioma', 'meningioma', 'pituitary', 'tumor']):
        recommendations.extend([
            "Immediate neurology or neurosurgery consultation recommended",
            "Additional imaging studies may be required (MRI with contrast)",
            "Multidisciplinary team review suggested",
            "Consider referral to specialized cancer center",
            "Discuss treatment options with healthcare team"
        ])
    elif 'pneumonia' in prediction:
        recommendations.extend([
            "Pulmonology consultation may be beneficial",
            "Consider antimicrobial therapy as appropriate",
            "Follow-up imaging to monitor treatment response",
            "Clinical correlation with symptoms and laboratory results"
        ])
    else:
        recommendations.extend([
            "Consult with healthcare provider for result interpretation",
            "Consider additional diagnostic studies as needed",
            "Clinical correlation with patient symptoms",
            "Follow-up as directed by healthcare team"
        ])
    
    # General recommendations
    recommendations.extend([
        "Maintain regular follow-up appointments",
        "Report any new or worsening symptoms immediately",
        "Keep this report for medical records"
    ])
    
    return recommendations
