//importing required modules and packages
const cheerio = require('cheerio');
const axios = require('axios');
var _ = require('underscore');
var https = require('https');

//For Dealing with PDFs:
const puppeteer = require('puppeteer');
const fs = require('fs');

//use in eval code for pdfs
const pdfparse = require('pdf-parse');
const eol = require("eol")

//Import parser file; used in eval code
const pars = require('./parser');
const config = require('/v1_config/admin_env_config');
const conn_config = config.DB_CONFIG;

//Debug variables
var debug = 1, warnings = 1, info = 1;

//Object for saving precise input
var failed = {}, success_updated = [], already_updated = [], updatesFlagged = [];

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

//Deals with collecting pdf links on webpage
var pdf, pdffile;
async function collectPdfs(url, id, Keywords) {
  console.log("id is ", id);
  return new Promise(async (resolve, reject) => {
    /*This function first collects all the links on page and finds required PDFs using keyword.*/
    if (id == 109) {
      //Special case of Shinhan Bank(109)
      try {
        const browser = await puppeteer.launch({ headless: false });
        try {
          const page = await browser.newPage();
          await page.goto(url);
          await page.click('a#wq_uuid_444');
          const pageTarget = page.target();
          const new_target = await browser.waitForTarget(target => target.opener() === pageTarget);
          const new_page = await new_target.page();
          pdf = new_page.url();
        } catch {
          reject("error launching headfull. Refer "+err);
        } finally {
          await browser.close();
        }
      } catch (err) {
        reject("Error launching headfull. Refer", err);
      }
    } else {
      const browser = await puppeteer.launch();
      try {
        const page = await browser.newPage();
        if (url.includes('.pdf')) { reject({ err: 'Update Scrap_FD with **Bank WebSite URL** (NOT .pdf URL)' }); }
        else {
          await page.goto(url);
          //this gives back an actual array, not a node list
          const linkCollection = await page.$$eval("a", (links) => {
            return links.map((link) => {
              return link.href;
            })
          })
          for (const link of linkCollection) {
            if (link.includes(Keywords)) {
              console.log("keywords", Keywords);
              var pdf = link;
              break;
            }
          }
        }
      } catch (err) {
        if (String(err).includes('TimeoutError')) { var errmsg = 'Navigation timeout of 30000 ms exceeded'; }
        else { var errmsg = 'Other Error. Refer logs'; }
        failed[id] = errmsg;
        reject('Error collecting pdf');
      } finally {
        await browser.close();
      }
    }
    if (pdf != undefined) {
      resolve(pdf);
    }
    else {
      failed[id] = 'PDF undefined. Keyword expired';
      reject('PDF undefined. Keyword expired')
    }
  })
}

//main function to get tags and html code from given keyword
function handleHTML(html, Logic_Code, Keywords) {
  // new object for maximum value of interest and duration for both general and senior
  maxObj = { maxGenIr: 0.0, maxSrIr: 0.0, maxGenDur: '', maxSrDur: '' }
  var scrapedData = [];
  var maxGenIr = 0.0, maxSrIr = 0.0, maxGenDur = '', maxSrDur = '';
  //loading html file by cheerio 
  let selTool = cheerio.load(html);
  let result = (selTool.html()).indexOf(Keywords);
  if (result == -1) {
    return 'Keyword not found';
  }
  htmlnew = (selTool.html()).slice(result);
  selTool = cheerio.load(htmlnew);
  eval(Logic_Code);
  maxObj.maxGenIr = maxGenIr;
  maxObj.maxSrIr = maxSrIr;
  maxObj.maxGenDur = maxGenDur;
  maxObj.maxSrDur = maxSrDur;

  return [maxObj, scrapedData];
}

//Function for dealing HTML Return_Type
async function get_url(id, name, Logic_Code, Pri_URL, Keywords) {
  
  var scrapedData, maxObj;
  let specialCase = false;
  var result_arr = [];
  var htmldata;
  bankid = id;
  if (Logic_Code != '') {
    try {
      if (id == 6 || id == 105 || id == 109 || id == 72) {
        specialCase = true;
        throw Error('Special Case; Launching Puppeteer')
      }
      else if (id == 8 || id == 62 || id == 67 || id == 73) { //PT May Bank; Superspecial case; SSL Certificate exp; require NO {timeout} flag
        resp = await axios.get(Pri_URL, { httpsAgent, headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/81.0' } });  //async function by default
        htmldata = resp.data;
        result_arr = ['axios', htmldata];
      }
      //Proceed Normally; fetching html via axios
      resp = await axios.get(Pri_URL, { timeout: 10000 }, { httpsAgent, headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/81.0' } });  //async function by default
      htmldata = resp.data;
      result_arr = ['axios', htmldata];
    }
    catch (err) {
      const browser = await puppeteer.launch().catch((err) => {if(debug) console.log(err)})
      var pageData;
      try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/81.0');
        await page.goto(Pri_URL, { httpsAgent });
        if (id == 105) { await page.waitForSelector('body > app-root > app-depositeintrate > div.saving-account-content > div > div:nth-child(2) > div > div > table > tbody > tr:nth-child(1) > td:nth-child(2)') }
        pageData = await page.evaluate(() => {
          return {
            html: document.documentElement.innerHTML,
          };
        })
      } 
      catch (err) {

        if (String(err).includes('TimeoutError')) var errmsg = 'Navigation timeout of 30000 ms exceeded';
        else { errmsg = 'Other Error. Refer logs' }

        failed[name] = errmsg;
      } 
      finally {
        await browser.close();
        return ['puppeteer', pageData];
      }
    } // catch closes here
  } 
  else {
    return ['empty Logic Code',];
  }
  let flag = result_arr[0];
  htmldata = result_arr[1];

  if (htmldata != undefined) {
    if (flag == 'axios') {
      handledData = handleHTML(htmldata, Logic_Code, Keywords);
      if (handledData == 'Keyword not found') {
        failed[name] = handledData + ' or incorrect html';
        return [];
      } else {
        scrapedData = handledData[1]
        maxObj = handledData[0]
        return [scrapedData, maxObj];
      }
    }
    else if (flag == 'puppeteer') {
      handledData = handleHTML(htmldata.html, Logic_Code, Keywords);
      if (handledData == 'Keyword not found') {
        failed[name] = handledData + ' or incorrect html';
        return [];
      }
      else {
        scrapedData = handledData[1]
        maxObj = handledData[0]
        return [scrapedData, maxObj];
      }
    }
  } 
  else {
    return [];
  }

}

//Function for dealing PDF Return_Type
async function get_pdf_url(Bank_ID, Bank_Name, Logic_Code, Pri_URL, Keywords) {
  id = Bank_ID;
  var pdflink;

  //Fetching URL
  url = Pri_URL;
  //If URL is not good, returing
  if (Pri_URL != undefined) {
    //collecting required PDF link from page
    await collectPdfs(Pri_URL, Bank_ID, Keywords)
      .then(async (pdf) => {
        console.log("ksnfkds", Keywords);
        //getting pdf link in pdf. If pdf link exists,
        //Downloading PDF->...
        pdflink = pdf;
        let file = fs.createWriteStream('/home/harshit/Desktop/projects/FixFD_Backend/Backend/pdfs/' + Bank_Name + '.pdf')
        const response = await axios({
          url: pdf, method: 'GET', responseType: 'stream'
        })
        response.data.pipe(file)
        return new Promise((resolve, reject) => {
          file.on('finish', resolve);
          file.on('error', reject);
        })
      })
      .catch((err) => {
        console.log(err);
      })


    //is pdflink is undefined, pdf is not downloaded thereby skipping calling extractingPDF()
    if (pdflink != undefined) {
      const extractedData = await extractingPDF(Bank_ID, Bank_Name, Logic_Code).catch((err) => {
        failed[name] = err;
      });
      if (extractedData == []) {
        return [];
      } else {
        let scrapedData = extractedData[1];
        let maxObj = extractedData[0];
        return [scrapedData, maxObj];
      }
    }
  }
}

//Extension of get_pdf_url. Extracts data from PDF. Eval Code is called here ↓
function extractingPDF(Bank_ID, Bank_Name, Logic_Code) {
  return new Promise((resolve, reject) => {
    // console.log(Bank_ID, Bank_Name, Logic_Code);
    pdffile = fs.readFileSync(`/home/harshit/Desktop/projects/FixFD_Backend/Backend/pdfs/${Bank_Name}.pdf`)

    if (Logic_Code == 'undefined' || Logic_Code == ' ') {
      reject({ err: `Update Code in DB for ${Bank_ID}` });
    }
    else {
      maxObj = { maxGenIr: 0.0, maxSrIr: 0.0, maxGenDur: '', maxSrDur: '' };
      var maxGenIr = 0.0, maxSrIr = 0.0, maxGenDur = '', maxSrDur = '';
      console.log("Lakshmi sir");
      eval(Logic_Code)
      maxObj.maxGenIr = maxGenIr;
      maxObj.maxSrIr = maxSrIr;
      maxObj.maxGenDur = maxGenDur;
      maxObj.maxSrDur = maxSrDur;
      
      resolve([maxObj, linearr]);
    }
  })
}

//Main Function to get Bank Info from DB and calling appropriate chains ↓
async function get_bankinfos(Bank_ID, Logic_Code, Return_Type, Bank_Name, Pri_URL, Keywords) {
  if (Return_Type == 'HTML') {
    const htmlFuncReturn  = await get_url(Bank_ID, Bank_Name, Logic_Code, Pri_URL, Keywords);
    // resolve(htmlFuncReturn);
    return htmlFuncReturn;
  }
  if (Return_Type == 'PDF') {
    const data = await get_pdf_url(Bank_ID, Bank_Name, Logic_Code, Pri_URL, Keywords);
    // resolve(data);
    return data;
  }
}

module.exports = {get_bankinfos};