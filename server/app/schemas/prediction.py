from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional, Dict, Any, List


class PatientBase(BaseModel):
    full_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    medical_history: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    medical_history: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class PatientResponse(PatientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PredictionRequest(BaseModel):
    patient_id: Optional[int] = None  # Existing patient
    patient_data: Optional[PatientCreate] = None  # New patient data
    notes: Optional[str] = None


class PredictionResponse(BaseModel):
    id: Optional[int] = None  # Database ID of the saved result
    prediction: str
    confidence: float
    entropy: Optional[float] = None
    message: str
    probabilities: Dict[str, float]


class PredictionResultBase(BaseModel):
    image_filename: str
    model_type: str
    prediction: str
    confidence: float
    entropy: Optional[float] = None
    message: Optional[str] = None
    probabilities: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    status: str = "pending"


class PredictionResultCreate(PredictionResultBase):
    user_id: int
    patient_id: int
    image_path: Optional[str] = None


class PredictionResultUpdate(BaseModel):
    notes: Optional[str] = None
    status: Optional[str] = None


class PredictionResultResponse(PredictionResultBase):
    id: int
    user_id: int
    patient_id: int
    image_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    patient: PatientResponse

    class Config:
        from_attributes = True


class PredictionHistoryResponse(BaseModel):
    results: List[PredictionResultResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class PredictionStatisticsResponse(BaseModel):
    total_predictions: int
    by_model_type: Dict[str, int]
    by_status: Dict[str, int]
