const { to, ReE, ReS }  = require('../services/util.service');
const userBlock = (req, res, next) => {
	// return a middleware
	
	if (req.user && !req.user.blockFlag) {
		next();
	}
	else {
		return ReE(res, 'Sorry, your account has been blocked.', 423);
	}
	
}
module.exports.userBlock = userBlock;