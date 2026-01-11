import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiX, FiSave } from 'react-icons/fi';
import { MEDICAL_RECORD_TYPES, addMedicalRecord, updateMedicalRecord } from '../../utils/medicalRecordStore';
import { getPets } from '../../utils/petStore';
import { getVets } from '../../utils/vetStore';

const AddMedicalRecordModal = ({ isOpen, onClose, initialData = null, title = "Add New Medical Record", petId = null }) => {
  const { petId: routePetId } = useParams();
  const [resolvedPetId, setResolvedPetId] = useState(null);
  const [loadingPetId, setLoadingPetId] = useState(false);
  const [type, setType] = useState(() => initialData?.type || MEDICAL_RECORD_TYPES.TREATMENT);
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      // Extract vetName and clinicName from details if they exist
      const details = initialData.details || {};
      return {
        date: initialData.date || new Date().toISOString().split('T')[0],
        time: initialData.time || '',
        vetName: initialData.vetName || details.vetName || '',
        clinicName: initialData.clinicName || details.clinicName || '',
        title: initialData.title || '',
        details: typeof details === 'object' && !Array.isArray(details) ? details : {},
        attachments: initialData.attachments || []
      };
    }
    return {
      date: new Date().toISOString().split('T')[0],
      time: '',
      vetName: '',
      clinicName: '',
      title: '',
      details: {},
      attachments: []
    };
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [vets, setVets] = useState([]);
  const [loadingVets, setLoadingVets] = useState(false);
  const [selectedVetId, setSelectedVetId] = useState('');
  const [timeOptions] = useState(() => {
    const opts = [];
    for (let h = 0; h < 24; h++) {
      for (let m of [0, 30]) {
        const date = new Date();
        date.setHours(h, m, 0, 0);
        const label = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        opts.push(label);
      }
    }
    return opts;
  });

  // Resolve petId from multiple sources
  useEffect(() => {
    const resolvePetId = async () => {
      if (!isOpen) {
        setResolvedPetId(null);
        return;
      }

      setLoadingPetId(true);
      try {
        // Priority 1: Use petId from props
        if (petId && petId !== 'null' && petId !== 'undefined' && petId !== '1') {
          setResolvedPetId(petId);
          setLoadingPetId(false);
          return;
        }

        // Priority 2: Use petId from initialData
        if (initialData?.petId && initialData.petId !== 'null' && initialData.petId !== 'undefined' && initialData.petId !== '1') {
          setResolvedPetId(initialData.petId);
          setLoadingPetId(false);
          return;
        }

        // Priority 3: Use petId from route params
        if (routePetId && routePetId !== 'null' && routePetId !== 'undefined' && routePetId !== '1') {
          setResolvedPetId(routePetId);
          setLoadingPetId(false);
          return;
        }

        // Priority 4: Use petId from localStorage
        const storedPetId = localStorage.getItem('pawmate_selected_pet_id');
        if (storedPetId && storedPetId !== 'null' && storedPetId !== 'undefined' && storedPetId !== '1') {
          setResolvedPetId(storedPetId);
          setLoadingPetId(false);
          return;
        }

        // Priority 5: Get first pet from API
        const pets = await getPets();
        if (pets && pets.length > 0) {
          const firstPetId = pets[0]._id || pets[0].id;
          if (firstPetId) {
            setResolvedPetId(firstPetId);
            localStorage.setItem('pawmate_selected_pet_id', firstPetId);
          }
        }
      } catch (error) {
        console.error('Error resolving petId:', error);
      } finally {
        setLoadingPetId(false);
      }
    };

    resolvePetId();
  }, [isOpen, petId, initialData?.petId, routePetId]);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      // Load veterinarians for dropdown
      setLoadingVets(true);
      getVets()
        .then(list => {
          setVets(Array.isArray(list) ? list : []);
          // Attempt to preselect vet from initialData by name
          if (initialData?.vetName && Array.isArray(list) && list.length > 0) {
            const match = list.find(v => (v.name || v.fullName || v.email) === initialData.vetName);
            if (match) {
              setSelectedVetId(match._id || match.id || '');
              setFormData(prev => ({
                ...prev,
                vetName: match.name || match.fullName || match.email || '',
                clinicName: match.clinicName || ''
              }));
            }
          }
        })
        .catch(() => setVets([]))
        .finally(() => setLoadingVets(false));

      if (initialData) {
        const details = initialData.details || {};
        setFormData({
          date: initialData.date || new Date().toISOString().split('T')[0],
          time: initialData.time || '',
          vetName: initialData.vetName || details.vetName || '',
          clinicName: initialData.clinicName || details.clinicName || '',
          title: initialData.title || '',
          details: typeof details === 'object' && !Array.isArray(details) ? details : {},
          attachments: initialData.attachments || []
        });
        setType(initialData.type || MEDICAL_RECORD_TYPES.TREATMENT);
      } else {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          vetName: '',
          clinicName: '',
          title: '',
          details: {},
          attachments: []
        });
        setType(MEDICAL_RECORD_TYPES.TREATMENT);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      details: { ...prev.details, [name]: value }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!resolvedPetId) {
      if (loadingPetId) {
        newErrors.petId = 'Loading pet information...';
      } else {
        newErrors.petId = 'Pet ID is required. Please select a pet first or add a pet.';
      }
    }
    
    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    // Validate file sizes (10MB max)
    if (formData.attachments && formData.attachments.length > 0) {
      const oversizedFiles = formData.attachments.filter(f => f.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        newErrors.attachments = `Files exceed 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!resolvedPetId) {
      if (loadingPetId) {
        setErrors({ petId: 'Please wait while we load pet information...' });
      } else {
        setErrors({ petId: 'Pet ID is required. Please select a pet first or add a pet.' });
        alert('Please select a pet first. You can add a pet from the "My Pets" section.');
      }
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Ensure petId refers to an existing pet; fallback to first available if mismatch
      let finalPetId = resolvedPetId;
      try {
        const pets = await getPets();
        const exists = Array.isArray(pets) && pets.find(p => (p._id || p.id) === resolvedPetId);
        if (!exists && pets && pets.length > 0) {
          finalPetId = pets[0]._id || pets[0].id;
          localStorage.setItem('pawmate_selected_pet_id', finalPetId);
        }
      } catch {
        // If pets check fails, keep resolvedPetId and let backend validate
      }

      // Prepare details object - include vetName and clinicName in details
      const detailsMap = {
        ...formData.details,
        ...(formData.vetName && { vetName: formData.vetName }),
        ...(formData.clinicName && { clinicName: formData.clinicName })
      };

      // Convert details object to Map format (backend expects Map with string values)
      const details = {};
      Object.keys(detailsMap).forEach(key => {
        if (detailsMap[key] !== null && detailsMap[key] !== undefined && detailsMap[key] !== '') {
          details[key] = String(detailsMap[key]);
        }
      });

      // Prepare attachments - store base64 strings for now
      // In production, you'd upload to Cloudinary/S3 and store URLs
      const attachments = (formData.attachments || []).map(file => {
        // If it's already a string (URL), return it; otherwise return base64 data
        return typeof file === 'string' ? file : (file.data || file.url || '');
      }).filter(Boolean);

      const recordData = {
        petId: finalPetId,
        type,
        date: formData.date,
        time: formData.time || undefined,
        title: formData.title.trim(),
        details,
        ...(attachments.length > 0 && { attachments }),
        // Include vet information at top level for easier access
        ...(selectedVetId && { vetId: selectedVetId }),
        ...(formData.vetName && { vetName: formData.vetName }),
        ...(formData.clinicName && { clinicName: formData.clinicName })
      };

      if (initialData && initialData._id) {
        await updateMedicalRecord({ ...recordData, id: initialData._id });
      } else {
        await addMedicalRecord(recordData);
      }
      
      window.dispatchEvent(new Event('medicalRecordUpdate'));
      onClose();
    } catch (error) {
      console.error("Error saving medical record", error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save record. Please try again.';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Record Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Record Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Object.values(MEDICAL_RECORD_TYPES).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  errors.date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="text-xs text-red-600 mt-1">{errors.date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <select
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">{'Select Time'}</option>
                {formData.time && !timeOptions.includes(formData.time) && (
                  <option value={formData.time}>{formData.time}</option>
                )}
                {timeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Veterinarian</label>
              {vets.length > 0 ? (
                <select
                  name="vetId"
                  value={selectedVetId}
                  onChange={(e) => {
                    const vetId = e.target.value;
                    setSelectedVetId(vetId);
                    const match = vets.find(v => (v._id || v.id) === vetId);
                    if (match) {
                      setFormData(prev => ({
                        ...prev,
                        vetName: match.name || match.fullName || match.email || '',
                        clinicName: match.clinicName || ''
                      }));
                    } else {
                      setFormData(prev => ({ ...prev, vetName: '', clinicName: '' }));
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">{loadingVets ? 'Loading...' : 'Select Veterinarian'}</option>
                  {vets.map((v) => (
                    <option key={v._id || v.id} value={v._id || v.id}>
                      {v.name || v.fullName || v.email}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="vetName"
                  value={formData.vetName}
                  onChange={handleInputChange}
                  placeholder="Dr. Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinic/Hospital</label>
              <input
                type="text"
                name="clinicName"
                value={formData.clinicName}
                onChange={() => {}}
                disabled
                placeholder="Clinic Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title/Summary</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g. Annual Vaccination"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Dynamic Fields based on Type */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">{type} Details</h3>
            
            {type === 'Vaccination' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Vaccine Name</label>
                  <input
                    type="text"
                    name="vaccine"
                    value={formData.details.vaccine || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Batch Number</label>
                  <input
                    type="text"
                    name="batchNumber"
                    value={formData.details.batchNumber || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Next Due Date</label>
                  <input
                    type="date"
                    name="nextDue"
                    value={formData.details.nextDue || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Side Effects</label>
                  <input
                    type="text"
                    name="sideEffects"
                    value={formData.details.sideEffects || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            )}

             {type === 'Prescription' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Medication</label>
                  <input
                    type="text"
                    name="medication"
                    value={formData.details.medication || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Dosage</label>
                  <input
                    type="text"
                    name="dosage"
                    value={formData.details.dosage || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Duration</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.details.duration || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                 <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Instructions</label>
                  <input
                    type="text"
                    name="instructions"
                    value={formData.details.instructions || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            )}
            
            {type === 'Lab Result' && (
                 <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Results Summary</label>
                  <textarea
                    name="results"
                    rows={3}
                    value={formData.details.results || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                </div>
            )}

            {type === 'Vet Note' && (
                 <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Examination Notes</label>
                        <textarea
                            name="notes"
                            rows={3}
                            value={formData.details.notes || ''}
                            onChange={handleDetailChange}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Recommendations</label>
                        <textarea
                            name="recommendations"
                            rows={2}
                            value={formData.details.recommendations || ''}
                            onChange={handleDetailChange}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                </div>
            )}
            
            {['Treatment'].includes(type) && (
                 <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes/Details</label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={formData.details.notes || ''}
                    onChange={handleDetailChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                  />
                </div>
            )}
          </div>

          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments (Images/Reports)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  
                  // Validate file sizes
                  const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024);
                  if (oversizedFiles.length > 0) {
                    setErrors({ attachments: `Files exceed 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}` });
                    e.target.value = ''; // Clear input
                    return;
                  }

                  // Store file names and convert to base64 for now (in production, upload to cloud storage)
                  const filePromises = files.map(file => {
                    return new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onerror = reject;
                      reader.onloadend = () => {
                        resolve({
                          name: file.name,
                          type: file.type,
                          size: file.size,
                          data: reader.result // Base64 string
                        });
                      };
                      reader.readAsDataURL(file);
                    });
                  });
                  
                  Promise.all(filePromises)
                    .then(fileData => {
                      setFormData(prev => ({
                        ...prev,
                        attachments: [...(prev.attachments || []), ...fileData]
                      }));
                      setErrors(prev => ({ ...prev, attachments: undefined }));
                    })
                    .catch(error => {
                      console.error('Error reading files:', error);
                      setErrors({ attachments: 'Error reading files. Please try again.' });
                    });
                  
                  // Reset input to allow selecting same file again
                  e.target.value = '';
                }}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-2">Upload images, PDFs, or documents (Max 10MB per file)</p>
              {errors.attachments && (
                <p className="text-xs text-red-600 mt-1">{errors.attachments}</p>
              )}
              {formData.attachments && formData.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
                      <span className="text-gray-700">{file.name || (typeof file === 'string' ? 'Attachment' : 'File')}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            attachments: prev.attachments.filter((_, i) => i !== idx)
                          }));
                          setErrors(prev => ({ ...prev, attachments: undefined }));
                        }}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pet ID Status */}
          {loadingPetId && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
              <span>Loading pet information...</span>
            </div>
          )}

          {!loadingPetId && !resolvedPetId && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-medium mb-1">No pet selected</p>
              <p className="text-xs">Please select a pet from "My Pets" or add a new pet first.</p>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Field Errors */}
          {(errors.title || errors.date || errors.petId) && !loadingPetId && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <ul className="list-disc list-inside">
                {errors.petId && <li>{errors.petId}</li>}
                {errors.title && <li>{errors.title}</li>}
                {errors.date && <li>{errors.date}</li>}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingPetId || !resolvedPetId}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave />
              {loading ? 'Saving...' : loadingPetId ? 'Loading...' : !resolvedPetId ? 'Select Pet First' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicalRecordModal;
