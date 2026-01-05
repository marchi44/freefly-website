const mongoose = require("mongoose");

const passengerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  dob: String,
  email: String,
  phone: String,
  passport: String,
  nationality: String,
});

const BookingSchema = new mongoose.Schema({
  passengers: [
    {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      dob: String,
      passport: String,
      nationality: String,
    }
  ],
  flights: [
    {
      direction: String, // "OUTBOUND" | "RETURN"
      from: String,
      to: String,
      date: String,
      departureTime: String,
      arrivalTime: String,
    }
  ],
  price: Number,
  purchasedAt: Date,
});


const walletTransactionSchema = new mongoose.Schema({
  amount: Number,
  type: {
    type: String,
    enum: ["TOP_UP", "TICKET_PURCHASE"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new mongoose.Schema({
  name: String,
  surname: String,
  dob: String,
  email: { type: String, unique: true },
  password: String,

  wallet: {
    balance: { type: Number, default: 0 },
    transactions: [walletTransactionSchema],
  },

  bookings: [BookingSchema],
});

module.exports = mongoose.model("User", userSchema);

