const LocalStrategy = require('passport-local');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

//Load user model
const User = require('../models/User');

module.exports = function (passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
            //Match user
            User.findOne({ email: email })
                .then(user => {
                    if (!user) {
                        return done(null, false, { message: 'Incorrect email or password. Please try again' });
                    }

                    //Match password
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) throw err;
                        if (isMatch) {
                            done(null, user)

                        } else {
                            done(null, false, { message: 'Incorrect email or password. Please try again' })
                        }
                    })


                })
                .catch(err => console.log(err));
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });
}