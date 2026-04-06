import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
    restaurant:{type:mongoose.Schema.Types.ObjectId ,ref:'Restaurant', required: true},
    name:{type: String , required:true},
    description:{type:String, default: ''},
    price:{type:Number, required:true},
    category:{type:String, default:'Main Course'},
    image:{type:String,default:''},
    isAvailable:{type:Boolean, default:true}
},{timestamps:true});

export default mongoose.model('MenuItem',menuItemSchema);
