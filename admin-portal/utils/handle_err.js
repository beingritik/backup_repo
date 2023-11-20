/*
 * GUIDELINES:
 * 1. All errors outside the realm of HTTP(for eg. DB error) should be
 * generic HTTP 500 Internal server error.
 * 2. objERRS will provde single error response for given err_type.
 * Therefore a entry of different error response if required shall be made by other err_type.
 */

const objERRS = {
    objDB: {
        errCode: 503,
        errMsg: 'Database Connection Error'
    },
    
    objAUTH: {
        errCode: 401,
        errMsg: 'Unauthorized Access. Redirecting to login'
    },
    objSERVER: {
        errCode: 500,
        errMsg: 'An Internal Server Error'
    },
    objVALIDATION:{
        errCode: 403,
        errMsg: 'Invalid Body. Validation failed Error.'
    },
    objRATELIMIT:{
        errCode : 429,
        errMsg:'Too Many request! Try after sometime'
    },
    objSAMEDATA:{
        errCode:409,
        errMsg : "Data Replication: Already exists."
    }
}


function HandleErr(err_type, res) {
    let res_code = objERRS[`obj${err_type}`].errCode;
    let res_msg = objERRS[`obj${err_type}`].errMsg;

    // if(err_type==='AUTH')
    // else
    res.writeHead(res_code, { "Content-Type": "application/json" });
    //header for error
    let ERROR_OBJ = {
        Status: res_code,
        Message: res_msg,
        Data: null
    }
    // res.end(JSON.stringify({'Status':res_code,'Message':res_msg,'Data':null}));
    return [res, ERROR_OBJ];
}

//function to handle DB err
function AUTHerr(res) {
    return HandleErr('AUTH',res)
}

//function to handle DB err
function DBerr(res) {
    return HandleErr('DB', res);
}

//function to handle API err
function APIerr(res) {
    return HandleErr('API', res);
}

//Internal Server error
function SERVERerr(res) {
    return HandleErr('SERVER', res);
}

function NOTFOUNDerr(res) {
    return HandleErr('NOTFOUND', res);
}

module.exports = { DBerr, APIerr, SERVERerr, NOTFOUNDerr,
                    AUTHerr};