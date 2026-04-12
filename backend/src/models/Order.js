import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    customer:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    items: [
        {
            menuItem:{type:mongoose.Schema.Types.ObjectId, ref:'MenuItem'},
            name:String, price:Number,quantity:{type:Number,default:1}
        }
    ],
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    restaurantName: String,
    subtotal: Number,
    deliveryFee: Number,
    tax: Number,
    totalAmount:{type:Number, required:true},
    status:{
        type:String,
        enum:['PENDING','PLACED','ACCEPTED','PREPARING','COURIER_ASSIGNED','DELIVERING','DELIVERED','CANCELLED'],
        default:'PENDING'
    },
    paymentStatus:{type:String,enum: ['PENDING','PAID','FAILED'], default:'PENDING'},
    deliveryAddress:{type:String ,required:true},
    review:{
        Text:{type:String, default:''},
        points:{type:Number,default:0},
        submitted:{type:Boolean, default:false}
    }
},{timestamps:true});
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });

export default mongoose.model('Order',orderSchema);
