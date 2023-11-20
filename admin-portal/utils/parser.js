module.exports = {
  //function to convert years/months/weeks into days
  convertToDays: (periodString) => {
    //regex pattern to get the integers(string) just before the keywords "y"
    fdPeriodRegexYear = /(\d+)(?=(\s*(y+)))/gim;

    // regex for durations like 1.5 year
    fdPeriodRegexYear_decimal=/(\d+(?:\.\d+)?)(?=(\s*(y+)))/gim;

    //regex pattern to get the integers(string) just before the keywords "m"
    fdPeriodRegexMonth = /(\d+)(?=(\s*(m+)))/gim;

    //regex pattern to get the integers(string) just before the keywords "w"
    fdPeriodRegexWeek = /(\d+)(?=(\s*(w+)))/gim;

    removeBracketTextRegex = / *\([^)]*\) */gim;

    //remove all special characters except <, >, =
    removeSpecialCharactersRegex = /[^\w\s<>=&-.]/gim;

    //match keywords less than and < only when not followed by =
    strictLessthanRegex = /(\s*below\s*)|(\s*less\s*than\s*)|(\s*<\s*)(?!\s*=\s*)/gim;

    //match keywords above and > only when not followed by =
    strictAboveRegex = /(\s*over\s*)|(\s*more\s*than\s*)|(?<!\s*(&|and)\s*)(\s*above\s*)|(\s*>\s*)(?!\s*=\s*)/gim;

    //regex patterns to match duration in alphabets
    charToNumRegexList = [
      /\s*one\s*/gim,
      /\s*two\s*/gim,
      /\s*three\s*/gim,
      /\s*four\s*/gim,
      /\s*five\s*/gim,
      /\s*six\s*/gim,
      /\s*seven\s*/gim,
      /\s*eight\s*/gim,
      /\s*nine\s*/gim,
      /\s*zero\s*/gim,
    ];

    numList=[1,2,3,4,5,6,7,8,9,0]

    //regex pattern to match any years months weeks or days
    ymwdRegex = /(\d+)(?=(\s*(y+))|(\s*(m+))|(\s*(w+))|(\s*(d+)))/gim;
    //regex pattern to match only digits
    digitsRegex = /(\d+)/gim;
    // console.log(periodString);
    //  console.log("In Convert to days");

    //find and remove bracket and enclosed text
    periodString = periodString.replace(removeBracketTextRegex, "");

    //find and remove all special chars
    periodString = periodString.replace(removeSpecialCharactersRegex, "");
    // console.log(periodString);
    //  console.log("In Convert to days");

    //replacing duration words with nums
    for (const index in charToNumRegexList) {
      periodString=periodString.replace(charToNumRegexList[index],numList[index])
      
    }

    

    // if years with decimal is present use decimal year regex
    if(fdPeriodRegexYear_decimal.test(periodString)){
      fdPeriodRegexYear=fdPeriodRegexYear_decimal
    }

    //find and convert Years to Days then store it in an array
    periodString = periodString.replace(
      fdPeriodRegexYear,
      function func(match) {
        let monthsToDays=(parseFloat(match) - parseInt(match))*12*30
        yearsToDays = parseInt(match)* 365 + monthsToDays;
        return parseInt(yearsToDays);
      }
    );
    //find and convert Months to Days then store it in an array
    periodString = periodString.replace(
      fdPeriodRegexMonth,
      function func(match) {

        match=parseInt(match)
        
        //convert to days acc to years and months if months > 12
        if(match>=12){
          years=parseInt(match/12)
          months=match%12
          monthsToDays= years*365 + months*30
          // console.log(`${years} years ${months} months \n`);
        } 
        else monthsToDays = match * 30;

        return monthsToDays;
      }
    );
    //find and convert Weeks to Days then store it in an array
    periodString = periodString.replace(
      fdPeriodRegexWeek,
      function func(match) {
        weeksToDays = parseInt(match) * 7;
        return weeksToDays;
      }
    );
    return periodString;
  },

  //find and store start and end days from the final converted array
  scrapPeriod: (periodString) => {
    //if - is present use digit regex || y/m/d before to
    if (
      /\s*-\s*/.test(periodString) ||
      !/(y+|m+|d+)(?=[a-zA-Z0-9\s]*to\s*)/gim.test(periodString)
    )
      arr = periodString.match(digitsRegex);
    else arr = periodString.match(ymwdRegex);

    if (arr == null) return [0];
    Arr = []; // array to store matched array and period string
    Arr.push(arr);
    Arr.push(periodString);

    return Arr;
  },

  //function for converting multiple columns into two column format
  convertFromTo: (Arr) => {
    arr = Arr[0];
    periodString = Arr[1];

    let newArr = [];

    //convert string arr into integer array
    for (i = 0; i < arr.length; i++) {
      arr[i] = parseInt(arr[i]);
    }

    if (arr == null) arr.push("null");
    //if only 1  element , push them directly
    else if (arr.length == 1) {
      for (element of arr) newArr.push(element);
      if(periodString.match(/above/gi)) newArr.push(3650)
    } else if (arr.length == 2) {
      yearCount = periodString.match(/([^a-z-A-Z]\s*(y+))/gim) || [];
      monthCount = periodString.match(/([^a-z-A-Z]\s*(m+))/gim) || [];
      weekCount = periodString.match(/([^a-z-A-Z]\s*(w+))/gim) || [];
      dayCount = periodString.match(/([^a-z-A-Z]\s*(d+))/gim) || [];
      //if pattern like 1 year 1 day i.e 365 year 1 day
      if (arr[0] > arr[1]) {
        newArr.push(arr[0] + arr[1]);
      } else if (
        yearCount.length == 1 &&
        monthCount.length == 0 &&
        weekCount.length == 0 &&
        dayCount.length == 0
      ) {
        newArr.push(365 * arr[0]);
        newArr.push(arr[1]);
      } else if (
        yearCount.length == 0 &&
        monthCount.length == 1 &&
        weekCount.length == 0 &&
        dayCount.length == 0
      ) {
        newArr.push(30 * arr[0]);
        newArr.push(arr[1]);
      } else if (
        yearCount.length == 0 &&
        monthCount.length == 0 &&
        weekCount.length == 1 &&
        dayCount.length == 0
      ) {
        newArr.push(7 * arr[0]);
        newArr.push(arr[1]);
      } else {
        newArr.push(arr[0]);
        newArr.push(arr[1]);
      }
    }
    //if 4 elements are present add 1st two and next two elements and push them
    else if (arr.length == 4) {
      newArr.push(arr[0] + arr[1]);
      newArr.push(arr[2] + arr[3]);
    }
    //if 3 elements are present check if the middle element:
    else if (arr.length == 3) {
      //: is less than 1st element add 1st and middle, and push the sum and 3rd element
      if (arr[1] < arr[0]) {
        newArr.push(arr[0] + arr[1]);
        newArr.push(arr[2]);
      }
      //: is not less than 1st element add 3rd and middle, and push the 1st and sum
      else {
        newArr.push(arr[0]);
        newArr.push(arr[2] + arr[1]);
      }
    }

    //increment from days by 1 if above or > keyword  is found
    if (strictAboveRegex.test(periodString)) {
      newArr[0] = newArr[0] + 1;
    }
    //decrement to days by 1 if less than or < keyword is found
    if (strictLessthanRegex.test(periodString) && newArr.length == 2) {
      newArr[1] = newArr[1] - 1;
    }
    return newArr;
  },
};