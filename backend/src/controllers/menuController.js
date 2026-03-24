import MenuItem from '../models/MenuItem.js';
import MenuItem from '../models/MenuItem.js';

//GET /api/restaurants/:id/menu

const getMenuItems = async(req ,res) =>{
    try{
        const items = await MenuItem.find({resturant: req.params.id});
        res.json({ success: true ,count: items.length, data: items});
    } catch(error){
        res.status(500).json({ message: error.message};)
    }
    
};

// POST /api/restaurants/:id/menu

const addMenuItem = async (req,res) =>{
    try{
        const {name, description, price ,category , image} = req.body;
        const MenuItem = await MenuItem.create({
            restaurant: req.params.id,
            name,
            description,
            price,
            category,
            image
        });
        res.status(201).json({ message: true , data: MenuItem});
    } catch(error){
        res.status(500).json({ message: error.message});
    }
};

//PUT /api/restaurants/:id/menu/:itemId

const updateMenuItem =async (req,res)=>{
    try{
        const item = await MenuItem.findByIdAndUpdate(
            req.params.itemId,
            req.body,
            { new: true}
        );
         if (!item){
            return res.status(404).json({ message: 'Menu item not found '});
         }
         res.json({ success: true , data: item});
    } catch(error){
        res.status(500).json({message: error.message});
    }
};

//DELETE /api/restaurant/:id/menu/:itemId

const deleteMenuItem =async (req,res)=>{
    try{
        await MenuItem.findByIdAndDelete(req.params.itemId);
        res.json({ success: true, message: 'Menu item removed'});

    } catch(error){
        res.status(500).json({ message: error.message});
    }
};

export{ getMenuItems ,addMenuItem ,updateMenuItem ,deleteMenuItem};