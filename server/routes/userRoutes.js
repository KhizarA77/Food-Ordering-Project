const express = require('express');
const Router = express.Router();

const passport = require('../controllers/googleAuth.js');

const {register, login, displayUserDetails, updateUserDetails, continueWithGoogle, addInfo,
    placeOrder, getOrderHistory, getOrderDetails, displayObtainedInfo} = require('../controllers/userControllers.js');

// MIDDLEWARES
const {validateRegistration, validateLogin} = require('../middlewares/inputValidation.js');
const emailUniquenessCheck = require('../middlewares/emailUniqueness.js');
const {authorize, isUser} = require('../middlewares/authorizationMiddleware.js');

// -------------------------------------------------------------------------------------------------------------

Router.post('/register', validateRegistration, emailUniquenessCheck, register); 
Router.post('/login', validateLogin, login);                                    



Router.get('addInfo', displayObtainedInfo)
Router.post('/addInfo', addInfo);                                               

Router.post('/placeOrder', authorize, isUser, placeOrder);   

Router.get('/user-details', authorize, isUser, displayUserDetails);             
Router.put('/update-user-details', authorize, isUser, updateUserDetails);       



Router.get('/orderHistory', authorize, isUser, getOrderHistory);  

Router.get('/orderDetails', authorize, isUser, getOrderDetails);  



module.exports = Router;