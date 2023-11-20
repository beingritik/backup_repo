/**
 * This function will return interest info object with apy rates
 * @param {object} scrapedData scraped interest reates data in json format 
 * @param {string} comp_period Comonding period of particular bank
 * @returns returns object of interest rates with apy rates
 */
function CalAPY(scrapedData, comp_period) {
    var cp, cpdays, dur = 0;
    if (comp_period == 'Yearly') { cp = 12, cpdays = 365 }
    else if (comp_period == 'Half-Yearly') { cp = 6, cpdays = 180. }
    else if (comp_period == 'Monthly') { cp = 1, cpdays = 30 }
    else { cp = 3, cpdays = 90; } //quarterly by default;
    for (const obj of scrapedData) {
        obj.Duration = obj.Duration.replaceAll("\n", "");

        //getting duration
        obj.To_days != 'NA' ? dur = obj.To_days : dur = obj.From_days;

        //considering compounding only for durations 6 months and above
        if (dur >= 180) {

            //if eligible for compounding, check if dur is more than cp. If yes, calculate APY; else APY = APR.
            if (dur > cpdays) {

                //durPrime; same for both.
                durPrime = ((dur / 365) * 12) / cp; //converting dur into years(dur/365) then into months then into cp.

                //Gen Citizens
                rPrime = (parseFloat(obj.Interest) / 12) * cp;
                apy = Math.pow((1 + (rPrime / 100)), durPrime);
                APYRate = ((apy - 1) * 100) / (dur / 365);
                APYRate = parseFloat(APYRate.toFixed(2));

                //Sr Citizens
                rSrPrime = (parseFloat(obj.SrInterest) / 12) * cp;
                apySr = Math.pow((1 + (rSrPrime / 100)), durPrime);
                SrAPYRate = ((apySr - 1) * 100) / (dur / 365);
                SrAPYRate = parseFloat(SrAPYRate.toFixed(2));

                //updating into scrapedData
                obj.APYRate = APYRate;
                obj.SrAPYRate = SrAPYRate;
            }
            else {
                obj.APYRate = parseFloat(obj.Interest);
                obj.SrAPYRate = parseFloat(obj.SrInterest);
            }
        }
        else {
            obj.APYRate = parseFloat(obj.Interest);
            obj.SrAPYRate = parseFloat(obj.SrInterest);
        }
    }
    return scrapedData;
}

/*
  This script updates BankAPY table with calculated APY, start day, and end day.
*/
var info = 1;
//Import Writelogs
const writelogs = require('./logger');

function updateDB(db_con, bankid, From_days, To_days, APY, SrAPY) {
    return new Promise((resolve, reject) => {
        db_con.query(`INSERT INTO Bank_APY (Bank_ID,From_Days,To_Days,APR,SrAPR) VALUES (${bankid},${From_days},${To_days},${APY},${SrAPY});`, function (err, result) { //appropriate querry
            if (err) {
                if (info) writelogs('\u001b[' + 31 + 'm' + 'Error Inserting into BankAPY. Refer' + err.code + err.sql + err.sqlMessage + '\u001b[0m');
                reject(bankid);
            } else {
                resolve('records updated successfully at Bank_APY');
            }
        });
    })
}

function deleterecord(db_con, bankid) {
    return new Promise((resolve, reject) => {
        db_con.query(`DELETE FROM Bank_APY WHERE Bank_ID = ${bankid};`, function (err, result) { //appropriate querry
            if (err) {
                if (info) writelogs(`${err}`);
                reject(bankid);
            } else {
                resolve('records deleted successfully from Bank_APY');
            }
        });
    })
}

function update(db_con, bankid, scrapedData) {
    return new Promise((resolve, reject) => {
        // console.log(scrapedData, typeof(scrapedData));
        scrapedData.forEach(duration => {
            var From_days = duration.From_days;
            var To_days = duration.To_days;
            if (To_days == 'NA') To_days = From_days;
            var APR = parseFloat(duration.Interest);
            var SrApr = parseFloat(duration.SrInterest);

            updateDB(db_con, bankid, From_days, To_days, APR, SrApr).catch((bankid) => {
                reject(bankid);
            })
        });

        resolve('records updated successfully');
    })
}

module.exports = {
    CalAPY,
    deleterecord,
    update
}