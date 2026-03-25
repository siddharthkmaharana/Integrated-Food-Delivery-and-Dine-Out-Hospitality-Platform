import Resturant from '../models/Restaurant.js';

//GET /api/restaurants
const getRestaurants = async (req, res) => {
  try{
    const {
        longitude,
        latitude,
        maxDistance = 10000,
        cuisine,
        page=1,
        limit=10 // default to 5km
    } = req.query;
    
    // if location is there use geospatial search 
    if (longitude && latitude){
        const  pipeline =[
            {
                $geoNear:{near:{
                    type:'point',
                    coordinates:[parseFloat(longitude), parseFloat(latitude)]
                },
                distanceField : 'distance',
                maxDistance:parseInt(maxDistance),
                spherical:true
            }
            },
            // combined score of distance + rating 
            {
                $addFields:{
                    combinedScore:{
                        $subtract:[
                            {$multiply :['$rating',1000]},
                            {$divide: ['$distance', 100]}
                        ]
                    }
                }
            },
            //filter by cuisine if provided

            ...Resturant(cuisine ? [{ $match: { cuisine : { $in : [cuisine]}}}]:[]),

                {$sort:{combinedScore: -1}},

                //pagination 
                {$skip : (parseInt(page) -1 ) * parseInt(limit)},
                { $limit: parseInt(limit)}
            
        ];
        const restaurants = await Resturant.aggregate(pipeline);
        return res.json({
            successs: true,
            count: restaurants.length,
            data: restaurants
        });
    }

    // no location - return all restaurants 

    const restaurants = await Resturant.find()
    .sort({ rating: -1})
    .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
        successs: true,
        count: restaurants.length,
        data: restaurants
    });
} catch(error) {
    res.status(500).json({
        message: error.message
    });
}
};


// GET /api/restaurants/:id
const getRestaurantById = async (req,res) =>{
    try{
         const restaurant = await Resturant.findById(req.params.id);
         if (!restaurant){
            return res.status(404).json({ message: 'Restaurant not found'});
         }

         res.json({ successs: true , data: restaurant });
    } catch(error){
        res.status(500).json({message: error.message});
    }
};

//POST /api/restaurants

const createRestaurant = async (req,res) =>{
    try{
        const { name , cuisine,address,longitude,latitude,image } = req.body;
        const restaurant = await Resturant.create({
            owner: req.user._id,
            name,
            cuisine,
            address,
            image,
            location:{
                type: 'point',
                coordinates:[parseFloat(longitude), parseFloat(latitude)]
            }
        });

        res.status(201).json({ successs :true , data: restaurant});
    } catch (error) {
        res.status(500).json({ message: error.message});

    }
};

//PUT /api/restaurants/:id
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

export { getRestaurants , getRestaurantById , createRestaurant ,updateRestaurant};