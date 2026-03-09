import mongoose from "mongoose";
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
    name:{type: String, required: true, trim:true},
    email:{type:String, required: true , unique: true , lowercase: true},
    password:{type: String , required: true , minlength:6},
    role:{type: String , enum:['customer','resturant','courier'], default:'customer'},
    loyaltypoints: {type: Number ,default: 0},
    location:{
        type:{type: String, enum:['point'], default:'point'},
        coordinates:{type: [Number], default:[0,0]} // longitude,latitude
    }
},{timestamps: true});

userSchema.pre('save', async function (next){
    if(!this.ismodified('password')) return next();
    this.password = await bcrypt.hash(this.password,10);
    next();
});

userSchema.methods.matchpassword =async function (enteredpassword){
    return await bcrypt.compare(enteredpassword, this.password);
};

export default mongoose.model('User', userSchema);