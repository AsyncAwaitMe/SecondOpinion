from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any
import math

from app.db.session import get_db
from app.db.models import User
from app.api.auth import get_current_user
from app.services.prediction_service import PatientService, PredictionService
from app.schemas.prediction import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PredictionResultResponse,
    PredictionResultUpdate,
    PredictionHistoryResponse,
    PredictionStatisticsResponse,
)

router = APIRouter()


# Patient Management Endpoints
@router.post("/patients", response_model=PatientResponse)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new patient record"""
    return PatientService.create_patient(db, patient_data)


@router.get("/patients", response_model=List[PatientResponse])
def get_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(5, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all patients with optional search"""
    if search:
        return PatientService.search_patients(db, search, skip, limit)
    return PatientService.get_patients(db, skip, limit)


@router.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific patient by ID"""
    patient = PatientService.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )
    return patient


@router.put("/patients/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update patient information"""
    patient = PatientService.update_patient(db, patient_id, patient_data)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )
    return patient


@router.delete("/patients/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a patient record"""
    success = PatientService.delete_patient(db, patient_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )
    return {"message": "Patient deleted successfully"}


# Prediction History Endpoints
@router.get("/predictions/history", response_model=PredictionHistoryResponse)
def get_prediction_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(5, ge=1, le=100),
    model_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get prediction history for the current user"""
    skip = (page - 1) * per_page
    user_id = getattr(current_user, "id")
    results = PredictionService.get_user_prediction_history(
        db, user_id, skip, per_page, model_type, status, search
    )

    total = PredictionService.count_user_predictions(db, user_id)
    total_pages = math.ceil(total / per_page)

    # Convert SQLAlchemy models to Pydantic models
    result_responses = [
        PredictionResultResponse.model_validate(result) for result in results
    ]

    return PredictionHistoryResponse(
        results=result_responses,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.get("/predictions/statistics", response_model=PredictionStatisticsResponse)
def get_prediction_statistics(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get prediction statistics for the current user"""
    user_id = getattr(current_user, "id")
    return PredictionService.get_prediction_statistics(db, user_id)


@router.get("/predictions/{result_id}", response_model=PredictionResultResponse)
def get_prediction_result(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific prediction result"""
    result = PredictionService.get_prediction_result(db, result_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Prediction result not found"
        )

    # Check if user owns this prediction
    if getattr(result, "user_id") != getattr(current_user, "id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this prediction result",
        )

    return result


@router.put("/predictions/{result_id}", response_model=PredictionResultResponse)
def update_prediction_result(
    result_id: int,
    update_data: PredictionResultUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a prediction result (add notes, change status)"""
    # First check if the result exists and belongs to the user
    existing_result = PredictionService.get_prediction_result(db, result_id)
    if not existing_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Prediction result not found"
        )

    if getattr(existing_result, "user_id") != getattr(current_user, "id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this prediction result",
        )

    result = PredictionService.update_prediction_result(db, result_id, update_data)
    return result


@router.get(
    "/patients/{patient_id}/predictions", response_model=List[PredictionResultResponse]
)
def get_patient_predictions(
    patient_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(5, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all predictions for a specific patient"""
    # Verify patient exists
    patient = PatientService.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    return PredictionService.get_patient_prediction_history(db, patient_id, skip, limit)
