import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    customer:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    items: [
        {
            menuItem:{type:mongoose.Schema.Types.ObjectId, ref:'MenuItem'},
            name:String, price:Number,quantity:{type:Number,default:1}
        }
    ],
    totalAmount:{type:Number, required:true},
    status:{
        type:String,
        enum:['PLACED','ACCEPTED','ORDER_PREPARING','COURIER_ASSIGNED','IN_TRANSIT','DELIVERED','CANCELLED'],
        default:'PLACED '
    },
    paymentStatus:{type:String,enum: ['PENDING','PAID','FAILED'], default:'PENDING'},
    deliveryAddress:{type:String ,required:true},
    review:{
        Text:{type:String, default:''},
        points:{type:Number,default:0},
        submitted:{type:Boolean, default:false}
    }
},{timestamps:true});
export default mongoose.model('Order',orderSchema);
