const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const fetch = require('node-fetch');
const querystring = require('querystring')
const { ensureAuthenticated } = require('../config/auth');


//User model
const User = require('../models/User');
//Login page
router.get('/login', (req, res, next) => {
    var challenge = req.query['login_challenge'];
    fetch('http://localhost:4445/oauth2/auth/requests/login?' + querystring.stringify({ login_challenge: challenge }))
        .then(response => response.json())
        .then(response => {
            var subject = response.subject

            if (subject == '') {
                res.render('Login', { 'login_challenge': challenge });
            }

            else {
                res.redirect(response.client.redirect_uris[0]);
            }

        });


});
//login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/auth/login?login_challenge=' + req.body['login_challenge'],
        failureRedirect: '/login',
        failureFlash: true,

    })(req, res, next);
});



//Logout Page
router.get('/logout', ensureAuthenticated, (req, res) => {
    var challenge = req.query['logout_challenge'];
    fetch('http://localhost:4445/oauth2/auth/requests/logout?' + querystring.stringify({ logout_challenge: challenge }), {})
        .then((response) => response.json())
        .then(response => {
            console.log('respuesta en logout GET', response);
            var subject = response.subject
            if (subject != '') {
                res.render('Logout', { 'logout_challenge': challenge });
            }
        });
});

//logout handle
router.post('/logout', (req, res) => {
    var challenge = req.body['logout_challenge']

    req.logout();
    fetch(
        'http://localhost:4445/oauth2/auth/requests/logout/accept?' +
        querystring.stringify({ logout_challenge: challenge }),
        {
            method: 'PUT',
        }
    )
        .then(function (response) {
            return response.json();
        })
        .then(function (response) {
            console.log('respuesta en logout post para el challenge' + challenge, response);

            // The response will contain a `redirect_to` key which contains the URL where the user's user agent must be redirected to next.
            res.redirect(response.redirect_to);
        });


});


//Register Handle
router.post('/register', (req, res) => {
    const { name, email, password, password2 } = req.body;

    let errors = [];

    //check required fields
    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    //check passwords match
    if (password != password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    //check pass length
    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email,
            password,
            password2

        });
    } else {
        //Validation passed
        User.findOne({ email: email })
            .then(user => {
                if (user) {
                    // user exists
                    errors.push({ msg: 'Email is already registered' });
                    res.render('register', {
                        errors,
                        name,
                        email,
                        password,
                        password2

                    });
                } else {
                    const newUser = new User({
                        name,
                        email,
                        password
                    });

                    // Hash password
                    bcrypt.genSalt(8, (err, salt) => bcrypt.hash(password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;

                        newUser.save()
                            .then(user => {
                                req.flash('success_msg', 'You are now registered and can login');
                                res.redirect('/users/login');

                            })
                    }));





                }
            });
    }

});

//Register page
router.get('/register', (req, res) => res.render('Register'));


module.exports = router;