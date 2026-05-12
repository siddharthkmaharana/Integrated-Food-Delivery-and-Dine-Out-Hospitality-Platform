import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ["customer", "restaurant", "courier", "admin"], default: "customer" },
  loyaltyPoints: { type: Number, default: 0 },
  phoneNumber: { type: String, default: "" },
  address: {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    pincode: { type: String, default: "" }
  },

  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } // longitude, latitude
  },
  isOnline: { type: Boolean, default: false }
}, { timestamps: true });


// HASH PASSWORD BEFORE SAVE
userSchema.pre("save", async function () {

  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);

});


// COMPARE PASSWORD
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


export default mongoose.model("User", userSchema);