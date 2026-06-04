import Event from '../models/Event.js';
import Restaurant from '../models/Restaurant.js';

const createEvent = async (req, res) => {
    try {
        const { restaurantId, title, description, image, date, startTime, endTime, type, capacity } = req.body;
        
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

        const event = await Event.create({
            restaurant: restaurantId,
            title,
            description,
            image,
            date,
            startTime,
            endTime,
            type,
            capacity,
            location: restaurant.location
        });

        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getEvents = async (req, res) => {
    try {
        const { longitude, latitude, maxDistance = 20000, type, limit = 20, restaurantId } = req.query;
        const filter = { is_active: true };
        
        if (type) filter.type = type;
        if (restaurantId) filter.restaurant = restaurantId;

        let events = [];
        if (longitude && latitude && !restaurantId) {
            try {
                events = await Event.find({
                    ...filter,
                    location: {
                        $near: {
                            $geometry: {
                                type: "Point",
                                coordinates: [parseFloat(longitude), parseFloat(latitude)]
                            },
                            $maxDistance: parseInt(maxDistance)
                        }
                    }
                }).populate('restaurant', 'name address image').limit(parseInt(limit));
            } catch (geoError) {
                console.error("Geo search failed, falling back:", geoError.message);
            }
        }

        // Fallback or non-geo search
        if (events.length === 0) {
            events = await Event.find(filter)
                .populate('restaurant', 'name address image')
                .sort({ date: 1 })
                .limit(parseInt(limit));
        }

        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('restaurant');
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        
        // Only owner should delete? 
        // For now, simple delete
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const rsvpEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const userId = req.user._id;
        const isAttending = event.attendees?.includes(userId);

        if (isAttending) {
            // Un-RSVP
            event.attendees = event.attendees.filter(id => id.toString() !== userId.toString());
            event.rsvp_count = Math.max(0, event.rsvp_count - 1);
        } else {
            // RSVP
            if (event.rsvp_count >= event.capacity) {
                return res.status(400).json({ message: 'Event is full' });
            }
            event.attendees.push(userId);
            event.rsvp_count += 1;
        }

        await event.save();
        res.json({ message: isAttending ? 'RSVP removed' : 'RSVP successful', event });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { createEvent, getEvents, getEventById, deleteEvent, rsvpEvent };
