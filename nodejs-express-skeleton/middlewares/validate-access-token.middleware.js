const jwt_decode = require('jwt-decode');
const auth = require('basic-auth');

const { getOneEmployeeFromSC } = require("../util/smart-connect-handler");
const { getUsers, getChannelOperators } = require("../util/send-bird-handler");

const validateAdmin = async (req, res, next) => {
    try{
        let token  = req.headers.authorization? req.headers.authorization.slice(7, req.headers.authorization.length) : null;
        let user_info = token? jwt_decode(token): null;
        if(token == null){
            res.status(401).send("Forbidden");
            return;
        }
        user_info = await getUsers((await getOneEmployeeFromSC(user_info.preferred_username, token)).person_id);
        if(!user_info.users[0].metadata.isAdmin || user_info.users[0].metadata.isAdmin == 'false' ){
            res.status(401).send("You must be an admin to use this function");
            return;
        }
        next();
    }catch(e){
        console.error(e);
        res.status(401).send("Forbidden");
        return;
    }
};

const validateFacilitator = async (req, res, next) => {
    try{
        let token  = req.headers.authorization? req.headers.authorization.slice(7, req.headers.authorization.length) : null;
        let user_info = token? jwt_decode(token): null;
        let channelInfo = await getChannelOperators(req.body.channelUrl);
        if(token == null){
            res.status(401).send("Forbidden");
            return;
        }
        console.log(user_info);
        user_info = (await getOneEmployeeFromSC(user_info.preferred_username, token));
        if(channelInfo.operators.findIndex(r => r.user_id == user_info.person_id) == -1){
            res.status(401).send("You must be a facilitator to use this function");
            return;
        }
        next();
    }catch(e){
        console.error(e);
        res.status(401).send("Forbidden");
        return;
    }
};

const validateBasicAccessToken = async (req, res, next) => {
    
    var credentials = auth(req);
    if (!credentials || !(credentials.name =="smartr-service" && credentials.pass == "LowoermdaYR7tpF8nDdDu6EHyQfowYeuVrospZ")) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="example"')
        res.end('Access denied');
        return;
    }
    
    req.headers["user-id"] = "pf-squad";
    next();
};

module.exports = { validateAdmin, validateFacilitator, validateBasicAccessToken };
