const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const fetch = require('node-fetch');

//welcome
router.get('/', (req, res) => res.render('welcome'));

//Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    console.log(req);
    // fetch(`http://localhost:4445/oauth2/auth/requests/login?login_challenge=${challenge}`)
    //     .then(response => response.json())
    //     .then(response => {
    //         var subject = response.subject
    //         if (subject == '') {
    //             res.render('Login');
    //         } else {
    //             console.log(`entramos ${response.subject}`);
    //         }

    //     });


    res.render('dashboard', {
        name: req.user.name
    })
});

module.exports = router;