const express = require('express');
const Router = express.Router();

const passport = require('../controllers/googleAuth.js');

Router.use(passport.initialize());

Router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] })); 

Router.get('/auth/google/callback', (req,res,next)=>{
    passport.authenticate('google', async(err,user) => {
        if (err) {
            console.log('Error with passport authentication');
            return res.status(500).json({
                'status': 'error',  
                'message': 'Internal server error' 
            });
        }
        if (!user) {
            console.log('User with google account not obtained');
            return res.status(500).json({
                'status': 'error',  
                'message': 'Internal server error please try again' 
            });
        }
        if (user.newGoogleUser) {
            console.log('user with google account email does not exist');
            const email = user.email;
            const name = user.name;
            console.log('Email: ', email);
            console.log('Name: ', name);
            return res.status(200).redirect(`http://localhost:3000/users/addInfo?email=${email}&name=${name}`);
        }
        console.log('user with google account email obtained');
        return res.status(200).json({
            'status': 'success',  
            'message': 'User obtained successfully',
            'token': user.token,
            'redirectUrl': 'http://localhost:3000/'
        })
    })(req,res,next)
});

module.exports = Router;