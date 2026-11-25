import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from './models/Admin.js';
import Booking from './models/Booking.js';

await mongoose.connect(process.env.MONGO_URI);
const email = (process.env.ADMIN_EMAIL || 'admin@pujaconnect.com').toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'PujaAdmin@123';
const hash = await bcrypt.hash(password, 12);
await Admin.findOneAndUpdate({email}, {name:'Temple Administrator', email, password:hash}, {upsert:true, new:true});
if (await Booking.countDocuments() === 0) {
  const examples = [
    ['Ananya Sharma','ananya@example.com','9876543210','Ganesh Abhishekam',12,1500,'Confirmed','Paid'],
    ['Karthik Raman','karthik@example.com','9876543211','Satyanarayana Puja',14,2500,'Pending','Unpaid'],
    ['Meera Iyer','meera@example.com','9876543212','Lakshmi Puja',16,1800,'In Progress','Paid'],
    ['Arjun Kumar','arjun@example.com','9876543213','Navagraha Homam',18,5500,'Completed','Paid'],
    ['Divya Nair','divya@example.com','9876543214','Rudrabhishekam',20,3200,'Confirmed','Paid'],
    ['Suresh Babu','suresh@example.com','9876543215','Ganesh Abhishekam',22,1500,'Pending','Unpaid']
  ];
  for (const [name,email,phone,puja,day,amount,status,paymentStatus] of examples) {
    await Booking.create({devotee:{name,email,phone},puja,bookingDate:new Date(new Date().getFullYear(),new Date().getMonth(),day),amount,status,paymentStatus,history:[{status,note:'Sample booking'}]});
  }
}
console.log(`Seed complete. Admin: ${email}`);
await mongoose.disconnect();
