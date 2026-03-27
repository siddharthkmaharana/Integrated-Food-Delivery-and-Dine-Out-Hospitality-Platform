import Restaurant from '../models/Restaurant.js';

const getRestaurants = async (req, res) => {
  try {
    // Default to Bengaluru if not provided
    const {
      longitude = 77.5946,
      latitude = 12.9716,
      maxDistance = 15000,
      cuisine,
      page = 1,
      limit = 10
    } = req.query;

    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(maxDistance),
          spherical: true
        }
      },
      {
        $addFields: {
          combinedScore: {
            $subtract: [
              { $multiply: ['$rating', 1000] },
              { $divide: ['$distance', 100] }
            ]
          }
        }
      },
      ...(cuisine ? [{ $match: { cuisine: { $in: [cuisine] } } }] : []),
      { $sort: { combinedScore: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ];

    let restaurants = await Restaurant.aggregate(pipeline);

    // If we have less than 5 restaurants locally, fetch from Google Places API
    if (restaurants.length < 5 && process.env.GOOGLE_PLACES_API_KEY) {
      try {
        const googleUrl = 'https://places.googleapis.com/v1/places:searchNearby';
        const response = await fetch(googleUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.location,places.primaryTypeDisplayName,places.photos'
          },
          body: JSON.stringify({
            includedTypes: ['restaurant'],
            maxResultCount: 15,
            locationRestriction: {
              circle: {
                center: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
                radius: parseInt(maxDistance)
              }
            }
          })
        });

        const data = await response.json();
        
        if (data.places && data.places.length > 0) {
          const placesToInsert = data.places.map(place => {
            let imageUrl = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=1000';
            if (place.photos && place.photos.length > 0) {
              const photoName = place.photos[0].name;
              imageUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${process.env.GOOGLE_PLACES_API_KEY}`;
            }

            return {
              name: place.displayName?.text || 'Unknown Restaurant',
              address: place.formattedAddress || 'Unknown Address',
              rating: place.rating || 4.2,
              cuisine: place.primaryTypeDisplayName?.text || 'Various',
              location: {
                type: 'Point',
                coordinates: [place.location.longitude, place.location.latitude]
              },
              image: imageUrl,
              is_approved: true
            };
          });

          // Insert them using upsert to avoid duplicate names
          for (const p of placesToInsert) {
            await Restaurant.findOneAndUpdate(
              { name: p.name },
              { $setOnInsert: p },
              { upsert: true }
            );
          }

          // Fetch again from local DB now that it's populated
          restaurants = await Restaurant.aggregate(pipeline);
        }
      } catch (err) {
        console.error("Google Places Error:", err);
      }
    }

    return res.json(restaurants);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createRestaurant = async (req, res) => {
  try {
    const { name, cuisine, address, longitude, latitude, image } = req.body;
   
    const restaurant = await Restaurant.create({
      owner: req.user._id,
      name,
      cuisine,
      address,
      image,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    });
    res.status(201).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getRestaurants, getRestaurantById, createRestaurant, updateRestaurant };