const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const fetch = require('node-fetch');
const querystring = require('querystring');
const { ensureAuthenticated } = require('../config/auth');
const https = require('https');
//TODO change this to work with real certificates
const agent = new https.Agent({
	rejectUnauthorized: false
});

//User model
const User = require('../models/User');
//Login page
router.get('/login', (req, res, next) => {
	var challenge = req.query['login_challenge'];
	console.log(`initiating login_challenge for ${challenge}`);
	if (!challenge) {
		res.redirect('https://www.canapads.ca');
	}
	fetch(
		process.env.OAUTH2_SERVER +
			'oauth2/auth/requests/login?' +
			querystring.stringify({ login_challenge: challenge }),
		{
			agent
		}
	)
		.then((response) => response.json())
		.then((response) => {
			var subject = response.subject;

			if (subject == '') {
				res.render('Login', { login_challenge: challenge });
			} else {
				console.log(`Subject is known: ${subject} redirect to ${response.client.redirect_uris[0]}`);
				console.log(response);
				res.redirect('/auth/login?=' + querystring.stringify({ login_challenge: challenge }));
			}
		});
});
//login Handle
router.post('/login', (req, res, next) => {
	const { email, password, login_challenge } = req.body;

	let errors = [];

	//check required fields
	if (!email || !password) {
		errors.push({ msg: 'Please fill in all fields' });
	}

	if (errors.length > 0) {
		res.render('login', {
			errors,
			login_challenge
		});
	} else {
		passport.authenticate('local', {
			successRedirect: '/auth/login?login_challenge=' + req.body['login_challenge'],
			failureRedirect: '/users/login?login_challenge=' + req.body['login_challenge'],
			failureFlash: true
		})(req, res, next);
	}
});

//Logout Page
router.get('/logout', ensureAuthenticated, (req, res) => {
	var challenge = req.query['logout_challenge'];

	if (!challenge) {
		console.log('no logout challenge received');
		res.redirect('https://www.canapads.ca');
	} else {
		console.log('challenge received', challenge);
	}
	fetch(
		process.env.OAUTH2_SERVER +
			'oauth2/auth/requests/logout?' +
			querystring.stringify({ logout_challenge: challenge }),
		{ agent }
	)
		.then((response) => response.json())
		.then((response) => {
			console.log('respuesta en logout GET');
			var subject = response.subject;
			if (subject != '') {
				//in case you want a logout page confirmation
				//res.render('Logout', { 'logout_challenge': challenge });

				//otherwise
				const body = {
					logout_challenge: challenge
				};
				fetch('https://auth.canapads.ca/users/logout', {
					method: 'POST',
					agent,
					body: JSON.stringify(body),
					headers: { 'Content-Type': 'application/json' }
				})
					.then(function(response) {
						console.log('1 logged out and redirecting to ', response.redirect_to);

						return response.json();
					})
					.then(function(response) {
						console.log('2 logged out and redirecting to ', response.redirect_to);
						// The response will contain a `redirect_to` key which contains the URL where the user's user agent must be redirected to next.
						res.redirect(response.redirect_to);
					})
					.catch((err) => console.log(err));
			}
		});
});

//logout handle
router.post('/logout', (req, res) => {
	var challenge = req.body['logout_challenge'];
	console.log('challenge en el post logout', req.body);
	// if (!challenge) {
	//     res.redirect('http://www.canapads.ca');
	// }
	req.logout();
	fetch(
		process.env.OAUTH2_SERVER +
			'oauth2/auth/requests/logout/accept?' +
			querystring.stringify({ logout_challenge: challenge }),
		{
			method: 'PUT',
			agent
		}
	)
		.then(function(response) {
			return response.json();
		})
		.then(function(response) {
			console.log('respuesta en logout post para el challenge' + challenge);

			// The response will contain a `redirect_to` key which contains the URL where the user's user agent must be redirected to next.
			//If we are showing a consent page
			console.log(response);
			//res.redirect(response.redirect_to);

			res.send(response);
		})
		.catch((err) => console.log(err));
});

//Register Handle
router.post('/register', (req, res) => {
	const { name, email, password, password2, login_challenge } = req.body;

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
			password2,
			login_challenge
		});
	} else {
		//Validation passed
		User.findOne({ email: email }).then((user) => {
			if (user) {
				// user exists
				errors.push({ msg: 'Email is already registered' });
				res.render('register', {
					errors,
					name,
					email,
					password,
					password2,
					login_challenge
				});
			} else {
				const newUser = new User({
					name,
					email,
					password
				});

				// Hash password
				bcrypt.genSalt(8, (err, salt) =>
					bcrypt.hash(password, salt, (err, hash) => {
						if (err) throw err;
						newUser.password = hash;

						newUser.save().then((user) => {
							req.flash('success_msg', 'You are now registered and can login');
							res.redirect('/users/login?' + querystring.stringify({ login_challenge: login_challenge }));
						});
					})
				);
			}
		});
	}
});

//Register page
router.get('/register', (req, res) => {
	res.render('Register', { login_challenge: req.query['login_challenge'] });
});

module.exports = router;
