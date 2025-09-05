# Second Opinion API Server

The Second Opinion API Server is a FastAPI-based application for medical image analysis, designed to provide predictions for brain tumors and pneumonia detection through chest X-rays. It includes a complete authentication system, patient management, and prediction history tracking.

## 🚀 Features

- **AI-Powered Medical Image Analysis**
  - Brain Tumor Detection (Glioma, Meningioma, Pituitary, Normal)
  - Chest X-ray Analysis (Pneumonia, Normal)
- **User Management System**
  - Secure registration with email verification
  - OTP-based account verification
  - JWT-based authentication
  - Password reset functionality
  - User profile management
- **Patient Management**
  - Patient records storage
  - Patient history tracking
  - Associate predictions with specific patients
- **Prediction History**

  - Save prediction results with image references
  - Track confidence scores and probabilities
  - Add notes to predictions

- **Security Features**
  - OTP expiration and cleanup
  - Rate limiting for sensitive operations
  - Secure password handling

## 🛠️ Technologies Used

- **FastAPI** - High-performance web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **PyTorch** - Deep learning framework for image analysis
- **Alembic** - Database migration tool
- **Pydantic** - Data validation and settings management
- **JWT** - JSON Web Tokens for authentication
- **PIL** - Python Imaging Library for image processing

## 📋 Project Structure

```
server/
├── alembic/               # Database migration scripts
├── app/
│   ├── api/               # API endpoints
│   │   ├── auth.py        # Authentication endpoints
│   │   ├── history.py     # History and patient data endpoints
│   │   └── upload.py      # Image upload and prediction endpoints
│   ├── core/              # Core functionality
│   │   ├── config.py      # Application configuration
│   │   ├── security.py    # Security functions
│   │   ├── email.py       # Email functionality
│   │   └── otp_scheduler.py # OTP cleanup service
│   ├── db/                # Database
│   │   ├── base.py        # Base SQLAlchemy models
│   │   ├── models.py      # Database models
│   │   └── session.py     # Database session management
│   ├── schemas/           # Pydantic models for request/response
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── models/                # Pre-trained AI models
│   ├── ChestXray.pth      # Chest X-ray analysis model
│   └── Tumor.pth          # Brain tumor detection model
├── uploads/               # Directory for uploaded images
└── main.py                # Application entry point
```

## 🏁 Getting Started

### Prerequisites

- Python 3.8+
- pip or uv package manager

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/secondopinion-proj/secondopinion-web.git
   cd secondopinion-web/server
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   # or with uv
   uv pip install -r requirements.txt
   ```

3. Set up the database:
   ```bash
   python migrate_db.py
   # or with uv
   uv run migrate_db.py
   ```

### Running the Server

1. Start the FastAPI server:

   ```bash
   python run.py
   # or with uv
   uv run run.py
   ```

2. Access the API documentation at:
   ```
   http://localhost:8000/docs
   ```

## 🔌 API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/verify-otp` - Verify account with OTP
- `POST /auth/resend-otp` - Resend verification OTP
- `POST /auth/login` - Login with form data
- `POST /auth/login-json` - Login with JSON
- `GET /auth/me` - Get current user profile
- `GET /auth/verify-token` - Verify JWT token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/verify-reset-otp` - Verify password reset OTP
- `POST /auth/reset-password` - Complete password reset
- `PUT /auth/update-profile` - Update user profile
- `POST /auth/change-password` - Change user password

### Image Upload & Prediction

- `POST /upload/tumor` - Upload brain scan and get tumor prediction
- `POST /upload/chest` - Upload chest X-ray and get pneumonia prediction

### Patient & History Management

- Endpoints for managing patients and viewing prediction history
- Filtering and searching through past predictions

## 📝 Database Schema

### Users Table

Stores user account information and authentication details.

### Patients Table

Manages patient information including demographics and medical history.

### Prediction Results Table

Records all predictions made by the system, linking users and patients.

### OTP Codes Table

Manages one-time passwords for email verification and password resets.

## 🔄 Workflow

1. **Registration Flow**:

   - User registers with email and password
   - System sends OTP for verification
   - User verifies account with OTP
   - System enables account access

2. **Image Analysis Flow**:
   - User uploads medical image
   - System processes the image with appropriate AI model
   - Results are displayed and stored in the database
   - User can review or share the results

## 🛡️ Security Considerations

- OTPs expire after a short period of 10 minutes
- Automatic cleanup of expired OTPs with scheduler
- Rate limiting for password reset requests
- Secure storage of passwords using hashing
- JWT-based session management
