const express = require('express');
const app = express();
const cors = require('cors');

require('dotenv').config();
const userRoutes = require('./routes/userRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');
const restaurantRoutes = require('./routes/restaurantRoutes.js');
const { browseRestaurants, browseProducts } = require('./controllers/userControllers.js')
const googleAuthRoutes = require('./routes/googleAuthRoutes.js');

const PORT = 3001;

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }))


app.get('/', browseRestaurants)
app.get('/restaurant', browseProducts)

app.use('/users', googleAuthRoutes);    
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/restaurants', restaurantRoutes);

app.listen(PORT, () => {
    console.log(`App running on http://localhost:${PORT}`);
});