const CONFIG = require('../config');
const nodemailer = require('nodemailer');
const path = require('path');
const hbs = require('nodemailer-express-handlebars');

// create reusable transporter object using the default SMTP transport
let smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: CONFIG.mailer_user,
        pass: CONFIG.mailer_pass
    }
});

var handlebarsOptions = {
  viewEngine: 'handlebars',
  viewPath: path.resolve('./email_templates/'),
  extName: '.html'
};

smtpTransport.use('compile', hbs(handlebarsOptions));
module.exports.smtpTransport = smtpTransport;