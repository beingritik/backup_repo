const DB = require('../db/connection_db');
const LOG = require('../utils/logger')
const ERRHANDLER = require('../utils/handle_err');

var ApiWrapper = (req, res, query) => {
  /*QUERY using pool.getConnection -> connection.query() -> connection.release() */
  return new Promise((resolve, reject) => {
    //logger here
    const timer = setTimeout(() => {
      LOG.logError(`db Timeout`);
      let errResponse = ERRHANDLER.objDB(res);
      reject(errResponse);
    }, 10000)

    DB.GetConnection(async function (err, con) {
      if (err) {
        //logger here 
        LOG.logError(`${err.code}(Err.No. : ${err.errno}) : ${err.sqlMessage}`)
        let errResponse = ERRHANDLER.DBerr(res);
        clearTimeout(timer);
        reject(errResponse);
      }
      con.query(query, function (error, results) {
        // Done with the connection, releasing it.
        con.release();
        // Handle error eafter the release.
        if (error) {
          LOG.logError(`${error.code}(Err.No.:${error.errno}): ${error.sqlMessage}`);
          let errResponse = ERRHANDLER.DBerr(res);
          clearTimeout(timer);
          reject(errResponse);
        }
        else {
          //response headers
          res.setHeader("Content-Type", "application/json");
          //set the response 
          let RESPONSE_PAYLOAD = {
            Status: 200,
            Message: 'Ok',
            Data: results
          }
          clearTimeout(timer);
          //end the response
          resolve([res, RESPONSE_PAYLOAD]);
        }
      })
    });
  })

}

module.exports = { ApiWrapper };
