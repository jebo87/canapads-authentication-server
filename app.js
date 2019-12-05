const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');

const app = express();

//passport config
require('./config/passport')(passport);

//DB config
const db = require('./config/keys').MongoURI

//Connect to Mongo
mongoose.connect(db, { useNewUrlParser: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

//Body parser
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Express session
app.use(session({
    secret: 'canapads makako ads',
    resave: true,
    saveUninitialized: true
}));


app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

//Global vars
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})

//routes
app.use('/auth', require('./routes/index'));
app.use('/users', require('./routes/users'));

const PORT = process.env.PORT || 5005;

app.listen(PORT, console.log(`server started on port ${PORT}`));