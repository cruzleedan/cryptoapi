require('dotenv').config();

let CONFIG = {} //Make this global to use all over the application

CONFIG.app          = process.env.APP   || 'dev';
CONFIG.port         = process.env.PORT  || '3000';

CONFIG.db_dialect   = process.env.DB_DIALECT    || 'mysql';
CONFIG.db_host      = process.env.RDS_HOSTNAME       || 'localhost';
CONFIG.db_port      = process.env.RDS_PORT       || '3306';
CONFIG.db_name      = process.env.RDS_DB_NAME       || 'cryptocaution';
CONFIG.db_user      = process.env.RDS_USERNAME       || 'root';
CONFIG.db_password  = process.env.RDS_PASSWORD   || 'password';

CONFIG.jwt_encryption  = process.env.JWT_ENCRYPTION || 'jwt_cryptocaution';
CONFIG.jwt_expiration  = process.env.JWT_EXPIRATION || '10000';

CONFIG.upload_dir = process.env.UPLOAD_DIR || 'uploads/';

CONFIG.hashids_salt = process.env.HASHIDS_SALT || 'cryptocaution salt obfuscate lang ung mga ids';


if (CONFIG.app === 'dev') {
    CONFIG.google_client_id = process.env.GOOGLE_CLIENT_ID || '';
    CONFIG.google_client_secret = process.env.GOOGLE_CLIENT_SECRET || 'cryptocaution_authentication';
    CONFIG.fb_client_id = process.env.FB_CLIENT_ID || '186964375335970';
    CONFIG.fb_client_secret = process.env.FB_CLIENT_SECRET || 'adfb63b8b8576aa8b0b370e342e43c96';

} else if(CONFIG.app === 'prod') {
    CONFIG.google_client_id = process.env.GOOGLE_CLIENT_ID || '';
    CONFIG.google_client_secret = process.env.GOOGLE_CLIENT_SECRET || 'cryptocaution_authentication';
    CONFIG.fb_client_id = process.env.FB_CLIENT_ID || '186964375335970';
    CONFIG.fb_client_secret = process.env.FB_CLIENT_SECRET || 'adfb63b8b8576aa8b0b370e342e43c96';
}

module.exports = CONFIG;
