import { Router } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
const statuses = ['Pending', 'Confirmed', 'In Progress', 'Completed'];

router.get('/stats', async (_req, res) => {
  const [total, pending, confirmed, inProgress, completed, revenue] = await Promise.all([
    Booking.countDocuments(), Booking.countDocuments({status:'Pending'}),
    Booking.countDocuments({status:'Confirmed'}), Booking.countDocuments({status:'In Progress'}),
    Booking.countDocuments({status:'Completed'}),
    Booking.aggregate([{ $match: { paymentStatus: 'Paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
  ]);
  const monthly = await Booking.aggregate([
    { $match: { createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth()-5, 1) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, bookings: { $sum: 1 }, revenue: { $sum: '$amount' } } },
    { $sort: { _id: 1 } }
  ]);
  res.json({ total, pending, confirmed, inProgress, completed, revenue: revenue[0]?.total || 0, monthly });
});

router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const filter = {};
  if (req.query.status && statuses.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.puja) filter.puja = req.query.puja;
  if (req.query.from || req.query.to) {
    filter.bookingDate = {};
    if (req.query.from) filter.bookingDate.$gte = new Date(req.query.from);
    if (req.query.to) { const end = new Date(req.query.to); end.setHours(23,59,59,999); filter.bookingDate.$lte = end; }
  }
  if (req.query.search) {
    const safe = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ bookingCode: new RegExp(safe,'i') }, { 'devotee.name': new RegExp(safe,'i') }, { puja: new RegExp(safe,'i') }];
  }
  const sortKey = ['bookingDate','amount','createdAt'].includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
  const sort = req.query.order === 'asc' ? 1 : -1;
  const [items, total] = await Promise.all([
    Booking.find(filter).sort({[sortKey]:sort}).skip((page-1)*limit).limit(limit),
    Booking.countDocuments(filter)
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total/limit)) });
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({message:'Invalid booking ID'});
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({message:'Booking not found'});
  res.json(booking);
});

router.post('/', async (req, res) => {
  const { name, email, phone, puja, bookingDate, amount, paymentStatus, notes } = req.body;
  if (!name?.trim() || !phone?.trim() || !puja?.trim() || !bookingDate || amount === undefined) {
    return res.status(400).json({message:'Name, phone, puja, date and amount are required'});
  }
  const booking = await Booking.create({
    devotee:{name, email, phone}, puja, bookingDate, amount: Number(amount),
    paymentStatus: paymentStatus || 'Unpaid', notes,
    history:[{status:'Pending', note:'Booking created'}]
  });
  res.status(201).json(booking);
});

router.patch('/:id/status', async (req, res) => {
  const { status, note } = req.body;
  if (!statuses.includes(status)) return res.status(400).json({message:'Invalid booking status'});
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({message:'Booking not found'});
  booking.status = status;
  booking.history.push({status, note: note || `Status changed to ${status}`, changedBy:req.admin.name});
  await booking.save();
  res.json(booking);
});
export default router;
