import React from 'react';

const FormActions = ({ onNavigate, onSubmit, isEdit = false }) => {
  return (
    <div className="mt-8 bg-white border-t border-gray-200 p-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="text-xs text-gray-500">* Required fields</p>
      <div className="flex items-center gap-3 w-full md:w-auto">
        <button 
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="flex-1 md:flex-none px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={() => {
             if (onSubmit) {
                onSubmit();
             } else {
                alert(isEdit ? 'Pet Updated Successfully!' : 'Pet Added Successfully!');
                onNavigate && onNavigate('dashboard');
             }
          }}
          className="flex-1 md:flex-none px-6 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors shadow-sm"
        >
          {isEdit ? 'Update Pet' : 'Add Pet'}
        </button>
      </div>
    </div>
  );
};

export default FormActions;
