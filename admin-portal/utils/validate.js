//Required libraries
const DB = require('../db/connection_db');
const ACTIVESTS = "Active";
const INACTIVESTS = "Inactive";
const writelogs = require('./logger');
const addressLen = 150;

/* This file is for backend validation of bank details entered in the payload by the Ajax Request.
Here, Defined the function for validations */
const VALIDATE = {
    JsonParse
}

function IsEmpty(obj) {
    obj = JSON.stringify(obj);
    obj = obj.replace(/[{}]/g, '');
    console.log("obj=", obj);
    console.log("objlenght=", obj.length);
    return obj.trim().length == 0 ? true : false;
}

function JsonParse(body) {
    try {
        //Initial call, the body is empty hence to avoid error , we have to make a empty object.
        if (body.length == 0) {
            body = '{}';
        }
        jsonBody = JSON.parse(body);
    } catch (e) {
        //Error
        //JSON is not okay
        return false;
    }
    return jsonBody;
}

//Inbuilt function for validaton of the posted body.
function Validate(body) {
    try {
        //common variable declaration for final result
        var finalResult = true;
        //regex for all fields
        var urlRegex = /^https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/
        var nameRegex = /^[ A-Za-z0-9_.&-\-\,]*$/;
        var nicknameRegex = /^[ A-Za-z0-9_.&-\-\,]*$/

        //assigning values to variables
        var name = body.name;
        var type = body.type;
        var rating1 = body.rating1;
        var rating2 = body.rating2;
        var rating3 = body.rating3;
        var rating4 = body.rating4;
        var nickname = body.nickname;
        var address = body.address;
        var pri = body.pri;
        var alter = body.alter;
        var compounding = body.compounding;

        //declaring variables for matching regex;
        var isValidName = nameRegex.test(name);
        var isValidnickName = nicknameRegex.test(nickname);
        var isValidPriUrl = urlRegex.test(pri);
        var isValidAlterUrl = urlRegex.test(alter);

        //condition checking for different validators
        if (body) {
            if (name && type && nickname && pri && alter && compounding) {
                if ((rating1 < 0 || rating1 > 4) || (rating2 < 0 || rating2 > 4) || (rating3 < 0 || rating3 > 4) || (rating4 < 0 || rating4 > 4)) {
                    finalResult = false;
                    return finalResult;
                }
                else if (typeof (name) !== 'string' || typeof (type) !== 'string' || typeof (nickname) !== 'string' || typeof (compounding) !== 'string') {
                    finalResult = false;
                    return finalResult;
                }
                else if (typeof (pri) !== 'string' || typeof (alter) !== 'string') {
                    finalResult = false;
                    return finalResult;
                }
                else if (!isValidName || !isValidnickName || !isValidPriUrl || !isValidAlterUrl || nickname.length > 15) {
                    finalResult = false;
                    return finalResult;
                }
                else if (address && typeof (address) == 'string' && address.length > addressLen) {
                    finalResult = false;
                    return finalResult;
                }
                return finalResult;
            }
            else {
                finalResult = false;
                return finalResult;
            }
        }
        else {
            finalResult = false;
            return finalResult;
        }
    }
    catch (err) {
        return err;
    }
}

//Inbuilt function for checking the required detail and return the validated body with the use case called accordingly.
async function CheckCondition(body) {
    try {
        return new Promise((resolve, reject) => {
            if (body.id !== undefined) {
                /* (UPDATION Query through Bank_ID).
                Query for getting the details of bank to be updated. */
                var query = `SELECT Bank_Name,Interest_info,Status from Bank_Master where Bank_ID= "${body.id}"`
                DB.GetConnection(async function (err, con) {
                    if (err) {
                        writelogs(`err getting connection from pool: Refer:', ${err}`);
                        reject(err);
                    }
                    con.query(query, function (error, results) {
                        con.release();
                        if (error) throw error;
                        if (results.length < 0 || (((results[0].Bank_Name).trim()).length == 0) || results[0].Bank_Name == null) {
                            resolve(false);
                        }
                        //Declaration of variables of results from the query
                        var irate = results[0].Interest_info;
                        var objIR = (JSON.parse(irate));
                        var irLen = objIR.length;

                        if ((body.status == null)) {
                            body.status = INACTIVESTS;
                        }
                        if (((typeof (irate) == 'string') && irate.length == 0) || ((typeof (irate)) == undefined) || (irate == null) || irLen < 1) {
                            if (body.status == ACTIVESTS) {
                                body.status = INACTIVESTS;
                            }
                        }
                        resolve(body);
                    })
                })
            }
            else {
                /* (Saving Bank check Query through Bank_Name).
                Query for getting the details of bank to be created as a early check. */
                var query = `SELECT Bank_Name from Bank_Master where Bank_Name= "${body.name}"`;
                DB.GetConnection(async function (err, con) {
                    if (err) {
                        writelogs(`err getting connection from pool: Refer:', ${err}`);
                        reject(err);
                    }
                    con.query(query, function (error, results) {
                        con.release();
                        if (error) throw error;
                        //condition for saving bank
                        if (results.length > 0) {
                            var bankName = results[0].Bank_Name;
                            bankName = bankName.toLowerCase();
                            if (((body.name).toLowerCase()) == bankName) {
                                resolve(false);
                            }
                        }
                        resolve(body);
                    })
                })
            }
        })
    }
    catch (err) {
        return null;
    }
}

//Final calling common function which will return the validated result.
async function ValidateBody(body) {
    try {
        let finalResult;
        if (body) {
            //for checking the body which is passed.
            var detailIsValid = Validate(body);
            //for checking the pre-requisite condition 
            var checkResult = await CheckCondition(body);
            if (detailIsValid && checkResult) {
                finalResult = body;
            }
            else {
                finalResult = false;
            }
        }
        else {
            finalResult = false;
            return null;
        }
        return finalResult;
    }
    catch (err) {
        return err;
    }
}

//Function for checking the uploaded logo file.
function CheckHeader(imgBuffer) {
    return new Promise((resolve,reject)=>{
        try {
            let result;
            import('image-type')
                .then(async (module) => {
                    const imageType = module.default;
                    //Decoding the image buffer to base64;
                    let decodebase64 = Buffer.from(imgBuffer, 'base64');
                    // Converting the base64 buffer to binary form.
                    const binaryData = Buffer.from(decodebase64, 'binary');
                    // Get the image type
                    const type = await imageType(binaryData);
                    //stringifies the image type response 
                    let mimetype = JSON.stringify(type.mime)
                    const IMGMATCH = "image";
                    let slicedType = JSON.stringify(mimetype.substring(1, 6));
                    //final checking of image validity.
                    if (slicedType = IMGMATCH) {
                        result = true;
                        resolve(result);
                    }
                    else {
                        result = false;
                        resolve(result);
                    }
                }).catch((error) => {
                    console.log("Error:", error.message)
                    reject(error);
                });
        }
        catch (err) {
            console.log("end error=", err.message)
           reject(err);
        }
    })
    
}

// validations for scrapfd pages
function ScrapFdValidation(body){
    var logicCode = body.Logic_Code;
    var keywords = body.Keywords;
    var returnType = body.Return_Type;
    // keyword exists or not in the form 
    if(keywords.length > 0 && keywords.length > 1000){
        return false;
    }
    // checks if return type exist then logic code should also be in the input field and vice versa using xor operator
    if((returnType.length > 1) ^ (logicCode.length > 1)){
       return false;
    }
    if(returnType.length > 0 && logicCode.length > 0){
        if(logicCode.length > 0 && logicCode!==" " && logicCode.includes('"')){
            return false;
        }
        if(returnType.length > 0 && !(returnType === "HTML" || returnType ==="IMAGE" || returnType === "PDF" || returnType==="PDF-IMAGE")){
            return false;
        }
    }
    return true;
}


/* This Function will check Incoming Interest_Info and Max Ir Info can check format of it*/
function InterestRateValidation(body, Interest_info, MaxIR) {
    /* 
    this "if" will compare that the interest rate table has any changes or not
    */
    for (var i = 0; i < Interest_info.length; i++) {
        var interest = Interest_info[i].Interest;
        var srInterest = Interest_info[i].SrInterest;
        var fromDays = Interest_info[i].From_days;
        var toDays = Interest_info[i].To_days;
        if (interest > srInterest) {
            return false;
        }
        if (!interest || !srInterest || !fromDays || !toDays) {
            return false;
        }
        if (typeof (interest) !== 'number' || typeof (srInterest) !== 'number') {
            return false;
        }
        if (interest < 0 || srInterest < 0 || interest > 15 || srInterest > 15) {
            return false;
        }
        if (fromDays < 0 || toDays > 3650) {
            return false;
        }
    }
    return true;
}


module.exports = {
    JsonParse,
    IsEmpty,
    ValidateBody,
    CheckHeader,
    ScrapFdValidation,
    InterestRateValidation
}
