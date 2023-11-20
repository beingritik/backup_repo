/**
 * Request is coming from beta.fixfd.com and routed to AdminServer function to return response.
 * all backend apis of admin page has route to /api/admin.
 */

const ENV = require('/v1_config/admin_env_config');    // Environment configuration file
const HTTP = require('http');
const URL = require('url');
const GAR = require('./routes/admin_api_routes');   // API routes 
const GA = require('./controllers/admin_get_asset');
const GP = require('./controllers/admin_get_page');
const SERVICES = require('./utils/services');
const LOG = require('./utils/logger');
const ERRHANDLER = require('./utils/handle_err');
const AUTH = require('./utils/admin_auth');


/**
 * function will return response based on api call
 * @param {*} req recived request
 * @param {*} res response
 */

const AdminServer = (async (req, res) => {
    const objParsedUrl = URL.parse(req.url, true);
    let pathName = objParsedUrl.pathname;

    // backend post apis to fetch data, update, delete, insert data 
    if (req.url.includes('/api/admin')) {
        var idToken = AUTH.extractIdTokenFromCookies(req.headers.cookie);

        //user session is {isValid: boolean, triggerRefreshToken: boolean} 
        let userSession = await AUTH.ValidateUserSession(idToken, req);
        if (userSession.triggerRefershToken) {
            let NewIdToken = await AUTH.setNewIdToken(idToken, res);
            userSession = await AUTH.ValidateUserSession(NewIdToken, req);
        }
        if (userSession.isValid) {
            try { //handling error of await proceess (could generate due to long waiting time)

                let body = await SERVICES.GetBodyData(req, res);
                let serverResponse = await GAR.GetApi(req, res, body);
                serverResponse[0].writeHead(serverResponse[1].Status)
                serverResponse[0].write(JSON.stringify(serverResponse[1]));
                serverResponse[0].end();
            } catch (err) {
                // LOG.logError("Error in hit of API: ", err.message);
                let errResponse = ERRHANDLER.SERVERerr(res);
                errResponse[0].write(JSON.stringify(errResponse[1]));
                errResponse[0].end();
            }
        }
        else {

            LOG.logError('Unauthorized Access');
            let errResponse = ERRHANDLER.AUTHerr(res);
            errResponse[0].write(JSON.stringify(errResponse[1]));
            errResponse[0].end();
        }
    }
    // to laod static js, images, and css
    else if (req.url.includes('/admin-assets') && !req.url.includes('code') && req.method === "GET") { // for Oauth callback url, the code might include '.', in that case do not enter the code block
        const resContentType = SERVICES.GetContentType(pathName);
        //reading static and asset files
        GA.GetAsset(req, res, pathName, resContentType);
    }
    // to load html pages
    else {
        GP.GetPage(req, res, pathName);
    }
})

module.exports = {
    AdminServer
}