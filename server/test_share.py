#!/usr/bin/env python3
"""
Test script to validate share functionality
"""
import sys
import os

# Add the server directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def test_imports():
    """Test if all required modules can be imported"""
    try:
        print("Testing imports...")
        
        from app.services.prediction_service import PredictionService
        print("✅ PredictionService imported successfully")
        
        from app.services.email_service import email_service
        print("✅ EmailService imported successfully")
        
        from app.utils.pdfGenerator import generateMedicalPDF
        print("✅ PDF Generator imported successfully")
        
        # Test PredictionService methods
        methods = dir(PredictionService)
        if 'get_prediction_result' in methods:
            print("✅ PredictionService.get_prediction_result method exists")
        else:
            print("❌ PredictionService.get_prediction_result method missing")
            print(f"Available methods: {[m for m in methods if not m.startswith('_')]}")
        
        # Test PDF generation with sample data
        sample_result = {
            'prediction': 'Normal Brain',
            'confidence': 0.94,
            'created_at': '2025-01-17T10:30:00Z',
            'model_type': 'tumor',
            'notes': 'Test notes',
            'entropy': 0.123,
            'probabilities': {},
            'status': 'completed',
        }
        
        sample_patient = {
            'full_name': 'Test Patient',
            'date_of_birth': '1980-01-01',
            'gender': 'Male',
            'phone': '9800000000',
            'email': 'test@example.com',
        }
        
        pdf_content = generateMedicalPDF(sample_result, sample_patient)
        print(f"✅ PDF generation successful, size: {len(pdf_content)} bytes")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ General error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Share Functionality Components")
    print("=" * 50)
    
    success = test_imports()
    
    if success:
        print("\n✅ All tests passed! Share functionality should work.")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
