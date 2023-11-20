const ENV = require("/v1_config/admin_env_config");
const FS = require("fs");
const url = require("url");
const querystring = require("querystring");
const {HandleCallback,ValidateUserSession,HandleLogout,extractIdTokenFromCookies,setNewIdToken,deleteRefreshToken}= require('../utils/admin_auth')
const path = require("path");
const DEBUG = ENV.PROD === false ? true : false;

const GetPage = async (req, res, pathName) => {
  const parsedUrl = url.parse(req.url);
  const parsedQuery = querystring.parse(parsedUrl.query);
  if (pathName === "/admin/login") {
    const idToken=  extractIdTokenFromCookies(req.headers.cookie)
    if (!idToken) {
      FS.readFile(path.join(__dirname,'../views/login_page.html'), function (err, html) {
        if (err) throw err;
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(html);
        res.end();
      });
    } else {
      // Redirect to dashboard
      res.writeHead(302, { Location: '/admin/dashboard' });
      res.end();
    }
  } 
  else if (pathName === "/admin/logout") {
    if(DEBUG)console.log('\n*** Logging Out ***\n')
    await deleteRefreshToken(req,res)
    const response= HandleLogout(res);
    response.writeHead(302, { Location: '/admin/login' });
    response.end()
  }
  else if (pathName == "/admin/dashboard") {
      let idToken = extractIdTokenFromCookies(req.headers.cookie);
      // console.log(idToken);
        let userSession = await ValidateUserSession(idToken, req);
        // console.log(userSession);
        if(userSession.triggerRefershToken){
          let NewIdToken = await setNewIdToken(idToken, res);
          userSession = await ValidateUserSession(NewIdToken, req);
          console.log('refreshed user session',userSession);
      }
    if (userSession.isValid) {
      console.log(`Valid User session for request: ${req.url}`)
      FS.readFile(path.join(__dirname,'../views/dashboard.html'), function (error, html) {
        if (error) throw error;
        //response headers
        res.writeHead(200, { "Content-Type": "text/html" });
        //set the response
        res.write(html);
        //end the response
        res.end();
      });
    }
    else {
      // Redirect to login
    const response= HandleLogout(res);
    response.writeHead(302, { Location: '/admin/login' });
    response.end()
    }
  } 
  else if (pathName === "/admin/callback") {
    const response = await HandleCallback(res,parsedQuery);
    res.writeHead(response.status, response.headers);
    res.end();   
  }
  
  else{
    FS.readFile(path.join(__dirname,'../views/404.html'), function (err, html) {
      if (err) throw err;
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(html);
      res.end();
    });
  }
};
module.exports = { GetPage,ValidateUserSession };


