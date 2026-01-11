import React, { useState, useRef } from 'react';
import { FiArrowLeft, FiCamera, FiUpload, FiCheck, FiX } from 'react-icons/fi';
import { addListing } from '../../utils/marketplaceStore';
import API from '../../api/client';

const AddPetListing = ({ onBack, onSubmit }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    price: '',
    type: 'For Sale',
    description: '',
    location: '',
    gender: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG)');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('Image size must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await API.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.url) {
        setUploadedImageUrl(data.url);
        console.log('[AddPetListing] Image uploaded successfully:', data.url);
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setUploadedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields (matching backend requirements)
    if (!formData.name || !formData.age || !formData.price || !formData.location || !formData.description) {
        alert('Please fill in all required fields:\n- Pet Name\n- Age\n- Price\n- Location\n- Description');
        return;
    }

    if (!uploadedImageUrl && !preview) {
        alert('Please upload a pet photo');
        return;
    }
    
    // Use uploaded image URL (from Cloudinary) or fallback to base64 preview
    const imageUrl = uploadedImageUrl || preview;
    
    const newListing = {
        name: formData.name.trim(),
        breed: formData.breed.trim() || 'Unknown',
        age: formData.age.trim(),
        price: formData.price.trim(),
        location: formData.location.trim(),
        type: formData.type,
        description: formData.description.trim(),
        gender: formData.gender.trim() || undefined,
        image: imageUrl
    };
    
    try {
        console.log('[AddPetListing] Submitting listing:', { ...newListing, image: imageUrl ? 'provided' : 'missing' });
        const result = await addListing(newListing);
        console.log('[AddPetListing] Listing created successfully:', result);
        alert('Pet listing created successfully!');
        onSubmit();
    } catch (error) {
        console.error("Failed to add listing", error);
        const errorMessage = error.response?.data?.message || error.message || "Failed to create listing. Please try again.";
        alert(errorMessage);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-100 p-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <FiArrowLeft className="text-xl text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">List a Pet</h1>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Pet Photo *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors group relative overflow-hidden ${
                uploading 
                  ? 'border-blue-300 bg-blue-50 cursor-wait' 
                  : preview 
                    ? 'border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              {preview ? (
                <div className="relative">
                  <img 
                    src={preview} 
                    alt="Pet preview" 
                    className="max-h-64 mx-auto rounded-lg object-cover"
                  />
                  {!uploading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <FiX size={18} />
                    </button>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white font-medium">Uploading...</div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform ${
                    uploading ? 'bg-blue-100 text-blue-600' : 'bg-blue-50 text-blue-600 group-hover:scale-110'
                  }`}>
                    {uploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    ) : (
                      <FiCamera className="text-2xl" />
                    )}
                  </div>
                  <p className="font-bold text-gray-900">{uploading ? 'Uploading...' : 'Upload Photos'}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {uploading ? 'Please wait...' : 'Drag & drop or click to browse'}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">JPG, PNG, WEBP up to 10MB</p>
                </>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Pet Name *</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Bella"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Breed</label>
              <input 
                type="text" 
                name="breed"
                value={formData.breed}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Golden Retriever"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Age *</label>
              <input 
                type="text" 
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 2 years"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Price *</label>
              <input 
                type="text" 
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. $500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Listing Type</label>
              <select 
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="For Sale">For Sale</option>
                <option value="Adoption">Adoption</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Location *</label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. New York, NY"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
              <select 
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Tell us more about the pet..."
            ></textarea>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              <FiCheck />
              Publish Listing
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddPetListing;
