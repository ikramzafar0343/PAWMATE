"""
PAWPAL AI Disease Detection - Training Script
Purpose: Train a CNN model for pet disease classification
Author: PAWMATE Development Team
License: Open Source (Academic Project)

Note: This is a reference training script. For actual training, you need:
1. A dataset of labeled pet disease images
2. Proper data organization in train/val/test folders
3. Sufficient computational resources
"""

import os
import numpy as np
from PIL import Image
import json

# Try to import TensorFlow
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers, models
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    USE_TENSORFLOW = True
except ImportError:
    print("TensorFlow not installed. Install with: pip install tensorflow")
    USE_TENSORFLOW = False
    sys.exit(1)

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 50
NUM_CLASSES = 8  # Number of disease classes

# Disease classes
CLASS_NAMES = [
    "Healthy",
    "Skin Allergy",
    "Flea Infestation",
    "Ringworm",
    "Hot Spots",
    "Mange",
    "Ear Infection",
    "Dermatitis"
]

def create_model():
    """
    Create a MobileNetV2-based model for disease classification
    
    Returns:
        Compiled Keras model
    """
    # Use MobileNetV2 as base (pre-trained on ImageNet)
    base_model = keras.applications.MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )
    
    # Freeze base model layers initially
    base_model.trainable = False
    
    # Build model
    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.2),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(NUM_CLASSES, activation='softmax')
    ])
    
    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.0001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def prepare_data_generators(data_dir):
    """
    Prepare data generators for training and validation
    
    Args:
        data_dir: Root directory containing 'train' and 'val' subdirectories
        
    Returns:
        Tuple of (train_generator, val_generator)
    """
    # Data augmentation for training
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        zoom_range=0.2,
        fill_mode='nearest'
    )
    
    # Only rescale for validation (no augmentation)
    val_datagen = ImageDataGenerator(rescale=1./255)
    
    # Create generators
    train_generator = train_datagen.flow_from_directory(
        os.path.join(data_dir, 'train'),
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=True
    )
    
    val_generator = val_datagen.flow_from_directory(
        os.path.join(data_dir, 'val'),
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=False
    )
    
    return train_generator, val_generator

def train_model(model, train_generator, val_generator, epochs=EPOCHS):
    """
    Train the model
    
    Args:
        model: Keras model to train
        train_generator: Training data generator
        val_generator: Validation data generator
        epochs: Number of training epochs
        
    Returns:
        Training history
    """
    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True
        ),
        keras.callbacks.ModelCheckpoint(
            'model.h5',
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-7
        )
    ]
    
    # Train model
    history = model.fit(
        train_generator,
        epochs=epochs,
        validation_data=val_generator,
        callbacks=callbacks,
        verbose=1
    )
    
    return history

def main():
    """
    Main training function
    
    Usage:
        python train.py <data_directory>
        
    Data directory structure:
        data/
            train/
                Healthy/
                Skin_Allergy/
                ...
            val/
                Healthy/
                Skin_Allergy/
                ...
    """
    if not USE_TENSORFLOW:
        print("TensorFlow is required for training.")
        return
    
    # Get data directory
    if len(sys.argv) > 1:
        data_dir = sys.argv[1]
    else:
        data_dir = 'data'
    
    if not os.path.exists(data_dir):
        print(f"Error: Data directory '{data_dir}' not found.")
        print("\nExpected structure:")
        print("  data/")
        print("    train/")
        print("      Healthy/")
        print("      Skin_Allergy/")
        print("      ...")
        print("    val/")
        print("      Healthy/")
        print("      Skin_Allergy/")
        print("      ...")
        return
    
    print("Creating model...")
    model = create_model()
    model.summary()
    
    print("\nPreparing data generators...")
    train_gen, val_gen = prepare_data_generators(data_dir)
    
    print(f"\nTraining on {train_gen.samples} samples")
    print(f"Validating on {val_gen.samples} samples")
    
    print("\nStarting training...")
    history = train_model(model, train_gen, val_gen)
    
    print("\nTraining complete!")
    print("Model saved as 'model.h5'")
    
    # Save training history
    with open('training_history.json', 'w') as f:
        json.dump({
            'loss': [float(x) for x in history.history['loss']],
            'val_loss': [float(x) for x in history.history['val_loss']],
            'accuracy': [float(x) for x in history.history['accuracy']],
            'val_accuracy': [float(x) for x in history.history['val_accuracy']]
        }, f, indent=2)

if __name__ == "__main__":
    import sys
    main()

