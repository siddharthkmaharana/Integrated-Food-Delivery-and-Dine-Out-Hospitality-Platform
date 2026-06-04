import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';

/**
 * @desc Assign a user as an owner of a restaurant
 * @route POST /api/admin/assign-owner
 * @access Private/Admin
 */
const assignRestaurantOwner = async (req, res) => {
    try {
        const { userId, restaurantId } = req.body;

        // 1. Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Find restaurant
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // 3. Update user role to 'restaurant' if not already
        if (user.role !== 'restaurant') {
            user.role = 'restaurant';
            await user.save();
        }

        // 4. Update restaurant owner
        restaurant.owner = userId;
        await restaurant.save();

        res.json({
            success: true,
            message: `User ${user.name} assigned as owner of ${restaurant.name}`,
            data: { user, restaurant }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Get all users for admin to manage
 * @route GET /api/admin/users
 * @access Private/Admin
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { assignRestaurantOwner, getAllUsers };
