const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
const pe = require('parse-error');

const CONFIG = require('./config');
const v1 = require('./routes/v1');
const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
//Passport
app.use(passport.initialize());


//Log Env
console.log("Environment:", CONFIG.app);

//DATABASE
const models = require("./models");
console.log('process env', process.env);
console.log('config', CONFIG);
models.sequelize.authenticate().then(() => {
        console.log('Connected to SQL database:', CONFIG.db_name);
    })
    .catch(err => {
        console.error('Unable to connect to SQL database:', CONFIG.db_name, err);
    });

app.use('/avatar', express.static(path.join(__dirname, 'public/images/avatars')));
app.use('/entity', express.static(path.join(__dirname, 'public/images/entities')));
app.use('/api/v1', v1);

app.use('/', function (req, res) {
    res.statusCode = 200; //send the appropriate status code
    res.json({
        success: true,
        message: "Parcel Pending API",
        data: {}
    })
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    // res.render('error');
});

module.exports = app;

//This is here to handle all the uncaught promise rejections
process.on('unhandledRejection', error => {
    console.error('Uncaught Error', pe(error));
});
