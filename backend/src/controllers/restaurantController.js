import Restaurant from '../models/Restaurant.js';

const getRestaurants = async (req, res) => {
  try {
    const {
      longitude,
      latitude,
      maxDistance = 10000,
      cuisine,
      page = 1,
      limit = 10
    } = req.query;

    if (longitude && latitude) {
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

      const restaurants = await Restaurant.aggregate(pipeline);
      return res.json(restaurants);
    }

    const restaurants = await Restaurant.find()
      .sort({ rating: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json(restaurants);

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