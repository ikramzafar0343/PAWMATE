import API from '../api/client';

export const getDiagnoses = async (petId) => {
  try {
    if (!petId) return [];
    const startTime = performance.now();
    const { data } = await API.get(`/medical-records/${petId}?type=AI Diagnosis&limit=50`);
    const endTime = performance.now();
    console.log(`[Performance] getDiagnoses: ${(endTime - startTime).toFixed(2)}ms`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching AI diagnoses", error);
    return [];
  }
};

export const getAverageHealthScore = async (petId) => {
  try {
    const diagnoses = await getDiagnoses(petId);
    if (diagnoses.length === 0) return 0;
    
    // Parse score from details.score
    const totalScore = diagnoses.reduce((sum, d) => {
        const score = parseInt(d.details?.score || '0');
        return sum + score;
    }, 0);
    
    return Math.round(totalScore / diagnoses.length);
  } catch (error) {
    console.error("Error calculating average health score", error);
    return 0;
  }
};

export const addDiagnosis = async (petId, diagnosis) => {
  try {
    // diagnosis: { type, score, status, ... }
    const record = {
        petId,
        type: 'AI Diagnosis',
        title: diagnosis.type || 'AI Health Scan',
        date: diagnosis.date || new Date().toISOString().split('T')[0],
        details: {
            score: String(diagnosis.score),
            status: diagnosis.status,
            diagnosisType: diagnosis.type,
            risk: diagnosis.risk || 'Unknown',
            severityScore: String(diagnosis.severityScore || 0),
            symptoms: JSON.stringify(diagnosis.symptoms || [])
        }
    };
    
    const { data } = await API.post('/medical-records', record);
    
    // Dispatch event to update stats and history
    window.dispatchEvent(new Event('diagnosisUpdate'));
    
    return data;
  } catch (error) {
    console.error("Error adding diagnosis", error);
    throw error;
  }
};

// Map detections to the same store/backend type
export const getDetections = async (petId) => {
    if (!petId) {
        console.warn('[getDetections] No petId provided, returning empty array');
        return [];
    }
    // console.log(`[getDetections] Fetching detections for petId: ${petId}`);
    const records = await getDiagnoses(petId);
    // console.log(`[getDetections] Received ${records?.length || 0} detections`);
    
    return records.map(record => {
        const details = record.details || {};
        
        // Extract disease name
        let condition = details.disease || details.diagnosis || details.diagnosisType || record.title || 'Unknown';
        
        // Clean up title/condition if needed
        if (condition && typeof condition === 'string') {
            if (condition.includes('AI Symptom Analysis: ')) {
                condition = condition.replace('AI Symptom Analysis: ', '');
            }
            if (condition.includes('AI Detection: ')) {
                condition = condition.replace('AI Detection: ', '');
            }
            if (condition.includes('AI Diagnosis: ')) {
                condition = condition.replace('AI Diagnosis: ', '');
            }
        }

        // Parse symptoms
        let symptoms = [];
        try {
            if (details.symptoms) {
                symptoms = typeof details.symptoms === 'string' 
                    ? JSON.parse(details.symptoms) 
                    : details.symptoms;
            }
        } catch (e) {
            // console.warn('Failed to parse symptoms', e);
        }

        let severityScore = parseFloat(details.score || details.severityScore || 0);
        
        // Normalize score to 0-100 if it seems to be 0-1
        if (severityScore > 0 && severityScore <= 1) {
            severityScore = severityScore * 100;
        }

        // Determine risk level based on score if not explicit
        let risk = details.risk || details.status;
        if (!risk) {
            if (severityScore >= 80) risk = 'High';
            else if (severityScore >= 50) risk = 'Moderate';
            else risk = 'Low';
        }

        return {
            id: record._id || record.id,
            petId: record.petId,
            condition: condition,
            risk: risk,
            severityScore: severityScore,
            symptoms: symptoms,
            date: record.date,
            details: details, // Pass through details for compatibility
            raw: record
        };
    });
};

export const addDetection = async (petId, detection) => {
    return await addDiagnosis(petId, {
        type: detection.condition || 'Health Issue',
        score: 100 - (detection.severityScore || 0), // Inverse of severity for score
        status: detection.risk,
        ...detection
    });
};

export const getLastScanDate = async (petId) => {
  try {
    const list = await getDiagnoses(petId);
    if (list.length === 0) return null;
    // Sort by date desc
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list[0].date;
  } catch (error) {
    return null;
  }
};

export const deleteDetection = async (id) => {
    try {
        if (!id) {
          console.warn('[deleteDetection] No id provided');
          return false;
        }

        // Support prefixed IDs like "detection_<id>"
        const idStr = String(id);
        const normalizedId = idStr.startsWith('detection_') ? idStr.replace(/^detection_/, '') : idStr;

        await API.delete(`/medical-records/${normalizedId}`);
        
        // Dispatch event to update stats and history
        window.dispatchEvent(new Event('diagnosisUpdate'));
        window.dispatchEvent(new Event('medicalRecordUpdate'));
        
        return true;
    } catch (error) {
        // If it's already gone, treat as success and refresh UI
        if (error?.response?.status === 404) {
          console.warn('[deleteDetection] Record not found (already deleted?)', { id });
          window.dispatchEvent(new Event('diagnosisUpdate'));
          return true;
        }

        console.error("Error deleting detection", error);
        throw error;
    }
};
