/* Depennencies  */
var _ = require("lodash");
const FS = require('fs');
/* Local Dependencies */
const ENV = require('/v1_config/admin_env_config');
const DB = require('../db/connection_db');
const LOG = require('../utils/logger');
const ERRHANDLER = require('../utils/handle_err');
const SAR = require('../controllers/set_api_res');
const { ExtractFormData } = require('../utils/services');
const APYCAL = require("../utils/cal_apy_rate");
const VALIDATE = require('../utils/validate');
const SCRAPRUNSCRIPT = require("../utils/scrap_code");
/* Global Constants */
const MIN = 100;
const MAX = 999;

//Promisify the connection function for executing SQL query
function Connection(query) {
  let objErrorPayload = {
    Status: 503,
    Message: "Database connection Error",
    Data: null
  }
  return new Promise((resolve, reject) => {
    DB.GetConnection(async (err, con) => {
      if (err) {
        console.log(`error here in rejection of connection:${err.message}`)
        return objErrorPayload;
      }
      con.query(query, async function (err, result) {
        if (err) {
          LOG.logError(`Rejection of DB connection:${err.message}`)
          reject(objErrorPayload);
        }
        resolve(result);
      })
    })
  })
}


//Primary function call for API
var GetApi = async function (req, res, body) {

  //For parsing the given body 
  let parsedBody = VALIDATE.JsonParse(body);

  //set the request route
  if (req.url === "/api/admin/get-bank-list" && req.method === "GET") {
    try {
      var SqlQuery = `SELECT Bank_Name, Nick_Name, Bank_ID from Bank_Master;`;
      let serverResponse = await SAR.ApiWrapper(req, res, SqlQuery);
      return serverResponse;
    }
    catch (err) {
      LOG.logError(`Error in getting bank list :${err.message}`)
      return err;
    }
  }
  //For fetching the bank data
  else if (req.url === "/api/admin/bank-data" && req.method === "POST") {
    try {
      //listening to data sent by client while requesting POST API

      if (!parsedBody) {
        LOG.logError(`Can't parse body into json format`);
        let errResponse = ERRHANDLER.APIerr(res);
        return errResponse;
      }
      var searchId = parsedBody.Bank_ID;
      var SqlQuery = `select Bank_ID,Bank_Name,Nick_Name,Bank_Type,Pri_URL,Alter_URL,Rating1,Rating2,Rating3,Rating4,Address,Status,Interest_info,MaxIR,Compounding_Period,MaxGenIR,MaxSrIR,Image_URL from Bank_Master where Bank_ID="${searchId}";`;
      SqlQuery += `select Logic_Code, Return_Type, Keywords from Scrap_FD WHERE Bank_ID = ${searchId};`;
      let serverResponse = await SAR.ApiWrapper(req, res, SqlQuery);
      return serverResponse;
    }
    catch (err) {
      LOG.logError(`Error in getting bank data :${err.message}`)
      return err;
    }
  }
  // update interest rate 
  else if (req.url === "/api/admin/update-ir" && req.method === "POST") {
    try {

      // listening to data sent by client while requesting POST API
      let body = parsedBody;

      // Parsing IR, MaxIR in obj.
      var objIR = JSON.parse(body.Interest_info);
      var objMaxIR = JSON.parse(body.MaxIR);

      // extracting Date for Ir lastupdated date month, year as well
      var getDateValue = String(new Date().getDate()).padStart(2, '0'); // padstat helps to expand date to double digit eg : 01:03:2022 
      var getMonthValue = String(new Date().getMonth() + 1).padStart(2, '0');
      var getYearValue = new Date().getFullYear();
      var irLastUpdated = getYearValue + "/" + getMonthValue + "/" + getDateValue; //irLastUpdated in date only format

      //validate the datatypes and other valdation on parsed body
      const _VALIDATOR_ = VALIDATE.InterestRateValidation(body, objIR, objMaxIR);

      //Checks where the Interest Info Body is blank then it is mandetory to give bank status (Not Available, Suspended, Closed, Inactive)
      if (!(objIR.length) && body.status === '') {
        let errResponse = ERRHANDLER.APIerr(res);
        return errResponse;
      }

      /* Checks validity of data */
      if (_VALIDATOR_) {
        // APY rate calculation based on current Interest rate object and compounding period
        var irInfo = APYCAL.CalAPY(objIR, body.comp_period);
        irInfo = JSON.stringify(irInfo);
        if (body.Prev_Ir_info != undefined) {
          if (_.isEqual(objIR, JSON.parse(body.Prev_Ir_info))) {

            // Same Data already exist error
            let errResponse = ERRHANDLER.APIerr(res);
            return errResponse;
          }
        }
        if (objMaxIR.length == 0) {
          objMaxIR.push({
            maxGenIr: 0,
            maxSrIr: 0
          })
        }
        let SqlQuery = `UPDATE Bank_Master SET Interest_info = '${irInfo}', MaxIR='${body.MaxIR}', IR_Last_Updated='${irLastUpdated}', MaxGenIR = '${objMaxIR[0].maxGenIr}', MaxSrIR = '${objMaxIR[0].maxSrIr}' WHERE Bank_Name = ${body.Bank_Name}`;
        if (objIR.length === 0) {
          SqlQuery = `UPDATE Bank_Master SET Interest_info = '${irInfo}', MaxIR='${body.MaxIR}', IR_Last_Updated='${irLastUpdated}', MaxGenIR = '${objMaxIR[0].maxGenIr}', MaxSrIR = '${objMaxIR[0].maxSrIr}', Status='${body.status}' WHERE Bank_Name = ${body.Bank_Name}`;
        }
        let insertIrHist = `insert into IR_History (Bank_ID,Bank_Name,Interest_info,IR_Updation_Date) values(${body.Bank_ID},'${body.Bank_Name}','${irInfo}', '${irLastUpdated}');`
        let serverResponse = await SAR.ApiWrapper(req, res, SqlQuery);
        await SAR.ApiWrapper(req, res, insertIrHist); // update interest rate history table 
        DB.GetConnection(async function (err, conn) {
          if (err) return err;

          APYCAL.deleterecord(conn, body.Bank_ID);
          APYCAL.update(conn, body.Bank_ID, objIR);
        });
        return serverResponse;
      }
      else {
        let errResponse = ERRHANDLER.APIerr(res);
        return errResponse;
      }
    }
    catch {
      let errResponse = ERRHANDLER.DBerr(res);
      return errResponse;
    }
  }
  // update scrap fd code, return type, keywords as well
  else if (req.url === "/api/admin/update-scrap-fd" && req.method === "POST") {
    try {
      var body = parsedBody;
      var SqlQuery = `UPDATE Scrap_FD SET Keywords = "${body.Keywords}", Return_Type = "${body.Return_Type}" , Logic_Code = "${body.Logic_Code}" WHERE Bank_ID = ${body.Bank_ID};`
      const _VALIDATOR_ = VALIDATE.ScrapFdValidation(body);

      // let serverResponse;
      if (_VALIDATOR_) {
        let serverResponse = await SAR.ApiWrapper(req, res, SqlQuery);
        return serverResponse;
      }
      return ERRHANDLER.APIerr(res);
    }
    catch (err) {
      return ERRHANDLER.DBerr;
    }
  }
  // create new bank with interest rate, max Interest rate table
  else if (req.url === "/api/admin/create-bank" && req.method === "POST") {
    try {
      var getDateValue = String(new Date().getDate()).padStart(2, '0');
      var getMonthValue = String(new Date().getMonth() + 1).padStart(2, '0');
      var getYearValue = new Date().getFullYear();
      var irLastUpdated = getYearValue + "/" + getMonthValue + "/" + getDateValue;
      var getHourValue = String(new Date().getHours()).padStart(2, '0');
      var getMinuteValue = String(new Date().getMinutes()).padStart(2, '0');
      var getSecondValue = String(new Date().getSeconds()).padStart(2, '0');
      var cronLastUpdated = getYearValue + "/" + getMonthValue + "/" + getDateValue + " " + getHourValue + ":" + getMinuteValue + ":" + getSecondValue;

      // to extract the data from the formdata, returns an object;
      var objFormData = await ExtractFormData(req, body);
      // extracting the object containing bank_info
      let bodyInfo = objFormData.objinfo;
      let parsedBody = VALIDATE.JsonParse(bodyInfo);

      if (!parsedBody) {
        LOG.logError(`Can't parse body into json format`);
        let errResponse = ERRHANDLER.APIerr(res);
        errResponse[0].write(JSON.stringify(errResponse[1]));
        return errResponse;
      }
      // validate bank information data as backend validation
      let objBody = await VALIDATE.ValidateBody(parsedBody);
      // validate interest rate is in correct form or not, using body, interest info, maxInterest.
      const _VALIDATEIR_ = VALIDATE.InterestRateValidation(parsedBody, parsedBody.newIrInfoArr, parsedBody.newMaxIrArr);
      var typeofResult = typeof (objBody);

      if (!typeofResult && typeofResult !== 'object' && !_VALIDATEIR_) {
        LOG.logError('Body Validation failed');
        let errResponse = ERRHANDLER.VALIDATIONerr(res);
        return errResponse;
      }
      else {
        imgData = objFormData.newlogo;
        let headerValidation = await VALIDATE.CheckHeader(imgData);
        //Generating the newname for the file.
        if (headerValidation) {
          var randomValue = (Math.floor(Math.random() * (MAX - MIN + 1)) + MIN).toString();
          var maxIrString = JSON.stringify(parsedBody.newMaxIrArr);
          var newIrInfoArr = APYCAL.CalAPY(parsedBody.newIrInfoArr, parsedBody.compounding);
          var irString = JSON.stringify(newIrInfoArr);
          //Query for getting the last ID from the BAnk MAster table for newly inserted bank logo name
          var query = `SELECT Bank_ID FROM Bank_Master ORDER BY Bank_ID DESC LIMIT 1;`;
          let bankData = await Connection(query);
          let newBankId = bankData[0].Bank_ID + 1;
          //concat logo name with the filepath
          var newName = (JSON.stringify(newBankId)).concat("_", randomValue);
          newName += `.${objFormData.extension}`;
          //Giving file the desired path.
          let newPath = ENV.LOGOPATH;
          newPath += newName;
          //Formating of address field as reuiredf in the query
          if (objBody.address !== null) {
            objBody.address = "'" + objBody.address + "'";
          }

          //Decoding the base64 buffer.
          var base64dataDecoded = Buffer.from(imgData, "base64");
          // console.log(objBody)
          // Inserting the bank in the database query
          let SqlQuery = `INSERT INTO Bank_Master 
         (Bank_ID, Bank_Name, Nick_Name, Bank_Type, Pri_URL, Alter_URL, Rating1, Rating2, Rating3, Rating4, Address, Cron_Last_Updated, IR_Last_Updated, Status, Interest_info, MaxIR,  Compounding_Period, MaxGenIR, MaxSrIR, Image_URL) 
         VALUES 
         (${newBankId},'${objBody.name}', '${objBody.nickname}', '${objBody.type}', '${objBody.pri}', '${objBody.alter}', ${objBody.rating1}, ${objBody.rating2}, ${objBody.rating3}, ${objBody.rating4}, '${objBody.address}', '${cronLastUpdated}', '${irLastUpdated}', '${objBody.newStatus}', '${irString}', '${maxIrString}','${objBody.compounding}', ${objBody.newMaxIrArr[0].maxGenIr}, ${objBody.newMaxIrArr[0].maxSrIr}, '${newPath}')`;

          let serverResponse = await SAR.ApiWrapper(req, res, SqlQuery);
          let serverData = serverResponse[1].Data;

          if (serverData.affectedRows === 1) {
            //Writing the file buffer to the destined location
            FS.writeFile(newPath, base64dataDecoded, async (err) => {
              if (err) {
                return err;
              }
              else {
                LOG.logInfo(` New Image Saved Successfully- as ${newName}`);
              }
            });
            return serverResponse;
          }
          else {
            LOG.logError(`DB query failed.`);
            let errResponse = ERRHANDLER.APIerr(res);
            return errResponse;
          }
        }
      }
    }
    catch (err) {
      LOG.logError(`Error in creating-bank :${err.message}`)
      return err;
    }
  }

  // create new bank without interest rate table
  else if (req.url === "/api/admin/save-bank-data" && req.method === "POST") {
    try {

      var defSts = "Inactive";
      var tableName = "Bank_Master";

      //To extract the data from the formdata , returns an object.
      var extract = await ExtractFormData(req, body);
      let bodyInfo = extract.objinfo;
      let parsedBody = VALIDATE.JsonParse(bodyInfo);
      if (!parsedBody) {
        LOG.logError(`Can't parse body into json format`);
        let errResponse = ERRHANDLER.APIerr(res);
        errResponse[0].write(JSON.stringify(errResponse[1]));
        return errResponse;
      }
      //Validation of the body to be inserted for creation 
      let result = await VALIDATE.ValidateBody(parsedBody);
      var typeofResult = typeof (result);
      if (!typeofResult && typeofResult !== 'object') {
        LOG.logError('Body Validation failed');
        let errResponse = ERRHANDLER.VALIDATIONerr(res);
        return errResponse;
      }
      else {
        //Validation of the logo file to be inserted
        imgData = extract.newlogo;
        let results = await VALIDATE.CheckHeader(imgData);
        if (results) {
          //Generating the newname for the file.
          var randomValue = (Math.floor(Math.random() * (MAX - MIN + 1)) + MIN).toString();
          //Query for getting the last ID from the BAnk MAster table for newly inserted bank logo name
          var query = `SELECT Bank_ID FROM ${tableName} ORDER BY Bank_ID DESC LIMIT 1;`;

          let bankData = await Connection(query);
          let id = bankData[0].Bank_ID + 1;
          //concat logo name with the filepath
          var newName = (JSON.stringify(id)).concat("_", randomValue);
          newName += `.${extract.extension}`;

          //Giving file the desired path.
          let newPath = ENV.LOGOPATH;
          newPath += newName;

          //Formating of address field as reuiredf in the query
          if (result.address !== null) {
            result.address = "'" + result.address + "'";
          }
          //Decoding the base64 buffer.
          var base64dataDecoded = Buffer.from(imgData, "base64");

          //Inserting the bank in the database query
          let SqlQuery = `INSERT INTO Bank_Master (Bank_ID,Bank_Name,Nick_Name,Bank_Type,Pri_URL,Alter_URL,Rating1,Rating2,Rating3,Rating4,Address,Status,Compounding_Period,Image_URL,Interest_info) VALUES ("${id}","${result.name}","${result.nickname}","${result.type}","${result.pri}","${result.alter}",${result.rating1},${result.rating2},${result.rating3},${result.rating4},${result.address},"${defSts}","${result.compounding}","${newPath}","[]");`
          let serverResponse = await SAR.ApiWrapper(req, res, SqlQuery);
          let serverData = serverResponse[1].Data;

          //checking the db query successfully completed or not 
          if (serverData.affectedRows === 1) {

            //Writing the file buffer to the destined location
            FS.writeFile(newPath, base64dataDecoded, async (err) => {
              if (err) {
                return err;
              }
              else {
                LOG.logInfo(` New bank created along with Image Saved Successfully- as ${newName}`);
              }
            });
            return serverResponse;
          }
          else {
            LOG.logError(`DB query failed.`);
            let errResponse = ERRHANDLER.APIerr(res);
            return errResponse;
          }
        }
        else {
          LOG.logError(`Image is not of proper format.`)
          let errResponse = ERRHANDLER.VALIDATIONerr(res);
          return errResponse;
        }
      }
    }
    catch (err) {
      LOG.logError(`Error in saving bank:${err.message}`);
      return err;
    }
  }

  // Updates bank details, like bank name,Nick name, urls etc..
  else if (req.url === "/api/admin/update-bank-data" && req.method === "POST") {
    try {
      //listening to data sent by client while requesting POST API
      let parsedBody = VALIDATE.JsonParse(body);
      if (!parsedBody) {
        LOG.logError(`Can't parse body into json format`);
        let errResponse = ERRHANDLER.APIerr(res);
        errResponse[0].write(JSON.stringify(errResponse[1]));
        errResponse[0].end();
      }
      //Validating the body 
      let result = await VALIDATE.ValidateBody(parsedBody);
      var typeofResult = typeof (result);
      if (!result) {
        LOG.logError(`Body Validation failed.`)
        let errResponse = ERRHANDLER.VALIDATIONerr(res);
        return errResponse;
      }
      else if (typeofResult == "object") {
        if (result.address !== null) {
          result.address = "'" + result.address + "'";
        }
        //Query for updating bank details with the validated body.
        let SqlQuery = `UPDATE Bank_Master set Bank_Name="${result.name}", Bank_Type="${result.type}", Status="${result.status}" ,Rating1=${result.rating1},Rating2=${result.rating2},Rating3=${result.rating3},Rating4=${result.rating4},Nick_Name="${result.nickname}", Address=${result.address} ,Pri_URL='${result.pri}',Alter_URL='${result.alter}',Compounding_Period='${result.compounding}',Image_URL='${result.imageurl}' WHERE Bank_ID=${result.id};`
        //passing control to API Wrapp
        let serverResponse = await SAR.ApiWrapper(req, res, sqlQuery);
        let serverData = serverResponse[1].Data;
        if (serverData.affectedRows === 1) {
          return serverResponse;
        }
        else {
          LOG.logError(`DB query failed.`);
          let errResponse = ERRHANDLER.APIerr(res);
          return errResponse;
        }
      }
    }
    catch (err) {
      LOG.logError(`Error in updating bank-data :${err.message}`)
      return err;
    }
  }

  // for upload bank-logo
  else if (req.url === "/api/admin/update-bank-logo" && req.method === "POST") {
    try {

      //To extract the data from the formdata, return an object
      var extract = await ExtractFormData(req, body);

      /*   There is some info initially in buffer,(the buffer is after a comma) then
      Extract the base64 encoded buffer by splitting it by first  comma(,)        */
      imgData = (extract.logo).split(',')[1];
      let results = await VALIDATE.CheckHeader(imgData);
      if (results) {
        //Generating the newname for the file.
        var randomValue = (Math.floor(Math.random() * (MAX - MIN + 1)) + MIN).toString();
        var newName = (extract.id).concat("_", randomValue);
        newName += `.${extract.extension}`;
        //Giving file the desired path.
        let newPath = ENV.LOGOPATH;
        newPath += newName;
        //Decoding the base64 buffer.
        var base64dataDecoded = Buffer.from(imgData, "base64");
        //updating the database with the image url
        let SqlQuery = `UPDATE Bank_Master SET Image_URL = '${newPath}' WHERE Bank_ID = ${extract.id}`;
        let serverResponse = await SAR.ApiWrapper(req, res, SqlQuery);

        let serverData = serverResponse[1].Data;
        if (serverData.affectedRows === 1) {
          //Writing the file buffer to the destined location
          FS.writeFile(newPath, base64dataDecoded, async (err) => {
            if (err) {
              return err;
            }
            else {
              LOG.logInfo(` New Image Saved Successfully- as ${newName}`);
            }
          });
          return serverResponse;
        }
        else {
          LOG.logError(`DB query failed.`);
          let errResponse = ERRHANDLER.APIerr(res);
          return errResponse;
        }
      }
      else {
        LOG.logError(`Image is not of proper format.`)
        let errResponse = ERRHANDLER.VALIDATIONerr(res);
        return errResponse;
      }
    }
    catch (err) {
      LOG.logError(`Error in updating Bank-Logo: ${err.message}`);
      return err;
    }
  }

  /**
 *Queries the Bank_Master table in the database for deleting bank.
 *@param {body} userEmail - The whole body which contains the id of the bank to be deleted.
 *@returns {Promise} A  server response with a success string.
 *@throws {Error} Throws an error if there is an issue with the database connection or if the query fails.
 **/
  else if (req.url === "/api/admin/delete-bank" && req.method === "POST") {
    try {
      let parsedBody = VALIDATE.JsonParse(body);
      if (!parsedBody) {
        LOG.logError(`Can't parse body into json format`);
        let errResponse = ERRHANDLER.APIerr(res);
        return errResponse;
      }
      let Bank_id = parsedBody.id;
      var query = `SELECT Bank_Name,Image_URL FROM Bank_Master WHERE Bank_ID=${Bank_id}`;
      let queryResponse = await Connection(query);
      let name = queryResponse[0].Bank_Name;
      let logoURL = queryResponse[0].Image_URL;

      if (name && name !== undefined && !isNaN(Bank_id) && typeof (name) == "string") {
        let SqlQuery = `DELETE FROM Bank_Master where Bank_ID=${Bank_id}`;
        let serverResponse = await SAR.ApiWrapper(req, res, SqlQuery);
        let serverData = serverResponse[1].Data;

        //checking the db query successfully completed or not 
        if (serverData.affectedRows === 1) {
          //Deleting the logo file from the directory.
          FS.unlinkSync(logoURL);
          LOG.logInfo("Bank deleted along with its image successfully.")
          return serverResponse;
        }
        else {
          LOG.logError(`DB query of deletion failed. Recheck the Query.`)
          let errResponse = ERRHANDLER.APIerr(res);
          return errResponse;
        }
      }
      else {
        LOG.logError(`The bank to be deleted does not exist in the DB.`);
        let errResponse = ERRHANDLER.APIerr(res);
        return errResponse;
      }
    }
    catch (err) {
      LOG.logError(`Error in deleting bank:${err.message}`)
      return err;
    }
  }

  // for adding user email to the admin table in order to authorize for admin page usage.
  else if (req.url === "/api/admin/add-user" && req.method === "POST") {
    try {
      let parsedBody = VALIDATE.JsonParse(body);
      if (!parsedBody) {
        LOG.logError(`Can't parse body into json format`);
        let errResponse = ERRHANDLER.APIerr(res);
        return errResponse;
      }
      let email = parsedBody.email;
      let emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{1,4}$/;
      var validEmail = emailRegex.test(email);
      if (validEmail && typeof (email) == "string" && email !== undefined && email !== null && email) {
        var query = `SELECT User_ID from admin_table where Email = "${email}"`;
        let queryResponse = await Connection(query);
        let userIdExistLen = queryResponse.length;

        if (userIdExistLen === 0) {
          var SqlQuery = `INSERT INTO admin_table(Email) VALUES ("${email}")`;
          var serverResponse = await SAR.ApiWrapper(req, res, SqlQuery);
          let serverData = serverResponse[1].Data;
          if (serverData.affectedRows === 1) {
            return serverResponse;
          }
          else {
            LOG.logError(`DB Query failed for insertion of email to admin table;`)
            let errResponse = ERRHANDLER.APIerr(res);
            return errResponse;
          }
        }
        else {
          LOG.logError(`User email Already exists.`)
          let errResponse = ERRHANDLER.APIerr(res);
          return errResponse;
        }
      }
      else {
        LOG.logError(`Email Validation failed.`);
        let errResponse = ERRHANDLER.APIerr(res);
        return errResponse;
      }
    }
    catch (err) {
      LOG.logError(`Error in adding user email to Admin:${err.message}`)
      return err;
    }
  }
  else if(req.url === "/api/admin/run-script" && req.method == "POST"){
    try{
      let parsedBody = VALIDATE.JsonParse(body);
      const data = await SCRAPRUNSCRIPT.get_bankinfos(parsedBody.Bank_ID, parsedBody.Logic_Code, parsedBody.Return_Type, parsedBody.Bank_Name, parsedBody.Pri_URL, parsedBody.Keywords);
      res.setHeader("Content-Type", "application/json");
      //set the response 
      let RESPONSE_PAYLOAD = {
        Status: 200,
        Message: 'Ok',
        Data: data,
      }
      return [res, RESPONSE_PAYLOAD];
    }
    catch(err){
      return ERRHANDLER.NOTFOUNDerr(res);
    }
  } 
};

module.exports = { GetApi };

