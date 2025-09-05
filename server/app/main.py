import io
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

import torch
from app.api.auth import router as auth_router
from app.api.history import router as history_router
from app.api.upload import router as upload_router
from app.api.share import router as share_router
from app.core.otp_scheduler import (
    start_otp_cleanup_service,
    stop_otp_cleanup_service,
    manual_otp_cleanup,
)

# import database models and create tables
from app.db.base import Base
from app.db.session import engine
from app.utils.model_utils import (
    create_vit_model,
    create_effnetb2_model,
    load_index_map,
    load_labels,
    reorder_probs,
    validate_image_confidence,
)
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for model caching
_tumor_model = None
_tumor_transforms = None
_chest_model = None
_chest_transforms = None
_separator_model = None
_separator_transforms = None


def create_db_and_tables():
    Base.metadata.create_all(bind=engine)


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
            num_classes=4
        )
        _chest_model.load_state_dict(
            torch.load(
                "models/ChestXray.pth",
                map_location=torch.device("cpu"),
            )
        )
        _chest_model.eval()
        print("Chest X-ray model loaded successfully!")
    return _chest_model, _chest_transforms


def load_separator_model():
    """Load the separator model once and cache it"""
    global _separator_model, _separator_transforms
    if _separator_model is None:
        print("Loading separator model...")
        _separator_model, _separator_transforms = create_effnetb2_model(num_classes=2)
        _separator_model.load_state_dict(
            torch.load(
                "models/Seperator.pth",
                map_location=torch.device("cpu"),
            )
        )
        _separator_model.eval()
        print("Separator model loaded successfully!")
    return _separator_model, _separator_transforms


create_db_and_tables()

app = FastAPI(
    title="Second Opinion API",
    description="Medical Image Analysis API with Authentication and Result History",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React app URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Application lifecycle events
@app.on_event("startup")
async def startup_event():
    """Initialize services when the application starts"""
    logger.info("Starting Second Opinion API...")
    # Start the OTP cleanup scheduler
    await start_otp_cleanup_service()
    logger.info("OTP cleanup service started")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup when the application shuts down"""
    logger.info("Shutting down Second Opinion API...")
    # Stop the OTP cleanup scheduler
    await stop_otp_cleanup_service()
    logger.info("OTP cleanup service stopped")


# Mount static files for uploaded images
uploads_dir = "uploads"
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(upload_router, prefix="/upload", tags=["Image Upload & Prediction"])
app.include_router(
    history_router, prefix="/history", tags=["Prediction History & Patient Management"]
)
app.include_router(share_router, prefix="/share", tags=["Share Medical Reports"])


@app.get("/")
def read_root():
    return {"message": "Hello, World!"}


@app.get(path="/home")
def home():
    return {"Home": "okieee"}


@app.post("/pp", response_model=str)
def post_something(apa: str):
    return apa


@app.post("/admin/cleanup-otp")
async def trigger_otp_cleanup():
    """Admin endpoint to manually trigger OTP cleanup"""
    try:
        result = await manual_otp_cleanup()
        return {"success": True, "message": "OTP cleanup completed", "details": result}
    except Exception as e:
        logger.error(f"Manual OTP cleanup failed: {e}")
        return {"success": False, "message": f"OTP cleanup failed: {str(e)}"}


@app.get("/admin/otp-stats")
def get_otp_statistics():
    """Admin endpoint to get OTP statistics"""
    from app.db.session import SessionLocal
    from app.services.otp_service import OTPService

    db = SessionLocal()
    try:
        otp_service = OTPService(db)
        stats = otp_service.get_otp_statistics()
        return {"success": True, "statistics": stats}
    except Exception as e:
        logger.error(f"Failed to get OTP statistics: {e}")
        return {"success": False, "message": f"Failed to get statistics: {str(e)}"}
    finally:
        db.close()


# Keep the original tumor endpoint for backward compatibility
@app.post("/tumor")
async def post_image_tumor(file: UploadFile = File(...)):
    # First, use the Separator model to check if the image is MRI
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
            return {
                "error": "Invalid image type for tumor analysis",
                "message": f"This appears to be a {predicted_image_type} image (MRI probability: {mri_probability:.2f}). Tumor analysis requires MRI images.",
                "separator_prediction": predicted_image_type,
                "separator_confidence": float(separator_confidence),
                "mri_probability": float(mri_probability),
                "separator_probabilities": separator_pred_labels_and_probs
            }
    
    # If we reach here, the image is classified as MRI, proceed with tumor analysis
    # Load labels from file if present; otherwise use expected default ordering
    class_names = load_labels(
        model_basename="Tumor",
        default_labels=[
            "Glioma Tumor",
            "Meningioma Tumor",
            "Normal Brain",
            "Pituitary Tumor",
        ],
    )

    # Load the cached tumor model
    vit, vit_transforms = load_tumor_model()

    # Transform and predict with tumor model
    if vit_transforms is not None:
        img_tensor = vit_transforms(img).unsqueeze(0)

        with torch.inference_mode():
            # Pass the transformed image through the model and turn the prediction logits into prediction probabilities
            raw_probs = torch.softmax(vit(img_tensor), dim=1)

        # Optionally reorder probs if an index map exists (to match desired label order)
        index_map = load_index_map("Tumor", num_classes=len(class_names))
        pred_probs = reorder_probs(raw_probs, index_map) if index_map else raw_probs

        tumor_result = validate_image_confidence(pred_probs, class_names, image_type="tumor")
        
        # Add separator information to the result
        tumor_result["separator_prediction"] = predicted_image_type
        tumor_result["separator_confidence"] = float(separator_confidence)
        tumor_result["mri_probability"] = float(mri_probability)
        tumor_result["separator_probabilities"] = separator_pred_labels_and_probs
        
        return tumor_result
    else:
        return {"error": "Tumor model transforms not loaded"}


@app.get("/tumor/labels")
def get_tumor_labels():
    """Expose the label order used for the tumor model for verification/debugging."""
    labels = load_labels(
        model_basename="Tumor",
        default_labels=[
            "Glioma Tumor",
            "Meningioma Tumor",
            "Normal Brain",
            "Pituitary Tumor",
        ],
    )
    index_map = load_index_map("Tumor", num_classes=len(labels))
    return {"labels": labels, "index_map": index_map}


@app.get("/separator/labels")
def get_separator_labels():
    """Expose the label order used for the separator model for verification/debugging."""
    labels = load_labels(
        model_basename="Seperator",
        default_labels=[
            "MRI",
            "Non-MRI"
        ],
    )
    index_map = load_index_map("Seperator", num_classes=len(labels))
    return {"labels": labels, "index_map": index_map}
