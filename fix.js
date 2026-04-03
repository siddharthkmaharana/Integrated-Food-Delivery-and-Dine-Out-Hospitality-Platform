const fs = require('fs');

const replaceInFile = (f) => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/base44\.entities\.Restaurant/g, 'api.restaurants');
  content = content.replace(/base44\.entities\.MenuItem/g, 'api.menuItems');
  content = content.replace(/base44\.entities\.Order/g, 'api.orders');
  content = content.replace(/base44\.entities\.Reservation/g, 'api.reservations');
  content = content.replace(/base44\.entities\.Review/g, 'api.reviews');
  content = content.replace(/base44\.auth/g, 'api.auth');
  
  if (!content.includes('import { api }')) {
     content = 'import { api } from "@/api/client";\n' + content;
  }
  fs.writeFileSync(f, content);
};

console.log("Fixing files...");
replaceInFile('frontend/src/pages/RestaurantDashboard.jsx');
replaceInFile('frontend/src/pages/CourierDashboard.jsx');
console.log("Done.");
