const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const fetch = require('node-fetch');
const querystring = require('querystring');
const https = require('https');
const agent = new https.Agent({
	rejectUnauthorized: false
});
//welcome
router.get('/', (req, res) => {
	res.render('welcome');
});

//Login authenticated handle. This is loaded after the user has successfully logged in
router.get('/login', ensureAuthenticated, (req, res) => {
	console.log('user authenticated with identity provider');
	var challenge = req.query['login_challenge'];

	const body = {
		subject: req.user._id,
		remember: true,
		remember_for: 20
	};

	console.log('Attempting login in Auth server...');
	fetch(
		process.env.OAUTH2_SERVER +
			'oauth2/auth/requests/login/accept?' +
			querystring.stringify({ login_challenge: challenge }),
		{
			method: 'PUT',
			body: JSON.stringify(body),
			agent,
			headers: { 'Content-Type': 'application/json' }
		}
	)
		.then(function(response) {
			return response.json();
		})
		.then(function(response) {
			// The response will contain a `redirect_to` key which contains the URL where the user's user agent must be redirected to next.
			console.log(`login accepted in auth server for login_challenge ${challenge}`);
			console.log(response);
			res.redirect(response.redirect_to);
		})
		.catch((err) => console.log(err));
});

//consent challenge handle. In this case, the user has logged in
//we don't show any consent page since we are not a auth provider
router.get('/consent', ensureAuthenticated, (req, res) => {
	var challenge = req.query['consent_challenge'];
	fetch(
		process.env.OAUTH2_SERVER +
			'oauth2/auth/requests/consent?' +
			querystring.stringify({ consent_challenge: challenge }),
		{
			agent
		}
	)
		.then(function(response) {
			return response.json();
		})
		.then(function(response) {
			console.log('requesting consent.');
		})
		.catch((err) => console.log(err));

	//define the grants for the user
	const body = {
		grant_scope: [ 'openid', 'profile', 'api1' ],
		grant_access_token_audience: [ 'openid', 'profile', 'api1' ],
		remember: true,
		remember_for: 20,
		session: {
			id_token: {
				name: req.user.name,
				email: req.user.email
			}
		}
	};

	fetch(
		process.env.OAUTH2_SERVER +
			'oauth2/auth/requests/consent/accept?' +
			querystring.stringify({ consent_challenge: challenge }),
		{
			method: 'PUT',
			body: JSON.stringify(body),
			agent,
			headers: { 'Content-Type': 'application/json' }
		}
	)
		.then(function(response) {
			return response.json();
		})
		.then(function(response) {
			console.log('consent obtained');
			// The response will contain a `redirect_to` key which contains the URL where the user's user agent must be redirected to next.
			res.redirect(response.redirect_to);
		});
});

module.exports = router;
