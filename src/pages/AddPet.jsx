import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import PhotoUpload from '../components/addPet/PhotoUpload';
import BasicInfoForm from '../components/addPet/BasicInfoForm';
import FormActions from '../components/addPet/FormActions';
import { addPet, updatePet, getPetById } from '../utils/petStore';

const AddPet = ({ onNavigate }) => {
  const location = useLocation();
  const { petId } = useParams();
  const [petToEdit, setPetToEdit] = useState(location.state?.pet || null);
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [petImage, setPetImage] = useState(null);
  
  // Initial empty form state
  const [formData, setFormData] = useState({
        petName: '',
        species: '',
        breed: '',
        age: '',
        gender: 'Male',
        weight: '',
        weightUnit: 'kg',
        color: '',
        microchipNumber: '',
  });

  useEffect(() => {
      const loadPet = async () => {
          if (petId) {
              const pet = await getPetById(petId);
              if (pet) {
                  setPetToEdit(pet);
                  setIsEdit(true);
                  populateForm(pet);
              }
          } else if (location.state?.pet) {
              setPetToEdit(location.state.pet);
              setIsEdit(true);
              populateForm(location.state.pet);
          }
      };
      loadPet();
  }, [petId, location.state]);

  const populateForm = (pet) => {
    const ageMatch = pet.age ? pet.age.match(/(\d+)/) : null;
    const age = ageMatch ? ageMatch[0] : '';
    const weightMatch = pet.weight ? pet.weight.match(/(\d+)/) : null;
    const weight = weightMatch ? weightMatch[0] : '';
    
    setFormData({
      id: pet._id || pet.id,
      petName: pet.name || '',
      breed: pet.breed || '',
      age: age,
      weight: weight,
      gender: pet.gender || 'Male',
      species: pet.species || '',
      weightUnit: 'kg',
      color: pet.color || '',
      microchipNumber: pet.microchipNumber || '',
    });
    
    // Set initial image if editing
    if (pet.image) {
      setPetImage(pet.image);
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleGenderSelect = (gender) => {
    setFormData({ ...formData, gender });
  };

  const handleSubmit = async () => {
    if (!formData.petName || !formData.breed) {
      alert('Please enter pet name and breed.');
      return;
    }
    if (formData.age && isNaN(Number(formData.age))) {
      alert('Age must be a number.');
      return;
    }
    if (formData.weight && isNaN(Number(formData.weight))) {
      alert('Weight must be a number.');
      return;
    }
    
    setIsLoading(true);

    const petData = {
      name: formData.petName || 'New Pet',
      breed: formData.breed || 'Unknown',
      age: formData.age ? `${formData.age} years` : 'Unknown',
      weight: formData.weight ? `${formData.weight} ${formData.weightUnit}` : 'Unknown',
      image: petImage || petToEdit?.image || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      status: formData.vaccinationStatus || 'Up to date',
      statusColor: formData.vaccinationStatus === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
      gender: formData.gender,
      species: formData.species,
      color: formData.color,
      microchipNumber: formData.microchipNumber
    };
    
    try {
        if (isEdit) {
          const updated = await updatePet({ ...petData, id: formData.id, _id: formData.id });
          alert('Pet Profile Updated Successfully!');
          onNavigate && onNavigate('petDetails', { ...updated });
        } else {
          const created = await addPet(petData);
          alert('Pet Added Successfully!');
          onNavigate && onNavigate('petDetails', { ...created });
        }
    } catch (error) {
        alert('Error saving pet: ' + (error.response?.data?.message || error.message));
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Pet Profile' : 'Register New Pet'}</h1>
          <p className="text-gray-500">{isEdit ? 'Update your pet\'s information' : 'Add your pet\'s information to get started with care'}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          <PhotoUpload 
            onImageChange={setPetImage}
            initialImage={petImage || petToEdit?.image}
          />

          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <BasicInfoForm 
              formData={formData} 
              handleInputChange={handleInputChange} 
              handleGenderSelect={handleGenderSelect} 
            />
            
          </form>
        </div>

        <FormActions onNavigate={onNavigate} onSubmit={handleSubmit} isEdit={isEdit} />
      </div>

      {/* Copyright Footer */}
      <footer className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-gray-200 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>© 2024 PetCare Pro. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900">Terms</a>
            <a href="#" className="hover:text-gray-900">Privacy</a>
            <a href="#" className="hover:text-gray-900">Support</a>
            <a href="#" className="hover:text-gray-900">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AddPet;
