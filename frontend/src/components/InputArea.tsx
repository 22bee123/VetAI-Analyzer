import React, { useState } from 'react';

interface InputAreaProps {
  onSubmit: (petType: string, petProblem: string) => void;
  isLoading?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSubmit, isLoading = false }) => {
  const [petType, setPetType] = useState('');
  const [otherPetType, setOtherPetType] = useState('');
  const [petProblem, setPetProblem] = useState('');
  const [errors, setErrors] = useState({ petType: '', otherPetType: '', petProblem: '' });

  const validateInputs = (): boolean => {
    const newErrors = { petType: '', otherPetType: '', petProblem: '' };
    let isValid = true;

    if (!petType.trim()) {
      newErrors.petType = 'Please select your pet type';
      isValid = false;
    }

    if (petType === 'Other' && !otherPetType.trim()) {
      newErrors.otherPetType = 'Please specify your pet type';
      isValid = false;
    }

    if (!petProblem.trim()) {
      newErrors.petProblem = 'Please describe your pet\'s problem';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateInputs()) {
      // If "Other" is selected, use the custom pet type entered by the user
      const finalPetType = petType === 'Other' ? otherPetType : petType;
      onSubmit(finalPetType, petProblem);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Analyze Your Pet's Health</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="petType" className="block text-gray-700 font-medium mb-2">
            What type of pet do you have?
          </label>
          <select
            id="petType"
            value={petType}
            onChange={(e) => setPetType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">Select pet type</option>
            <option value="Dog">Dog</option>
            <option value="Cat">Cat</option>
            <option value="Bird">Bird</option>
            <option value="Rabbit">Rabbit</option>
            <option value="Hamster">Hamster</option>
            <option value="Guinea Pig">Guinea Pig</option>
            <option value="Fish">Fish</option>
            <option value="Reptile">Reptile</option>
            <option value="Horse">Horse</option>
            <option value="Other">Other</option>
          </select>
          {errors.petType && (
            <p className="text-red-500 text-sm mt-1">{errors.petType}</p>
          )}
        </div>
        
        {petType === 'Other' && (
          <div className="mb-4">
            <label htmlFor="otherPetType" className="block text-gray-700 font-medium mb-2">
              Please specify your pet type
            </label>
            <input
              type="text"
              id="otherPetType"
              value={otherPetType}
              onChange={(e) => setOtherPetType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your pet type..."
              disabled={isLoading}
            />
            {errors.otherPetType && (
              <p className="text-red-500 text-sm mt-1">{errors.otherPetType}</p>
            )}
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="petProblem" className="block text-gray-700 font-medium mb-2">
            What problem is your pet experiencing?
          </label>
          <textarea
            id="petProblem"
            value={petProblem}
            onChange={(e) => setPetProblem(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
            placeholder="Describe your pet's symptoms or problems in detail..."
            disabled={isLoading}
          ></textarea>
          {errors.petProblem && (
            <p className="text-red-500 text-sm mt-1">{errors.petProblem}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 transition-colors"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Symptoms'}
        </button>
      </form>
    </div>
  );
};

export default InputArea;
