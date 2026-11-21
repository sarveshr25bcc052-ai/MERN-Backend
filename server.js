import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Appointment, ContactMessage } from './models.js';
import { requireAuth, requireAdmin } from './middleware.js';


const app = express();
const PORT = Number(process.env.PORT || 5000);

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Copy .env.example to .env and set a strong secret.');
  process.exit(1);
}
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));


app.get('/', (_req, res) => res.json({ message: 'Life Care Hospital API is running' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Auth: signup
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: 'Email already registered.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const role = normalizedEmail === (process.env.ADMIN_EMAIL || '').toLowerCase() ? 'admin' : 'patient';
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash, role });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email already registered.' });
    console.error(err); res.status(500).json({ message: 'Could not register user.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password.' });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not log in.' }); }
});
app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('name email role');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user });
});

// Appointment booking
app.post('/api/appointments', async (req, res) => {
  try {
    const { patientName, email, phone, department, doctor, date, time, message } = req.body || {};
    if (![patientName, email, phone, department, date, time].every(v => typeof v === 'string' && v.trim())) return res.status(400).json({ message: 'Please complete all required appointment fields.' });
    const appointment = await Appointment.create({ patientName, email, phone, department, doctor, date, time, message });
    res.status(201).json({ message: 'Appointment request saved.', appointment });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not save appointment.' }); }
});
app.get('/api/appointments', requireAuth, requireAdmin, async (_req, res) => {
  const appointments = await Appointment.find().sort({ createdAt: -1 });
  res.json({ appointments });
});
app.patch('/api/appointments/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const allowed = ['pending', 'confirmed', 'cancelled'];
  if (!allowed.includes(req.body?.status)) return res.status(400).json({ message: 'Invalid status.' });
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
  res.json({ appointment });
});

// Contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (![name, email, message].every(v => typeof v === 'string' && v.trim())) return res.status(400).json({ message: 'Name, email and message are required.' });
    const saved = await ContactMessage.create({ name, email, subject, message });
    res.status(201).json({ message: 'Your message has been received.', id: saved._id });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Could not save contact message.' }); }
});
app.get('/api/contact', requireAuth, requireAdmin, async (_req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 });
  res.json({ messages });
});

// Patient listing (admin only)
app.get('/api/patients', requireAuth, requireAdmin, async (_req, res) => {
  const patients = await User.find({ role: 'patient' }).select('name email createdAt').sort({ createdAt: -1 });
  res.json({ patients });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});


mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Life Care Hospital API listening on http://localhost:${PORT}`));
  })
  .catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
