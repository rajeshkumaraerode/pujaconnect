import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  status: { type: String, enum: ['Pending', 'Confirmed', 'In Progress', 'Completed'], required: true },
  note: { type: String, trim: true, maxlength: 300 },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String, default: 'Admin' }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  bookingCode: { type: String, unique: true, index: true },
  devotee: {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true, required: true },
  },
  puja: { type: String, required: true, trim: true },
  bookingDate: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0 },
  paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Refunded'], default: 'Unpaid' },
  status: { type: String, enum: ['Pending', 'Confirmed', 'In Progress', 'Completed'], default: 'Pending' },
  notes: { type: String, trim: true, maxlength: 1000 },
  history: { type: [historySchema], default: [] }
}, { timestamps: true });

bookingSchema.pre('save', function(next) {
  if (!this.bookingCode) this.bookingCode = `PUJ-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random()*900)}`;
  next();
});
export default mongoose.model('Booking', bookingSchema);
