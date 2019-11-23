const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const fetch = require('node-fetch');
const querystring = require('querystring')

//welcome
router.get('/', (req, res) => {

    res.render('welcome')
});

//Login authenticated handle
router.get('/login', ensureAuthenticated, (req, res) => {
    var challenge = req.query['login_challenge'];

    const body = {
        subject: req.user._id,
        remember: true,
        remember_for: 60,
    }

    fetch('http://localhost:4445/oauth2/auth/requests/login/accept?' + querystring.stringify({ login_challenge: challenge }), {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    }).
        then(function (response) {
            return response.json()
        }).
        then(function (response) {
            // The response will contain a `redirect_to` key which contains the URL where the user's user agent must be redirected to next.

            res.redirect(response.redirect_to);
        }).catch(err => console.log(err))
});


//consent challenge handle
router.get('/consent', ensureAuthenticated, (req, res) => {
    var challenge = req.query['consent_challenge'];
    fetch('http://localhost:4445/oauth2/auth/requests/consent?' + querystring.stringify({ consent_challenge: challenge })).
        then(function (response) {
            return response.json()
        }).
        then(function (response) {
            console.log("/CONSENT")
        }).catch(err => console.log(err))

    const body = {
        grant_scope: ["openid", "profile", "api1"],
        grant_access_token_audience: ["openid", "profile", "api1"],
        remember: true,
        remember_for: 60,
        session: {
            id_token: {
                'name': req.user.email
            }
        }
    };

    fetch('http://localhost:4445/oauth2/auth/requests/consent/accept?' + querystring.stringify({ consent_challenge: challenge }), {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    })
        .then(function (response) {
            return response.json()
        })
        .then(function (response) {
            // The response will contain a `redirect_to` key which contains the URL where the user's user agent must be redirected to next.
            res.redirect(response.redirect_to);
        })
});

module.exports = router;