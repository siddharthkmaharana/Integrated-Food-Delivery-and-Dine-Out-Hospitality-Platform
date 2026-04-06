/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Home from './pages/Home';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import TableBooking from './pages/TableBooking';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';
import CourierDashboard from './pages/CourierDashboard';
import Login from './pages/Login';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Restaurants": Restaurants,
    "RestaurantDetail": RestaurantDetail,
    "Cart": Cart,
    "Checkout": Checkout,
    "OrderTracking": OrderTracking,
    "TableBooking": TableBooking,
    "Profile": Profile,
    "AdminDashboard": AdminDashboard,
    "RestaurantDashboard": RestaurantDashboard,
    "CourierDashboard": CourierDashboard,
    "login": Login,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};