from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_, or_, func
from typing import Optional, List
from datetime import datetime
import os
from uuid import uuid4

from app.db.models import Patient, PredictionResult, User
from app.schemas.prediction import (
    PatientCreate,
    PatientUpdate,
    PredictionResultCreate,
    PredictionResultUpdate,
)


class PatientService:
    @staticmethod
    def create_patient(db: Session, patient_data: PatientCreate) -> Patient:
        """Create a new patient record"""
        db_patient = Patient(**patient_data.model_dump())
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
        return db_patient

    @staticmethod
    def get_patient(db: Session, patient_id: int) -> Optional[Patient]:
        """Get patient by ID"""
        return db.query(Patient).filter(Patient.id == patient_id).first()

    @staticmethod
    def get_patients(db: Session, skip: int = 0, limit: int = 100) -> List[Patient]:
        """Get all patients with pagination"""
        return db.query(Patient).offset(skip).limit(limit).all()

    @staticmethod
    def update_patient(
        db: Session, patient_id: int, patient_data: PatientUpdate
    ) -> Optional[Patient]:
        """Update patient information"""
        db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if db_patient:
            update_data = patient_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_patient, field, value)
            db.commit()
            db.refresh(db_patient)
        return db_patient

    @staticmethod
    def delete_patient(db: Session, patient_id: int) -> bool:
        """Delete a patient record"""
        db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if db_patient:
            db.delete(db_patient)
            db.commit()
            return True
        return False

    @staticmethod
    def search_patients(
        db: Session, query: str, skip: int = 0, limit: int = 100
    ) -> List[Patient]:
        """Search patients by name"""
        return (
            db.query(Patient)
            .filter(Patient.full_name.ilike(f"%{query}%"))
            .offset(skip)
            .limit(limit)
            .all()
        )


class PredictionService:
    @staticmethod
    def save_prediction_result(
        db: Session,
        prediction_data: PredictionResultCreate,
        image_file_path: Optional[str] = None,
    ) -> PredictionResult:
        """Save a prediction result to the database"""
        # Generate unique filename if not provided
        if image_file_path:
            prediction_data.image_path = image_file_path

        db_result = PredictionResult(**prediction_data.model_dump())
        db.add(db_result)
        db.commit()
        db.refresh(db_result)
        return db_result

    @staticmethod
    def get_prediction_result(
        db: Session, result_id: int
    ) -> Optional[PredictionResult]:
        """Get a single prediction result by ID"""
        return (
            db.query(PredictionResult)
            .filter(PredictionResult.id == result_id)
            .options(joinedload(PredictionResult.patient))
            .first()
        )

    @staticmethod
    def get_user_prediction_history(
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        model_type: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[PredictionResult]:
        """Get prediction history for a specific user"""
        query = (
            db.query(PredictionResult)
            .filter(PredictionResult.user_id == user_id)
            .options(joinedload(PredictionResult.patient))
        )

        if model_type:
            query = query.filter(PredictionResult.model_type == model_type)

        if status:
            query = query.filter(PredictionResult.status == status)

        if search:
            # Search in patient name, prediction result, or notes
            search_term = f"%{search.lower()}%"
            query = query.join(Patient).filter(
                or_(
                    func.lower(Patient.full_name).like(search_term),
                    func.lower(PredictionResult.prediction).like(search_term),
                    func.lower(PredictionResult.notes).like(search_term),
                )
            )

        return (
            query.order_by(desc(PredictionResult.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_patient_prediction_history(
        db: Session, patient_id: int, skip: int = 0, limit: int = 20
    ) -> List[PredictionResult]:
        """Get prediction history for a specific patient"""
        return (
            db.query(PredictionResult)
            .filter(PredictionResult.patient_id == patient_id)
            .options(joinedload(PredictionResult.patient))
            .order_by(desc(PredictionResult.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def update_prediction_result(
        db: Session, result_id: int, update_data: PredictionResultUpdate
    ) -> Optional[PredictionResult]:
        """Update a prediction result (e.g., add notes, change status)"""
        db_result = (
            db.query(PredictionResult).filter(PredictionResult.id == result_id).first()
        )
        if db_result:
            update_fields = update_data.model_dump(exclude_unset=True)
            for field, value in update_fields.items():
                setattr(db_result, field, value)
            db.commit()
            db.refresh(db_result)
        return db_result

    @staticmethod
    def get_prediction_statistics(db: Session, user_id: Optional[int] = None) -> dict:
        """Get prediction statistics"""
        query = db.query(PredictionResult)
        if user_id:
            query = query.filter(PredictionResult.user_id == user_id)

        total_predictions = query.count()

        # Count by model type
        model_stats = {}
        for model_type in ["tumor", "chest_xray"]:
            count = query.filter(PredictionResult.model_type == model_type).count()
            model_stats[model_type] = count

        # Count by status
        status_stats = {}
        for status in ["pending", "reviewed", "archived"]:
            count = query.filter(PredictionResult.status == status).count()
            status_stats[status] = count

        return {
            "total_predictions": total_predictions,
            "by_model_type": model_stats,
            "by_status": status_stats,
        }

    @staticmethod
    def count_user_predictions(db: Session, user_id: int) -> int:
        """Count total predictions for a user"""
        return (
            db.query(PredictionResult)
            .filter(PredictionResult.user_id == user_id)
            .count()
        )

    @staticmethod
    def count_patient_predictions(db: Session, patient_id: int) -> int:
        """Count total predictions for a patient"""
        return (
            db.query(PredictionResult)
            .filter(PredictionResult.patient_id == patient_id)
            .count()
        )


def save_uploaded_file(
    file_content: bytes, filename: str, upload_dir: str = "uploads"
) -> str:
    """Save uploaded file and return the file path"""
    # Ensure upload directory exists
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    file_extension = os.path.splitext(filename)[1]
    unique_filename = f"{uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)

    return file_path
