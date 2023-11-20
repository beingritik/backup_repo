/**
 * This script finds Max IR for given duration range from all Banks and Updates same in DB.
 */

const LOG = require('./logger');
var debug = 1;

//array to display;
//logic: if suffix!='days' then actual_dur = from*365 +1 days; 1yr = 365 days && 1month = 30days;
display_col = [{ from: 0, to: 45, suffix: 'days' },
{ from: 46, to: 90, suffix: 'days' },
{ from: 91, to: 180, suffix: 'days' },
{ from: 6, to: 12, suffix: 'months' },
{ from: 1, to: 2, suffix: 'yrs' },
{ from: 2, to: 3, suffix: 'yrs' },
{ from: 3, to: 4, suffix: 'yrs' },
{ from: 4, to: 5, suffix: 'yrs' },
{ from: 5, to: 10, suffix: 'yrs' }]

//Functio to get all IRinfo from DB
async function fetch_infoarr(db_con) {
  return new Promise((resolve, reject) => {
    db_con.query("SELECT Bank_ID, Bank_Type, Bank_Name, Compounding_Period, Nick_Name ,Interest_info from Bank_Master where Status = 'Active';", function (err, result) { //appropriate querry
      if (err) {
        //change writelogs(err);
        LOG.logError('error came', err) ;
        reject();

      } else {
        // if (debug) writelogs("successfully bankinfo fetch querry fired!\n");
        if(debug) LOG.logInfo("successfully bankinfo fetch querry fired!\n")
        infoarr = result;
        resolve(infoarr);
      }
    });
  })
}

//Function to find all dur-IR objs for each bank within given range
function get_durs(i) {
  dur_obj = [];
  infoarr.forEach(element => {
    // if(element.bankname == 'Bank of Baroda'){
    tem_obj = { bankID: '', bank: '', IR: [], banktype: '', compounding_period: '' };
    tem_obj.bankID = element.Bank_ID;
    tem_obj.bank = element.Bank_Name // + '('+ element.Compounding_Period +')';
    tem_obj.banktype = element.Bank_Type
    tem_obj.compounding_period = element.Compounding_Period;
    tem_obj.nickname = element.Nick_Name;
    try {
      if (typeof (element.Interest_info) == 'string') {
        element.Interest_info = JSON.parse(element.Interest_info)
      }
    }
    catch (err) {
    }
    //converting into every dur. in days
    for (const obj of element.Interest_info) {
      if (display_col[i].suffix == 'months') {
        from = display_col[i].from * 30 + 1;
        to = display_col[i].to * 30 + 5;
      }
      else if (display_col[i].suffix == 'yrs') {
        from = display_col[i].from * 365 + 1;
        to = display_col[i].to * 365;
      }
      else {
        from = display_col[i].from;
        to = display_col[i].to;
      }
      /* *********************NOTE*************************** 
      Comparing all IRs for Our Defined Duration Range .i.e.
      if a bank provides (3% for 34-50 days), (3.5% for 51-80days), and (4% for 81-100days)
      then we're selecting all these 3 IRs for comparison since these duration lie in our range of 46-90 days
      Not just 3.5% for 51-80 days.
      ************************************************ */
      if (obj.To_days != 'NA') {
        if (obj.From_days <= to && obj.To_days >= from) {
          tem_obj.IR.push(obj);
        }
      } else { //special duration FD condition(only From_days; no To_days)
        if (obj.From_days <= to && obj.From_days >= from) {
          tem_obj.IR.push(obj);
        }
      }
    }
    dur_obj.push(tem_obj);
  })
  return dur_obj;
}

//Function to find the obj with 'Max IR' from dur_obj for each bank
function findIR(dur_obj) {
  //creating dict to store Bank Name as key and respective max IR-dur obj as value.
  var display_row_arr = {};
  dur_obj.forEach(bankinfo => {
    IRarr = [];
    req_IR = 0;
    for (const dur of bankinfo.IR) {
      if ('interest' in dur) IR = parseFloat(dur.interest);
      else IR = parseFloat(dur.Interest);
      IRarr.push(IR); //include for 'I'nterest\
      if (IR >= req_IR) {
        req_IR = IR;
        display_row_arr[[bankinfo.bankID, bankinfo.bank, bankinfo.banktype, bankinfo.compounding_period, bankinfo.nickname]] = dur;
      }
    }
  });
  return display_row_arr;
}

function calAPYfdtableDur(display_row_arr, i) {
  if (i > 1) { //APY Calculation needed.
    for (const [key, value] of Object.entries(display_row_arr)) {
      let comp_period = key.split(',')[2];
      if (comp_period == 'Yearly') { cp = 12 }
      else if (comp_period == 'Half-Yearly') { cp = 6 }
      else if (comp_period == 'Monthly') { cp = 1 }
      else { cp = 3; }  //quarterly by default;\
      let to;
      if (display_col[i].suffix == 'months') {
        to = display_col[i].to * 30 + 5;
      }
      else if (display_col[i].suffix == 'yrs') {
        to = display_col[i].to * 365;
      }
      else {
        to = display_col[i].to;
      }
      var dur = to / 365; //duration of investment in years.
      var comp_times = (to / 365) * 12 / cp;  //compounding happened during that dur.
      // var dur = calinfo[1] + calinfo[2]/12 + calinfo[3]/365; //duration of investment in years.
      var rPrime = (parseFloat(value.Interest) * cp) / 12; //rate for one compounding period.
      // var comp_times = calinfo[1]*12/cp + calinfo[2]/cp + (calinfo[3]/30)/cp; //compounding happened during that dur.
      var APY = Math.pow(1 + (rPrime / 100), comp_times); //APY on 1 rupee
      var APYRate = ((APY - 1) * 100) / dur; //Annualised Yeild
      value.APYRate = APYRate.toFixed(2);
      delete value.SrAPYRate;
    }
  }
  else {
    for (const [key, value] of Object.entries(display_row_arr)) {
      delete value.SrAPYRate;
    }
  }
  // console.log('final dict',display_row_arr);
  return display_row_arr;
}

//Function to compare and sort
async function sort_display_row(display_row_arr, id, db_con) {
  return new Promise((resolve, reject) => {
    // Step - 1
    // Create the array of key-value pairs
    var items = Object.keys(display_row_arr)
      .map((key) => { return [key, display_row_arr[key]] });
    // Step - 2
    // Sort the array based on the second element (i.e. the value)
    items.sort((first, second) => {
      return parseFloat(second[1].Interest) - parseFloat(first[1].Interest)
    });
    let tablename = { 1: 'Days0_45', 2: 'Days46_90', 3: 'Days91_180', 4: 'Months6_12', 5: 'Years1_2', 6: 'Years2_3', 7: 'Years3_4', 8: 'Years4_5', 9: 'Years5Plus' }
    db_con.query(`update fdtable set ${tablename[id]} = default where id > ${items.length};`, function (err, result) { //appropriate querry
      if (err) {
        // writelogs(err);
        LOG.logError(err);
        reject();
      } else {
        resolve("flag set");
      }
    });
    for (let i = 0; i < items.length; i++) {
      // console.log(items[i]);
      json_obj = { bankname: '', IRinfo: '' }
      json_obj.bankname = items[i][0];
      json_obj.IRinfo = items[i][1];
      json_obj = JSON.stringify(json_obj);
      let x = i + 1;

      let update_querry = `update fdtable set ${tablename[id]} = '${json_obj}' where id = ${x};`;

      db_con.query(update_querry, function (err, result) { //appropriate querry
        if (err) {
          // writelogs(err);
          LOG.logError(err);
          reject();
        } else {
          resolve("successfull inserted");
        }
      });
    }
  })
  // console.log("sorted dict is:");
}

//Main function to make all function calls
async function main(db_con) {
  return new Promise(async (resolve, reject) => {
    try {
      // if (debug) writelogs('fdtable main called');
      if(debug) LOG.logDebug("FD tanle main called")
      //1. first get all IRinfo from DB
      infoarr = await fetch_infoarr(db_con);
      //2. loop through each duration of display_col (like 0-45days, 46-90 days, etc.) and for each dur:
      let j = 0;
      for (const element of display_col) {
        if(debug) LOG.logDebug("During display_col FDtable " + j);
        //2.1. find all dur-IR objs for each bank
        dur_obj = await get_durs(j);

        //2.2. find the obj with 'Max IR' from dur_obj for each bank
        display_row_arr = await findIR(dur_obj);
        display_row_arr = await calAPYfdtableDur(display_row_arr, j);

        //2.3. Finally compare and sort each bank max IR to get Highest,2nd Highest ... so on IRs available for each range
        eventually = await sort_display_row(display_row_arr, j + 1, db_con);
        if(debug) LOG.logError(eventually)
        j += 1;
      }

      //database closing connection!
      db_con.end(function (err) {
        if (err) {
          reject("error:");
        } else {
          // writelogs('DB Con ended fdtable');
          LOG.logError("DB Con ended fdtable")
          console.log("this is fdtable");
          resolve()
        }
      });
    }
    catch(err) {
      reject(err);
      return err;
      // console.log("errr");
      // console.log("thifnsld")
    }
  })
}

// main();

module.exports = { main }