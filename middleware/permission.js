const { Entity } = require('../models');
const { decodeHash } = require('../services/hash.service');
const { to, ReE, ReS }  = require('../services/util.service');

// middleware for doing role-based permissions
const permit = (...allowed) => {
	// return a middleware
	return (req, res, next) => {
		const isAllowed = (userRoles) => { 
			return allowed.some(allowedRole => {
				if(typeof allowedRole === 'function') {
					return allowedRole(req, res, next);
				}
				return userRoles.includes(allowedRole);
			}); 
		};
		
		if (req.user && isAllowed(req.user.roles || [])) {
			next(); // role is allowed, so continue on the next middleware	
		}
		else {
			return res.status(403).json({message: "Forbidden"}); // user is forbidden
		}
	}
}
// // account update & delete (PATCH & DELETE) are only available to account owner
// api.patch("/account", permit('owner'), (req, res) => req.json({message: "updated"}));
// api.delete("/account", permit('owner'), (req, res) => req.json({message: "deleted"}));
// // viewing account "GET" available to account owner and account member
// api.get("/account", permit('owner', 'employee'),  (req, res) => req.json({currentUser: request.user}));
module.exports.permit = permit;



const permitAdminOrEntityPublisher = async (req, res, next) => {
	const user = req.user;
	let userRoles = req.user.roles || [];
	if (typeof userRoles === 'string') {
		try {
			userRoles = JSON.parse(userRoles);
		} catch (e) {}
	}
	if (userRoles.includes('admin')) { 
		console.log('CONTINUE USER IS AN ADMIN');
		return next(); 
	}

	let id = req.params['id'];
	id = decodeHash(id);
	console.log('check if entity exists');
	let entity, err, userHasEntity;
	[err, entity] = await to(Entity.findById(id));
	if (err) return ReE(res, err, 422);

	console.log('check if user published entity.');
	[err, userHasEntity] = await to(user.hasEntity(entity));
	if (err) return ReE(res, err, 422);

	console.log('USER HAS ENTITY', userHasEntity);
	if (!userHasEntity) {
		res.status(403).json({message: "Forbidden"}); // user is forbidden
	} else {
		return next();
	}
};
module.exports.permitAdminOrEntityPublisher = permitAdminOrEntityPublisher;