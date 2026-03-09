import mongoose from "mongoose";    

const resturantSchema = new mongoose.Schema({
    owner:{type: mongoose.Schema.Types.ObjectId, ref:'User' , required: true},
    name:{type: String , required:true, trim:true},
    cuisine:[{type:String}],
    rating:{type:Number ,default:0, min:0 , max:5},
    totalReviews:{type:Number,default:0 },
    isOpen:{type:Boolean, default:true},
    address:{type:String, required:true},
    image:{type:String, default:''},
    location:{
        type:{type:String, enum:['point'], required:true, default:'point'},
        coordinates:{type:[Number], required: true}
    }
},{timestamps:true});

resturantSchema.index({location:'2dsphere'});
export default mongoose.model('Resturant',resturantSchema);


