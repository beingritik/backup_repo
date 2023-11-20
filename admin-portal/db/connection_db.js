const MYSQL = require('mysql2');
const DB_CONFIG = require('/v1_config/admin_env_config').DB_CONFIG;

const objDbPool = MYSQL.createPool(DB_CONFIG);
var GetConnection = function(callback){
    objDbPool.getConnection(function(err, connection){
        if(err){
            return callback(err);
        }
        callback(null, connection);
    });
}

const DbPoolQuery = async () => {
    pool.query(sqlquery, function(err, sqlresult){
        if(err) throw err;
        return sqlresult;
    })
}

module.exports = {
    objDbPool,
    GetConnection,
    DbPoolQuery
}