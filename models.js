import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['patient', 'admin'], default: 'patient' }
}, { timestamps: true });

const appointmentSchema = new mongoose.Schema({
  patientName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  doctor: { type: String, default: 'Any available doctor', trim: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  message: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  subject: { type: String, default: '', trim: true },
  message: { type: String, required: true, trim: true }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
export const Appointment = mongoose.model('Appointment', appointmentSchema);
export const ContactMessage = mongoose.model('ContactMessage', contactSchema);
