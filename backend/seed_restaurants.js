import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './src/models/Restaurant.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://siddharthkumarmaharana:siddharth_dineout@cluster0.kvmsgna.mongodb.net/?appName=Cluster0';

export const RESTAURANTS_DATA = [
  {
    name: "Pizza 4P's Indiranagar",
    cuisine: ["Italian Restaurant", "Pizza"],
    address: "Ward 72, No.3275/A, 12th Main Rd, HAL 2nd Stage, Appareddipalya, Domlur, Bengaluru, Karnataka 560038, India",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    rating: 5.0,
    delivery_time: 30,
    delivery_fee: 50,
    price_range: "$$",
    location: { type: "Point", coordinates: [77.6362406, 12.9700489] }
  },
  {
    name: "PHURR | Jayanagar",
    cuisine: ["Fine Dining Restaurant", "Vegetarian"],
    address: "420, 9th Main Rd, 4th Block, Jayanagar, Bengaluru, Karnataka 560011, India",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80",
    rating: 4.7,
    delivery_time: 35,
    delivery_fee: 30,
    price_range: "$$$",
    location: { type: "Point", coordinates: [77.5855071, 12.927237] }
  },
  {
    name: "Taaza Thindi",
    cuisine: ["South Indian Restaurant", "Breakfast"],
    address: "1004, 26th Main Rd, 4th T Block East, Jayanagara 9th Block, Jayanagar, Bengaluru, Karnataka 560041, India",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
    rating: 4.6,
    delivery_time: 20,
    delivery_fee: 15,
    price_range: "$",
    location: { type: "Point", coordinates: [77.5923984, 12.920257] }
  },
  {
    name: "Toit",
    cuisine: ["Brewpub", "Continental"],
    address: "Indiranagar, 100 Feet Rd, Near Domlur Flyover, Bengaluru, Karnataka 560038, India",
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
    rating: 4.5,
    delivery_time: 35,
    delivery_fee: 40,
    price_range: "$$$",
    location: { type: "Point", coordinates: [77.640698, 12.979313] }
  },
  {
    name: "The Bier Library",
    cuisine: ["Brewpub", "Bar & Grill"],
    address: "14, Patel Narayana Reddy Layout, 80 Feet Road, Koramangala 6th Block, Bengaluru, Karnataka 560095",
    image: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&q=80",
    rating: 4.4,
    delivery_time: 40,
    delivery_fee: 50,
    price_range: "$$$",
    location: { type: "Point", coordinates: [77.625363, 12.934892] }
  },
  {
    name: "Central Tiffin Room",
    cuisine: ["South Indian Restaurant", "Tiffin"],
    address: "7th Cross Rd, Margosa Rd, Malleshwaram, Bengaluru, Karnataka 560003, India",
    image: "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=800&q=80",
    rating: 4.3,
    delivery_time: 30,
    delivery_fee: 40,
    price_range: "$$",
    location: { type: "Point", coordinates: [77.5701889, 13.001648] }
  },
  {
    name: "The Rameshwaram Cafe - Indiranagar",
    cuisine: ["South Indian Restaurant", "Fast Food"],
    address: "2984, 12th Main Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038, India",
    image: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&q=80",
    rating: 4.3,
    delivery_time: 25,
    delivery_fee: 40,
    price_range: "$$",
    location: { type: "Point", coordinates: [77.6433299, 12.970634] }
  },
  {
    name: "Meghana Foods",
    cuisine: ["South Indian Restaurant", "Biryani", "Andhra"],
    address: "57/1, 1st Floor, The Royal Comfort, 4th Block, 100 Feet Rd, Koramangala, Bengaluru, Karnataka 560034, India",
    image: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&q=80",
    rating: 4.3,
    delivery_time: 35,
    delivery_fee: 30,
    price_range: "$$",
    location: { type: "Point", coordinates: [77.6241772, 12.9340277] }
  },
  {
    name: "V. V. Pura Food Street (Thindi Beedi)",
    cuisine: ["Food Court", "Street Food"],
    address: "Sajjan Rao Circle, Food St, Vishweshwarapura, Basavanagudi, Bengaluru, Karnataka 560004, India",
    image: "https://images.unsplash.com/photo-1508766917616-d22f3f1eea14?w=800&q=80",
    rating: 4.2,
    delivery_time: 30,
    delivery_fee: 60,
    price_range: "$$",
    location: { type: "Point", coordinates: [77.5777413, 12.9509166] }
  },
  {
    name: "Vidyarthi Bhavan",
    cuisine: ["South Indian Restaurant", "Traditional"],
    address: "32, Gandhi Bazaar Main Rd, Gandhi Bazaar, Basavanagudi, Bengaluru, Karnataka 560004, India",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80",
    rating: 4.2,
    delivery_time: 30,
    delivery_fee: 60,
    price_range: "$$",
    location: { type: "Point", coordinates: [77.5694294, 12.943899] }
  },
  {
    name: "The Chancery Pavilion",
    cuisine: ["Luxury Dining", "Multi-Cuisine"],
    address: "135, Residency Rd, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560025",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
    rating: 4.5,
    delivery_time: 45,
    delivery_fee: 60,
    price_range: "$$$$",
    location: { type: "Point", coordinates: [77.599763, 12.966456] }
  },
  {
    name: "Bob's Bar",
    cuisine: ["Pub", "South Indian Appetizers"],
    address: "777/I, 100 Feet Rd, HAL 2nd Stage, Doopanahalli, Indiranagar, Bengaluru, Karnataka 560008",
    image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80",
    rating: 4.4,
    delivery_time: 30,
    delivery_fee: 40,
    price_range: "$$",
    location: { type: "Point", coordinates: [77.640122, 12.975411] }
  },
  {
    name: "Savoury Business Hotel",
    cuisine: ["Arabian", "North Indian", "Tandoor"],
    address: "27, Mosque Rd, Frazer Town, Bengaluru, Karnataka 560005",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    rating: 4.2,
    delivery_time: 35,
    delivery_fee: 40,
    price_range: "$$",
    location: { type: "Point", coordinates: [77.616335, 12.998372] }
  },
  {
    name: "Bastian Garden City",
    cuisine: ["Continental", "Seafood", "Asian"],
    address: "4, St Mark's Rd, Ashok Nagar, Bengaluru, Karnataka 560001",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    rating: 4.6,
    delivery_time: 40,
    delivery_fee: 70,
    price_range: "$$$$",
    location: { type: "Point", coordinates: [77.601245, 12.972381] }
  },
  {
    name: "Sid's Cosine",
    cuisine: ["Cafe", "Coffee & Bakery"],
    address: "Indiranagar 100 Feet Road, Bengaluru, Karnataka 560038",
    image: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80",
    rating: 4.5,
    delivery_time: 25,
    delivery_fee: 20,
    price_range: "$$",
    location: { type: "Point", coordinates: [77.641500, 12.978500] }
  }
];

async function seedRestaurants() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const data of RESTAURANTS_DATA) {
      await Restaurant.updateOne(
        { name: data.name },
        { 
          $set: {
            ...data,
            cover_image: data.image,
            is_approved: true,
            is_open: true,
            isOpen: true
          }
        },
        { upsert: true }
      );
      console.log(`✓ Seeded/Updated restaurant: ${data.name}`);
    }

    console.log('\nAll restaurants seeded with distinct venue/interior photos!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedRestaurants();
