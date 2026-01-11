"""
PAWPAL AI Disease Detection - Symptom Analysis Script
Purpose: Analyze pet symptoms text and predict likely diseases
Author: PAWMATE Development Team
License: Open Source (Academic Project)
"""

import sys
import json
import re

# Disease keywords mapping (for symptom-based analysis)
DISEASE_KEYWORDS = {
    'Skin Allergy': {
        'keywords': ['itch', 'itchy', 'scratch', 'scratching', 'red', 'rash', 'irritation', 'allergy', 'allergic', 'swelling', 'hives'],
        'common_symptoms': ['Excessive scratching', 'Red or inflamed skin', 'Hair loss', 'Skin irritation']
    },
    'Flea Infestation': {
        'keywords': ['flea', 'fleas', 'bite', 'bites', 'jump', 'jumping', 'scratch', 'scratching', 'black dots', 'flea dirt'],
        'common_symptoms': ['Excessive scratching', 'Flea bites visible', 'Black specks in fur', 'Restlessness']
    },
    'Ringworm': {
        'keywords': ['ring', 'circular', 'patch', 'patches', 'hair loss', 'bald', 'scaly', 'crusty', 'round'],
        'common_symptoms': ['Circular patches', 'Hair loss', 'Scaly skin', 'Red rings']
    },
    'Hot Spots': {
        'keywords': ['hot', 'spot', 'spots', 'moist', 'wet', 'oozing', 'raw', 'painful', 'tender', 'swollen'],
        'common_symptoms': ['Moist, raw skin', 'Rapid spreading', 'Painful to touch', 'Oozing']
    },
    'Mange': {
        'keywords': ['mange', 'mite', 'mites', 'hair loss', 'bald', 'crusty', 'thick', 'skin', 'scab'],
        'common_symptoms': ['Severe hair loss', 'Thickened skin', 'Crusty patches', 'Intense itching']
    },
    'Ear Infection': {
        'keywords': ['ear', 'ears', 'head shake', 'head shaking', 'smell', 'odor', 'discharge', 'wax', 'scratch ear'],
        'common_symptoms': ['Head shaking', 'Ear scratching', 'Odor from ears', 'Discharge']
    },
    'Dermatitis': {
        'keywords': ['inflamed', 'inflammation', 'red', 'swollen', 'irritated', 'sore', 'tender', 'rash'],
        'common_symptoms': ['Inflamed skin', 'Redness', 'Swelling', 'General irritation']
    }
}

def analyze_symptoms(symptoms_text, duration=''):
    """
    Analyze symptoms text and predict likely disease
    
    Args:
        symptoms_text: Text description of symptoms
        duration: Duration of symptoms (optional)
        
    Returns:
        Dictionary with disease, confidence, recommendation, and detected symptoms
    """
    if not symptoms_text or not symptoms_text.strip():
        return {
            "error": "No symptoms provided",
            "disease": "Unknown",
            "confidence": 0.0,
            "recommendation": "Please provide symptom description"
        }
    
    # Normalize symptoms text
    symptoms_lower = symptoms_text.lower()
    
    # Score each disease based on keyword matches
    disease_scores = {}
    detected_symptoms = []
    
    for disease, data in DISEASE_KEYWORDS.items():
        score = 0
        matched_keywords = []
        
        # Check for keyword matches
        for keyword in data['keywords']:
            if keyword in symptoms_lower:
                score += 1
                matched_keywords.append(keyword)
        
        # Check for common symptoms
        for symptom in data['common_symptoms']:
            if any(word in symptoms_lower for word in symptom.lower().split()):
                score += 0.5
                if symptom not in detected_symptoms:
                    detected_symptoms.append(symptom)
        
        if score > 0:
            disease_scores[disease] = score
    
    # Adjust confidence based on duration
    duration_multiplier = 1.0
    if 'more than 1 week' in duration.lower() or 'week' in duration.lower():
        duration_multiplier = 1.2  # Higher confidence for longer duration
    elif 'day' in duration.lower():
        duration_multiplier = 1.1
    
    # Get top disease
    if not disease_scores:
        # No matches - default to general dermatitis
        top_disease = 'Dermatitis'
        confidence = 60.0
    else:
        top_disease = max(disease_scores, key=disease_scores.get)
        max_score = disease_scores[top_disease]
        
        # Convert score to confidence (0-100)
        # Normalize based on max possible score (number of keywords)
        max_possible_score = len(DISEASE_KEYWORDS[top_disease]['keywords']) + len(DISEASE_KEYWORDS[top_disease]['common_symptoms'])
        confidence = min(95.0, (max_score / max_possible_score) * 100 * duration_multiplier)
        confidence = max(65.0, confidence)  # Minimum 65% for symptom-based analysis
    
    # Generate recommendation
    recommendations = {
        "Skin Allergy": "Consult a veterinarian for allergy testing. Consider hypoallergenic diet and identify potential allergens in the environment.",
        "Flea Infestation": "Apply flea treatment immediately. Clean pet's environment thoroughly including bedding and carpets. Treat all pets in household.",
        "Ringworm": "Isolate pet and seek immediate veterinary treatment. Highly contagious to humans and other pets. Follow strict hygiene protocols.",
        "Hot Spots": "Keep area clean and dry. Prevent pet from scratching or licking. Veterinary treatment may include antibiotics and topical medications.",
        "Mange": "Requires immediate veterinary attention. Highly contagious to other pets. Follow veterinarian's treatment plan strictly.",
        "Ear Infection": "Clean ears gently with veterinarian-recommended solution. Avoid inserting objects into ear canal. Veterinary examination recommended.",
        "Dermatitis": "Identify and remove potential irritants. Keep affected area clean. Topical treatment may be needed. Consult veterinarian if persists."
    }
    
    recommendation = recommendations.get(top_disease, "Consult a veterinarian for proper diagnosis and treatment.")
    
    # If no specific symptoms detected, add general ones
    if not detected_symptoms:
        detected_symptoms = ['Symptoms described by owner', 'Requires visual examination']
    
    return {
        "disease": top_disease,
        "confidence": round(confidence, 1),
        "recommendation": recommendation,
        "detectedSymptoms": detected_symptoms,
        "analysisType": "symptom_based"
    }

def main():
    """
    Main function to handle command-line symptom analysis
    
    Usage:
        python analyze_symptoms.py <symptoms_text> [duration]
    """
    try:
        if len(sys.argv) < 2:
            # Read from stdin
            symptoms_text = sys.stdin.read().strip()
            duration = sys.argv[1] if len(sys.argv) > 1 else ''
        else:
            symptoms_text = sys.argv[1]
            duration = sys.argv[2] if len(sys.argv) > 2 else ''
        
        if not symptoms_text:
            raise ValueError("No symptoms provided")
        
        # Analyze symptoms
        result = analyze_symptoms(symptoms_text, duration)
        
        # Output JSON result
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "disease": "Unknown",
            "confidence": 0.0,
            "recommendation": "Please provide detailed symptom description."
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()

