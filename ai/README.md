# PAWPAL AI Disease Detection System

## Overview
This is a complete AI-powered pet disease detection system built for academic/final year projects. It uses deep learning (CNN) to detect visible pet diseases, primarily skin conditions, from uploaded images.

## System Architecture

```
Frontend (React) → Backend (Node.js/Express) → Python AI Service → MongoDB
```

## Setup Instructions

### 1. Python AI Service Setup

#### Install Dependencies
```bash
cd ai
pip install -r requirements.txt
```

#### Install TensorFlow (Recommended)
```bash
pip install tensorflow>=2.10.0
```

#### Alternative: Install PyTorch
```bash
pip install torch torchvision
```

### 2. Model Training (Optional - For Custom Training)

If you have a labeled dataset:

```bash
# Organize your data:
# data/
#   train/
#     Healthy/
#     Skin_Allergy/
#     Flea_Infestation/
#     ...
#   val/
#     Healthy/
#     Skin_Allergy/
#     ...

# Train the model
python train.py data/
```

The trained model will be saved as `model.h5` (TensorFlow) or `model.pt` (PyTorch).

### 3. Using Pre-trained Model

If you have a pre-trained model:
- Place it in the `ai/` directory as `model.h5` (TensorFlow) or `model.pt` (PyTorch)
- The system will automatically use it

### 4. Mock Mode (Development)

If no model is available, the system will use **mock predictions** for demonstration purposes. This is useful for:
- Development and testing
- Demonstrating the system without training data
- Academic presentations

## API Usage

### Predict Disease from Image

**Endpoint:** `POST /api/predict`

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `image`: Image file (JPG, PNG, HEIC, max 10MB)
  - `petId`: Pet ID (string)

**Response:**
```json
{
  "disease": "Skin Allergy",
  "confidence": 87.5,
  "recommendation": "Consult a veterinarian for allergy testing...",
  "predictionId": "507f1f77bcf86cd799439011",
  "imageUrl": "/uploads/prediction-1234567890.jpg",
  "processingTime": 1250
}
```

### Get Prediction History

**Endpoint:** `GET /api/predictions?petId=<petId>&page=1&limit=20`

**Response:**
```json
{
  "predictions": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3,
    "hasMore": true
  }
}
```

## Disease Classes

The system can detect the following conditions:

1. **Healthy** - No visible disease
2. **Skin Allergy** - Allergic skin reactions
3. **Flea Infestation** - Flea bites and irritation
4. **Ringworm** - Fungal infection
5. **Hot Spots** - Acute moist dermatitis
6. **Mange** - Mite infestation
7. **Ear Infection** - Otitis
8. **Dermatitis** - General skin inflammation

## Image Requirements

- **Formats:** JPG, PNG, HEIC
- **Max Size:** 10MB
- **Recommended:** Clear, well-lit images of affected areas
- **Preprocessing:** Images are automatically resized to 224x224 and normalized

## Testing the System

### Test with Mock Predictions

1. Start the backend server
2. Upload an image through the frontend
3. The system will use mock predictions if no model is found

### Test with Real Model

1. Train or obtain a model file (`model.h5`)
2. Place it in the `ai/` directory
3. Upload an image - the system will use the real model

## Troubleshooting

### Python Script Not Found
- Ensure `ai/predict.py` exists
- Check file permissions
- Verify Python is installed: `python --version`

### Model Loading Errors
- Check model file format (`.h5` for TensorFlow, `.pt` for PyTorch)
- Verify model architecture matches expected input (224x224x3)
- System will fall back to mock predictions if model fails to load

### Image Processing Errors
- Verify image format is supported
- Check image file is not corrupted
- Ensure image size is within limits

## Academic Project Notes

### For Viva/Defense:

1. **Data Flow:**
   - User uploads image → Backend receives → Python processes → Model predicts → Results stored in MongoDB → Frontend displays

2. **Technologies Used:**
   - Frontend: React.js, Tailwind CSS, Axios
   - Backend: Node.js, Express.js, Multer
   - AI: TensorFlow/PyTorch, CNN (MobileNetV2)
   - Database: MongoDB with Mongoose

3. **Key Features:**
   - Image preprocessing (resize, normalize)
   - Deep learning inference
   - Result storage and history
   - Real-time prediction

4. **Model Architecture:**
   - Base: MobileNetV2 (pre-trained on ImageNet)
   - Fine-tuned for 8 disease classes
   - Transfer learning approach

## License

Open Source - Academic Project
Free to use and modify

## Support

For issues or questions, refer to the main project documentation.

