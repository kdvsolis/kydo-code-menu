
const redis = require('redis');
const JWTR =  require('jwt-redis').default;
const redisClient = redis.createClient({
    legacyMode: true
});
const jwtr = new JWTR(redisClient);
var sessionstorage = require('sessionstorage');
var request = require('request');
var jwt = require('jsonwebtoken');

redisClient.connect();

async function checkToken(req, res) {

    return new Promise((resolve, reject) => {
        let token = req.headers['x-access-token'] || req.headers['authorization'];
        if (token) {
            if (token.startsWith('Bearer ')) {
                token = token.slice(7, token.length);
            }
            jwtr.verify(token, JSON.parse(process.env.ADMIN_CRED).token).then(result =>{
                resolve();
            }).catch(function(err){
                if (err) {					
					res.clearCookie('token', {path: '/', sameSite: 'lax'})
					res.clearCookie('user_id', {path: '/', sameSite: 'lax'})
					res.clearCookie('cart_items', {path: '/', sameSite: 'lax'})
					res.clearCookie('cart_later_items', {path: '/', sameSite: 'lax'})
					res.clearCookie('isPremiumUser', {path: '/', sameSite: 'lax'})
                    res.clearCookie('checked_products', {path: '/', sameSite: 'lax'})
					res.clearCookie('hasSampleInCart', {path: '/', sameSite: 'lax'});
					res.clearCookie('cart_temporary', {path: '/', sameSite: 'lax'});
                    res.status(403).send('Auth error');
                }
            })
        } else {
            res.status(403).send('Auth token is not supplied');
        }
    });
}

async function getSFToken(clientId, privateKey, userName, cb) {
	var options = {
		issuer: clientId,
		audience: JSON.parse(process.env.SALESFORCE_JWT).sf_url,
		expiresIn: 60,
		algorithm:'RS256'
	}

	var token = jwt.sign({ prn: userName }, privateKey, options);

	var post = {
		uri: JSON.parse(process.env.SALESFORCE_JWT).sf_url + '/services/oauth2/token',
		form: {
			'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			'assertion':  token
		},
		method: 'post'
	}
	return new Promise(resolve => {
		request(post, function (error, response, body) {
			if(!error)
				resolve(body);
		})
	})
}

function JsonTryParse(string) {
	try {
		return JSON.parse(string);
	} catch (e) {
		return null;
	}
}


module.exports = { redis, JWTR, redisClient, jwtr, checkToken, sessionstorage, getSFToken }
