/* mention comments on each function about their functionality  */
const LOG = require('./logger');
const ERRHANDLER = require('./handle_err');
const SAR = require('../controllers/set_api_res');
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const ENV = require("/v1_config/admin_env_config");
const https = require("https");
const querystring = require("querystring"); // Required for URL encoding
const DB = require("../db/connection_db");
const DEBUG = ENV.PROD === false ? true : false;
// const DEBUG = false

var REDIRECTURL;
if (ENV.PROD) {
  REDIRECTURL = `https://beta.fixfd.com/admin`;
} else {
  REDIRECTURL = `http://${ENV.HOSTNAME}/admin`;
}
/**
 *Queries the admin_table table in the database for the provided email address.
 *@param {string} userEmail - The email address to be queried.
 *@returns {Promise} A Promise that resolves to the query result.
 *@throws {Error} Throws an error if there is an issue with the database connection or if the query fails.
 **/
async function ValidMails(userEmail) {
  return new Promise((resolve, reject) => {
    DB.GetConnection(async function (err, conn) {
      if (err) {
        // writelogs(err);
        res.writeHead(400, { error: "Somthing Went wrong, try Again!!" });
        res.end();
      }
      conn.query(
        `SELECT Email, Status FROM admin_table WHERE Email = "${userEmail}"`,
        function (err, result) {
          conn.release();
          if (err) {
            // writelogs(err);
            reject();
          }
          resolve(result);
        }
      );
    });
  });
}

/**
 * Sends a POST request to the Auth0 /oauth/token endpoint to exchange an authorization code for an ID token.
 * @param {string} code - The authorization code received from Auth0.
 * @returns {Promise<string>} - A Promise that resolves with the ID token or rejects with an error.
 */
async function GetToken(code) {
  const options = {
    hostname: ENV.AUTH0_HOSTNAME,
    path: "/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  const data = querystring.stringify({
    grant_type: "authorization_code",
    client_id: ENV.AUTH0_CLIENT_ID,
    client_secret: ENV.AUTH0_CLIENT_SECRET,
    code: code,
    redirect_uri: `${REDIRECTURL}/callback`,
  });

  let retry = 0;

  return new Promise((resolve, reject) => {
    const performRequest = () => {
      const req = https.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          const ID_TOKEN = JSON.parse(body).id_token;
          const REF_TOKEN = JSON.parse(body).refresh_token;
          if (DEBUG) console.log(`\nId Token: ${ID_TOKEN}\nRefresh Token: ${REF_TOKEN}`);
          resolve([ID_TOKEN, REF_TOKEN]);
        });
      });

      req.on("error", (error) => {
        if (DEBUG) console.error(error);
        // else writelogs(error);

        // Retry logic
        retry++;
        if (retry <= 3) {
          setTimeout(performRequest, 1000);
        } else {
          reject(error);
        }
      });

      req.write(data);
      req.end();
    };

    performRequest();
  });
}


/**
 * Refreshes an Auth0 token using a refresh token.
 *
 * @param {string} refreshToken - The refresh token to use.
 * @returns {Promise<[string, string]>} - A promise that resolves with an array
 * containing the new ID token and refresh token.
 */
async function RefreshToken(refreshToken) {
  const options = {
    hostname: ENV.AUTH0_HOSTNAME,
    path: "/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  const data = querystring.stringify({
    grant_type: "refresh_token",
    client_id: ENV.AUTH0_CLIENT_ID,
    client_secret: ENV.AUTH0_CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        const response = JSON.parse(body);
        const idToken = response.id_token;
        /* update the refersh token if new refresh token is present else assgin null 
        *  A new refresh token will be present in body when user manually logs in for the first time
        *  When using a stored refersh token to generate a new acess token new refersh is NOT generated
        */
        const newRefreshToken = response.refresh_token ?? null;
        if (DEBUG) console.log("\nREFRESH TOKEN BODY ", response);
        resolve([idToken, newRefreshToken]);
      });
    });

    req.on("error", (error) => {
      if (DEBUG) console.error(error);
      // else writelogs(error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Initializes a JWKS (JSON Web Key Set) client using the `jwks-client` library.
 * The client is configured to retrieve the JWKS from the Auth0 domain specified in the `ENV.AUTH0_HOSTNAME` environment variable.
 */
const client = jwksClient({
  jwksUri: `https://www.googleapis.com/oauth2/v3/certs`,
});

/**
 * Validates an ID token using Auth0's JSON Web Token library.
 * @param {string} idToken - The ID token to be validated.
 * @returns {Promise<Object>} - A promise that resolves with the decoded token.
 * @throws {Error} - If there is an error during validation.
 */
async function ValidateIdToken(idToken) {
  const decodedToken = jwt.decode(idToken, { complete: true });
  // console.log('\n decoded token\n',decodedToken)
  const kid = decodedToken.header.kid;
  const userUID= decodedToken.payload.sub
  const hasExpired = decodedToken.exp < Date.now() / 1000;

  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        reject(err);
      } else {
        const signingKey = key.publicKey || key.rsaPublicKey;
        jwt.verify(idToken, signingKey, (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        });
      }
    });
  });
}

/**
 * Verifies if the given user is allowed to access the dashboard based on their email.
 * If the user email is allowed, redirects to the dashboard page.
 * Otherwise, redirects to the login page with an error message.
 * @param {Object} userInfo - An object containing user information, including the email.
 * @param {Object} res - The response object to be used for sending the HTTP response.
 */
async function VerifyUserId(userInfo) {
  const USEREMAIL = userInfo.email;
  let userChunk = await ValidMails(USEREMAIL);
  if (userChunk.length && userChunk[0].Status === "Active") {
    return true;  //user exists in db
  } else {
    return false; //user does not exist in db
  }
}


/**
 * Handles the callback from an OAuth authorization flow.
 * @param {Object} res - The response object to send the HTTP response.
 * @param {Object} parsedQuery - The parsed query parameters from the callback URL.
 * @returns {Object} The response object containing the HTTP status, headers, and body.
 * @throws {Error} If an internal server error occurs.
 */
async function HandleCallback(res, parsedQuery) {
  const CODE = parsedQuery.code;
  if (DEBUG) console.log("\n\nParsed query Code: ", CODE);
  try {
    // throw new Error()
    const [ID_TOKEN, REF_TOKEN] = await GetToken(CODE);
    const userInfo = await ValidateIdToken(ID_TOKEN);
    const isVerified = await VerifyUserId(userInfo);
    if (!isVerified) {
      const response = {
        status: 302,
        headers: {
          Location: "/admin/login?error=User%20not%20allowed",
        },
      };
      return response;
    }
    userInfo.sid = generateUniqueSessionID(userInfo);
    if (DEBUG) console.log(userInfo);

    const isExistingUser = await checkUserExists(res, userInfo);
    if (!isExistingUser) {
      await insertUser(res, userInfo);
      await insertRefreshToken(res, userInfo, REF_TOKEN);
    } else {
      if (DEBUG) console.log("user exists");
      await insertRefreshToken(res, userInfo, REF_TOKEN);
    }

    // Set id_token as a cookie in the response headers
    const COOKIEVALUE = ID_TOKEN;
    const response = {
      status: 302,
      headers: {
        "Set-Cookie": [
          `id_token=${COOKIEVALUE}; HttpOnly; Path=/`,
          `Sess_id=${userInfo.sid}; HttpOnly; Path=/`,
        ],
        Location: "/admin/dashboard",
      },
    };
    return response;
  } 
  catch (error) {
    if (DEBUG) console.error(error);
    const response = {
      status: 500,
      body: "Yiiiikessss Internal server error",
    };
    return response;
  }
}




/**
 * Validates the user session by extracting the id_token from the request cookies,
 * decoding and verifying it, and checking if the user email is allowed. If the user
 * session is valid, returns the decoded token. Otherwise, redirects to the login page
 * with an error message.
 *
 * @param {object} req - The request object.
 *
 * @returns {object}
 *
 * @throws Will throw an error if the user email is not allowed or the id_token is invalid or expired.
 */
async function ValidateUserSession(idToken, req) {
  console.log(`Inside Validateusersession for request: ${req.url}`);
  // return { isValid: false, triggerRefershToken: true };
  if (idToken) {
    try {
      const decodedToken = await ValidateIdToken(idToken);
      const USEREMAIL = decodedToken.email;
      let userChunk = await ValidMails(USEREMAIL);
      if (userChunk.length && userChunk[0].Status === "Active") {
        // if (true) console.log(`Valid User session for request: ${req.url}`);
        return { isValid: true, triggerRefershToken: false }
      } else {
        return { isValid: false, triggerRefershToken: false }
        // throw new Error("User email is not allowed");
      }
    } catch (error) {
      if (DEBUG) 
        console.log(
          `Error validating user session: ${error}`
        );
      // else writelogs(`Error validating user session: ${error}`);
      if (error.name=='TokenExpiredError')
        return { isValid: false, triggerRefershToken: true };
      else return { isValid: false, triggerRefershToken: false }
    }
  } else {
    if (DEBUG) console.log("No id_token found in cookies");
    // else writelogs("No id_token found in cookies");
    return { isValid: false, triggerRefershToken: false }
    // redirectToLoginWithError(res, "Invalid user session");
  }
}

/**
 * Extracts the value of the "id_token" cookie from the provided cookies header string.
 * If the cookie is not found, returns null.
 *
 * @param {string} cookiesHeader - The cookies header string to extract the cookie from.
 * @returns {string|null} The value of the "id_token" cookie, or null if not found.
 */
function extractIdTokenFromCookies(cookiesHeader) {
  if (cookiesHeader) {
    const cookiesArr = cookiesHeader.split(";");
    for (const cookie of cookiesArr) {
      const [cookieName, cookieValue] = cookie.trim().split("=");
      if (cookieName === "id_token") {
        return cookieValue;
      }
    }
  }
  return null;
}

/**
 * Extracts the value of the "Sess_Id" cookie from the provided cookies header string.
 * If the cookie is not found, returns null.
 *
 * @param {string} cookiesHeader - The cookies header string to extract the cookie from.
 * @returns {string|null} The value of the "id_token" cookie, or null if not found.
 */
function extractSessIdFromCookies(cookiesHeader) {
  if (cookiesHeader) {
    const cookiesArr = cookiesHeader.split(";");
    for (const cookie of cookiesArr) {
      const [cookieName, cookieValue] = cookie.trim().split("=");
      if (cookieName === "Sess_id") {
        return cookieValue;
      }
    }
  }
  return null;
}


/**
 * Handles user logout by clearing id_token and Sess_Id cookie.
 * @param {object} res - The HTTP response object.
 * @returns {object} res - The HTTP response object.
 */
const HandleLogout = (res) => {
  res.setHeader("Set-Cookie", [
    "id_token=; HttpOnly; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Sess_id=; HttpOnly; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ]);
  return res;
};


async function setNewIdToken(idToken, res) {
  const { payload: userInfo } = await jwt.decode(idToken, { complete: true });
  console.log(userInfo);
  idToken = await generateNewTokens(res, userInfo);
  res.setHeader("Set-Cookie", `id_token=${idToken}; HttpOnly; Path=/`);
  return idToken;
}

// Check if the user exists in the users table
async function checkUserExists(res,userInfo) {
  const query = `SELECT COUNT(*) AS count FROM admin_users WHERE sub = '${userInfo.sub}'`;
  try {
    const [RES, RESPONSE_PAYLOAD] = await SAR.ApiWrapper(null,res,query);
    const count = RESPONSE_PAYLOAD.Data[0].count;
    return count > 0
  } catch (error) {
    throw error
  }
}

// Insert the new user details into the users table
async function insertUser(res,userInfo) {
  const query = `INSERT INTO dev_FD.admin_users (sub, email, full_name) VALUES ('${userInfo.sub}', '${userInfo.email}', '${userInfo.name}' );`;
  try {
    const [RES, RESPONSE_PAYLOAD] = await SAR.ApiWrapper(null, res, query);
    console.log(RESPONSE_PAYLOAD)
  } catch (error) {
    throw error
  }
}

const REF_TOKEN_EXP_DURATION = 86400  // seconds

// Insert a new refresh token entry for the user and device
async function insertRefreshToken(res, userInfo, refreshToken) {
  const userId = await getUserId(res,userInfo);
  const sessionId = userInfo.sid
  const issuedAt = userInfo.iat
  const expiresAt = issuedAt + REF_TOKEN_EXP_DURATION
  const query = `INSERT INTO dev_FD.admin_user_login (user_id, session_id, refresh_token, create_time, expire_time) VALUES ('${userId}', '${sessionId}', '${refreshToken}', FROM_UNIXTIME(${issuedAt}), FROM_UNIXTIME(${expiresAt}));`
  try {
    const [RES, RESPONSE_PAYLOAD] = await SAR.ApiWrapper(null,res,query);
    console.log(RESPONSE_PAYLOAD)
  } catch (error) {
    throw error
  }
}

// delete the refresh token from database using Sess_Id stored in cookies
async function deleteRefreshToken(req,res) {
  const sessionId=  extractSessIdFromCookies(req.headers.cookie)
  const query = `DELETE FROM dev_FD.admin_user_login WHERE session_id = '${sessionId}';`;

  try {
    const [RES, RESPONSE_PAYLOAD] = await SAR.ApiWrapper(null, res, query);
    console.log(RESPONSE_PAYLOAD);
  } catch (error) {
    throw error;
  }
}

// Get refresh token entry for the user
async function getRefreshToken(res, userInfo) {
  const userId = await getUserId(res,userInfo);
  const query = `SELECT refresh_token FROM admin_user_login WHERE user_id = ${userId};`
  try {
    const [RES, RESPONSE_PAYLOAD] = await SAR.ApiWrapper(null,res,query);
    console.log(RESPONSE_PAYLOAD)
    return RESPONSE_PAYLOAD.Data[0].refresh_token
  } catch (error) {
    throw error
  }
}

async function generateNewTokens(res, userInfo){
    const REF_TOKEN = await getRefreshToken(res, userInfo)
    const [NEW_ID_TOKEN, _] = await RefreshToken(REF_TOKEN);  // since stored ref token is used, new ref will be null 
    return NEW_ID_TOKEN
    
    // const NEW_userInfo = await ValidateIdToken(NEW_ID_TOKEN);
    // if (DEBUG) console.log("\n Refresh token used", NEW_userInfo);
}
// update refresh token entry for the user
async function updateRefreshToken(res, userInfo, refreshToken) {
  const userId = await getUserId(res,userInfo);
  const sessionId = userInfo.sid
  const issuedAt = userInfo.iat
  const expiresAt = issuedAt + REF_TOKEN_EXP_DURATION
  const query = `UPDATE dev_FD.admin_user_login SET session_id = '${sessionId}', refresh_token = '${refreshToken}', create_time = FROM_UNIXTIME(${issuedAt}), expire_time = FROM_UNIXTIME(${expiresAt}) WHERE user_id = ${userId};`;  
  try {
    const [RES, RESPONSE_PAYLOAD] = await SAR.ApiWrapper(null,res,query);
    console.log(RESPONSE_PAYLOAD)
  } catch (error) {
    throw error
  }
}

async function getUserId(res,userInfo) {
  const query = `SELECT id FROM admin_users WHERE sub = '${userInfo.sub}';`
  try {
    const [RES, RESPONSE_PAYLOAD] = await SAR.ApiWrapper(null,res,query);
    // console.log(RESPONSE_PAYLOAD.Data[0].id);
    return RESPONSE_PAYLOAD.Data[0].id
  } catch (error) {
    throw error
  }
}

// generate unique User Session id 
function generateUniqueSessionID(userInfo) {
  // Generate a UNIX timestamp
  const timestamp = Math.floor(Date.now() / 1000);

  // Concatenate the sub claim with the timestamp to create a unique session ID
  const sessionID = `${userInfo.sub}_${timestamp}`;
  // res.setHeader("Set-Cookie", `Sess_id=${sessionID}; HttpOnly; Path=/`);
  return sessionID;
}


module.exports = {
  HandleCallback,
  ValidateUserSession,
  HandleLogout,
  extractIdTokenFromCookies,
  extractSessIdFromCookies,
  ValidateIdToken,
  generateNewTokens,
  setNewIdToken,
  deleteRefreshToken
};
