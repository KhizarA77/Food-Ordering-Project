const express = require('express');
const Router = express.Router();
const { authorize, isAdmin } = require('../middlewares/authorizationMiddleware.js');
const adminController = require('../controllers/adminController.js');

Router.get('/admin-dashboard', authorize, isAdmin, adminController.adminDetails); // /admin/admin-dashboard pass nothing

Router.get('/users', authorize, isAdmin, adminController.searchUser); // /admin/users  PASS email or phone_number as query

Router.get('/restaurants', authorize, isAdmin, adminController.searchRestaurant); // /admin/restaurants PASS email or phone_number as query

Router.post('/add-restaurant', authorize, isAdmin, adminController.addRestaurants); // /admin/restaurants PASS IN BODY

Router.delete('/remove-user', authorize, isAdmin, adminController.removeUser); // /admin/users PASS userid in query

Router.delete('/restaurants', authorize, isAdmin, adminController.removeRestaurant); // /admin/restaurants PASS restaurantid in query

Router.get('/riders', authorize, isAdmin, adminController.viewRiders);

Router.post('/riders', authorize, isAdmin, adminController.addRider);

Router.delete('/riders', authorize, isAdmin, adminController.removeRider);

module.exports = Router;
