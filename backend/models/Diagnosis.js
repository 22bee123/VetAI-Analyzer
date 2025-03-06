import mongoose from 'mongoose';

const DiagnosisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  animalType: {
    type: String,
    required: [true, 'Please specify the animal type'],
    trim: true
  },
  symptoms: {
    type: String,
    required: [true, 'Please describe the symptoms'],
    trim: true
  },
  aiAnalysis: {
    type: String,
    required: true
  },
  possibleConditions: [{
    condition: String,
    probability: String,
    description: String
  }],
  recommendations: {
    type: String
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Diagnosis = mongoose.model('Diagnosis', DiagnosisSchema);

export default Diagnosis;
