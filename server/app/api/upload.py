import io
import os
import torch
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status, Form
from sqlalchemy.orm import Session
from typing import Optional
from PIL import Image
from datetime import datetime

from app.db.session import get_db
from app.db.models import User
from app.api.auth import get_current_user
from app.services.prediction_service import (
    PatientService,
    PredictionService,
    save_uploaded_file,
)
from app.schemas.prediction import (
    PredictionResponse,
    PatientCreate,
    PredictionResultCreate,
)
from app.utils.model_utils import (
    create_vit_model,
    validate_image_confidence,
    load_labels,
    load_index_map,
    reorder_probs,
)

router = APIRouter()

# Global variables for model caching (same as main.py)
_tumor_model = None
_tumor_transforms = None
_chest_model = None
_chest_transforms = None


def load_tumor_model():
    """Load the tumor model once and cache it"""
    global _tumor_model, _tumor_transforms
    if _tumor_model is None:
        print("Loading tumor model...")
        _tumor_model, _tumor_transforms = create_vit_model(num_classes=4)
        _tumor_model.load_state_dict(
            torch.load(
                "models/Tumor.pth",
                map_location=torch.device("cpu"),
            )
        )
        _tumor_model.eval()
        print("Tumor model loaded successfully!")
    return _tumor_model, _tumor_transforms


def load_chest_model():
    """Load the chest X-ray model once and cache it"""
    global _chest_model, _chest_transforms
    if _chest_model is None:
        print("Loading chest X-ray model...")
        _chest_model, _chest_transforms = create_vit_model(
            num_classes=2
        )  # Assuming binary classification for pneumonia
        _chest_model.load_state_dict(
            torch.load(
                "models/ChestXray.pth",
                map_location=torch.device("cpu"),
            )
        )
        _chest_model.eval()
        print("Chest X-ray model loaded successfully!")
    return _chest_model, _chest_transforms


def parse_date(date_str: Optional[str]):
    """Parse date string to date object"""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        try:
            return datetime.strptime(date_str, "%d/%m/%Y").date()
        except ValueError:
            return None


@router.post("/tumor", response_model=PredictionResponse)
async def predict_tumor(
    file: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    patient_name: Optional[str] = Form(None),
    patient_dob: Optional[str] = Form(None),
    patient_gender: Optional[str] = Form(None),
    patient_phone: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Predict tumor type and save result to history"""
    # First, use the Separator model to check if the image is MRI
    from app.main import load_separator_model
    from app.utils.model_utils import load_labels, load_index_map, reorder_probs
    
    separator_class_names = load_labels(
        model_basename="Seperator",
        default_labels=[
            "MRI",
            "Non-MRI"
        ],
    )
    
    # Load the separator model
    separator_model, separator_transforms = load_separator_model()
    
    # Process the uploaded image
    image_data = await file.read()
    img = Image.open(io.BytesIO(image_data))
    if img.mode != "RGB":
        img = img.convert("RGB")
    
    # First check with separator model
    if separator_transforms is not None:
        img_tensor = separator_transforms(img).unsqueeze(0)
        
        with torch.inference_mode():
            separator_raw_probs = torch.softmax(separator_model(img_tensor), dim=1)
        
        # Optionally reorder probs if an index map exists
        separator_index_map = load_index_map("Seperator", num_classes=len(separator_class_names))
        separator_pred_probs = reorder_probs(separator_raw_probs, separator_index_map) if separator_index_map else separator_raw_probs
        
        # Get the predicted class
        separator_pred_labels_and_probs = {separator_class_names[i]: float(separator_pred_probs[0][i]) for i in range(len(separator_class_names))}
        predicted_image_type = max(separator_pred_labels_and_probs, key=separator_pred_labels_and_probs.get)
        separator_confidence = max(separator_pred_labels_and_probs.values())
        mri_probability = separator_pred_labels_and_probs.get("MRI", 0.0)
        
        # If the image is not classified as MRI with reasonable confidence, return early
        if predicted_image_type != "MRI" or mri_probability < 0.6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "Invalid image type for tumor analysis",
                    "message": f"This appears to be a {predicted_image_type} image (MRI probability: {mri_probability:.2f}). Tumor analysis requires MRI images.",
                    "separator_prediction": predicted_image_type,
                    "separator_confidence": float(separator_confidence),
                    "mri_probability": float(mri_probability),
                    "separator_probabilities": separator_pred_labels_and_probs
                }
            )
    
    # If we reach here, the image is classified as MRI, proceed with tumor analysis
    class_names = [
        "Glioma Tumor",
        "Meningioma Tumor",
        "Normal Brain",
        "Pituitary Tumor",
    ]

    # Load the cached model
    vit, vit_transforms = load_tumor_model()

    # Validate that models are loaded
    if vit is None or vit_transforms is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model not loaded properly",
        )

    # Image already processed above for separator validation
    # Transform and predict with tumor model
    img_tensor = vit_transforms(img).unsqueeze(0)

    with torch.inference_mode():
        # Pass the transformed image through the model and turn the prediction logits into prediction probabilities
        pred_probs = torch.softmax(vit(img_tensor), dim=1)

    # Get prediction result
    prediction_result = validate_image_confidence(
        pred_probs, class_names, image_type="tumor"
    )

    # Handle patient information
    db_patient_id = patient_id
    if not db_patient_id and patient_name:
        # Create new patient
        patient_data = PatientCreate(
            full_name=patient_name,
            date_of_birth=parse_date(patient_dob),
            gender=patient_gender,
            phone=patient_phone,
        )
        db_patient = PatientService.create_patient(db, patient_data)
        db_patient_id = getattr(db_patient, "id")
    elif not db_patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either patient_id or patient_name must be provided",
        )

    # Save uploaded file
    file_path = save_uploaded_file(image_data, file.filename or "tumor_image.jpg")
    saved_filename = os.path.basename(
        file_path
    )  # Extract just the filename from the path

    # Save prediction result to database
    prediction_data = PredictionResultCreate(
        user_id=getattr(current_user, "id"),
        patient_id=db_patient_id,
        image_filename=saved_filename,  # Store the actual saved filename
        image_path=file_path,
        model_type="tumor",
        prediction=prediction_result["prediction"],
        confidence=prediction_result["confidence"],
        entropy=prediction_result.get("entropy"),
        message=prediction_result.get("message"),
        probabilities=prediction_result["probabilities"],
        notes=notes,
    )

    db_result = PredictionService.save_prediction_result(db, prediction_data, file_path)

    # Include the database ID in the response
    response_data = prediction_result.copy()
    response_data["id"] = db_result.id
    
    # Add separator information to the response
    response_data["separator_prediction"] = predicted_image_type
    response_data["separator_confidence"] = float(separator_confidence)
    response_data["mri_probability"] = float(mri_probability)
    response_data["separator_probabilities"] = separator_pred_labels_and_probs

    return PredictionResponse(**response_data)


@router.post("/chest", response_model=PredictionResponse)
async def predict_chest(
    file: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    patient_name: Optional[str] = Form(None),
    patient_dob: Optional[str] = Form(None),
    patient_gender: Optional[str] = Form(None),
    patient_phone: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Predict chest X-ray condition and save result to history"""
    class_names = [
        "Normal",
        "Pneumonia",
    ]

    # Load the cached model
    vit, vit_transforms = load_chest_model()

    # Validate that models are loaded
    if vit is None or vit_transforms is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model not loaded properly",
        )

    # Process the uploaded image
    image_data = await file.read()
    img = Image.open(io.BytesIO(image_data))
    if img.mode != "RGB":
        img = img.convert("RGB")

    # Transform and predict
    img_tensor = vit_transforms(img).unsqueeze(0)

    with torch.inference_mode():
        # Pass the transformed image through the model and turn the prediction logits into prediction probabilities
        pred_probs = torch.softmax(vit(img_tensor), dim=1)

    # Get prediction result
    prediction_result = validate_image_confidence(
        pred_probs, class_names, image_type="chest_xray"
    )

    # Handle patient information
    db_patient_id = patient_id
    if not db_patient_id and patient_name:
        # Create new patient
        patient_data = PatientCreate(
            full_name=patient_name,
            date_of_birth=parse_date(patient_dob),
            gender=patient_gender,
            phone=patient_phone,
        )
        db_patient = PatientService.create_patient(db, patient_data)
        db_patient_id = getattr(db_patient, "id")
    elif not db_patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either patient_id or patient_name must be provided",
        )

    # Save uploaded file
    file_path = save_uploaded_file(image_data, file.filename or "chest_image.jpg")
    saved_filename = os.path.basename(
        file_path
    )  # Extract just the filename from the path

    # Save prediction result to database
    prediction_data = PredictionResultCreate(
        user_id=getattr(current_user, "id"),
        patient_id=db_patient_id,
        image_filename=saved_filename,  # Store the actual saved filename
        image_path=file_path,
        model_type="chest_xray",
        prediction=prediction_result["prediction"],
        confidence=prediction_result["confidence"],
        entropy=prediction_result.get("entropy"),
        message=prediction_result.get("message"),
        probabilities=prediction_result["probabilities"],
        notes=notes,
    )

    db_result = PredictionService.save_prediction_result(db, prediction_data, file_path)

    # Include the database ID in the response
    response_data = prediction_result.copy()
    response_data["id"] = db_result.id

    return PredictionResponse(**response_data)
