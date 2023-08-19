const { env } = require('../config/config');
const debug = {
    log: function(...value){
        if (env !== 'production' && env !== 'prod') {
            console.log(value);
        }
    }
}

module.exports = {
    debug
}