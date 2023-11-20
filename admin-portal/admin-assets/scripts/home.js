//libraries used
const READER = new FileReader();

// const 
const MINLENIRTABLE = 1;   // Minimum length of Interest Rate Table
const LEAST_SIZE = 2;
const MAX_SIZE = 100;
const INVLDMSG = "Image is not of proper Image format.";
const INVLDSIZE = `Image size should be between ${LEAST_SIZE}kb and ${MAX_SIZE}kb.`;
const VLDMSG = "<span class='success'>Verified Successfully.</span>";

var _BANKNAME_ = ""; //bank name	from Seach bar
var _BANKDATA_;      // Bank Details and Ir Info of Bank using Bank_Name 
var _SCRAPFDDATA_    // it contains scrap fd data
var _MAXIR_;          // MaxIR global Variable 
var _NEWLOGO_;
var _TOTALBANKS_;  // holds the list of all the currently available banksS
var _IRTABLEVAL_ = document.getElementById("interest-table"); // Interest Table DOM value stores here
var _MAXIRTABLEVAL_ = document.getElementById("maxIrTable"); // Max IR table DOM Value stores here
var _INTERESTINFO_;  // Interest Info value as string will store here 
var ratingArray = ['1', '2', '3', '4'];
var statusArray = ['Active', 'Inactive', 'Suspended', 'Closed', 'Not Available'];
var compoundingArray = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'];
var typesArray = ['PSU', 'Private', 'SFB', 'Regional', 'Foreign', 'Payment'];


//run script variables starts with RS
var _RSIRVALS_;
var _RSMAXIRVALS_;


// operations to be performed when page is going to load
$(document).ready(function () {
  // fetch the banks list 
  fetch("/api/admin/get-bank-list", {
    method: "GET",
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      else {
        document.getElementById("error_msg").innerText = "Running Out of service try after sometime";
        $("#error_msg").show();
        $("#error_msg").delay(4000).fadeOut();
      }
    })
    .then((data) => {
      ListOfBank(data.Data); // Send response data to function ListOfBank to list all the banks
    })
  // parse from days, todays from duration string
  $(document).on('keyup', '#duration', function () {
    const periodString = $(this).val();
    // extracts from days and  to days array from the string
    fromToArray = convertFromTo(
      scrapPeriod(convertToDays(periodString))
    );
    // assign individual values
    [fromDays, toDays] = fromToArray
    $('#fromDays').val(fromDays)
    $('#toDays').val(toDays)
  })
  /* Inserts new row to the next current row */
  $(document).on("click", ".insert", function () {
    let index = $(this).closest('tr').index();
    let row = _IRTABLEVAL_.insertRow(index + 2); // Inserts next to current row
    let cell1 = row.insertCell(0); // duration cell
    let cell2 = row.insertCell(1); // general interest rate
    let cell3 = row.insertCell(2); // senior interest rate
    let cell4 = row.insertCell(3); // from days parsed from parser
    let cell5 = row.insertCell(4); // to days parsed form parser
    let cell6 = row.insertCell(5); // icons to edit, delete, add row
    // assigning html to each cell 
    cell1.innerHTML = '<td><input type="text" class="form-control" name="duration" id="duration"></td>';
    cell2.innerHTML = '<td><input type="text" class="form-control" name="interest" id="interest"></td>';
    cell3.innerHTML = '<td><input type="text" class="form-control" name="srInterest" id="srInterest"></td>';
    cell4.innerHTML = '<td><input type="text" class="form-control" name="fromDays" id="fromDays"></td>';
    cell5.innerHTML = '<td><input type="text" class="form-control" name="toDays" id="toDays"></td>';
    cell6.innerHTML = '<td>' + '<a class="add" title="Add" data-toggle="tooltip"><i class="material-icons"></i></a>' +
      '<a class="edit" title="Edit" data-toggle="tooltip"><i class="material-icons"></i></a>' +
      '<a class="insert" title="add_box"><i class="material-icons add-box">add_box</i></a>' +
      '<a class="delete" title="Delete" data-toggle="tooltip"><i class="material-icons"></i></a>' +
      '</td>';
    // toggle edit and add button 
    $(".irTable  tbody tr").eq(index + 1).find(".add, .edit").toggle();
    $('[data-toggle="tooltip"]').tooltip();
  });
  // Here we will add new row at bottom of all the rows
  $(document).on("click", ".add-new-row", function () {
    var table = document.getElementById("tbody");
    var row = table.insertRow(-1); // add the row at the bottom of table
    var cell1 = row.insertCell(0); // duration cell
    var cell2 = row.insertCell(1); // general interest rate
    var cell3 = row.insertCell(2); // senior interest rate
    var cell4 = row.insertCell(3); // from days parsed from parser
    var cell5 = row.insertCell(4); // to days parsed form parser
    var cell6 = row.insertCell(5); // icons to edit, delete, add row
    // assigning them to innerHTMLs
    cell1.innerHTML = '<td><input type="text" class="form-control" name="duration" id="duration"></td>';
    cell2.innerHTML = '<td><input type="text" class="interest form-control" name="interest" id="interest"></td>';
    cell3.innerHTML = '<td><input type="text" class="interest form-control" name="srInterest" id="srInterest"></td>';
    cell4.innerHTML = '<td><input type="text" class="form-control" name="fromDays" id="fromDays"></td>';
    cell5.innerHTML = '<td><input type="text" class="form-control" name="toDays" id="toDays"></td>';
    cell6.innerHTML = '<td>' +
      '<a class="add" title="Add" data-toggle="tooltip"><i class="material-icons"></i></a>' +
      '<a class="edit" title="Edit" data-toggle="tooltip"><i class="material-icons"></i></a>' +
      '<a class="insert" title="add_box"><i class="material-icons add-box">add_box</i></a>' +
      '<a class="delete" title="Delete" data-toggle="tooltip"><i class="material-icons"></i></a>' +
      '</td>';
    // toggle html and edit buttons
    $(".irTable  tbody tr").eq(-1).find(".add, .edit").toggle();
    $('[data-toggle="tooltip"]').tooltip();
  })
  // Add rows data to the data
  $(document).on("click", ".add", function () {
    var empty = false;
    var input = $(this).parents("tr").find('input[type="text"]');
    var irVal = $(".interest");
    //regex conditon for interest rate validation are number only
    irVal.each(function () {
      var regx = /[^0-9.]/
      if (regx.test($(this).val())) {
        $(this).addClass("error");
        alert("Interest rate can not include char or special char")
        empty = true;
      }
      else {
        $(this).removeClass('error')
      }
    })
    input.each(function () {
      if (!$(this).val()) {
        $(this).addClass("error");
        empty = true;
      } else {
        $(this).removeClass("error");
      }
    });
    $(this).parents("tr").find(".error").first().focus();
    if (!empty) {
      input.each(function () {
        $(this).parent("td").html($(this).val());
      });
      $(this).parents("tr").find(".add, .edit").toggle();
    }
    SavingData();
  });
  // Edit row -> to edit row in interest info table
  $(document).on("click", ".edit", function () {
    $(this).parents("tr").find("td:not(:last-child)").each(function (index) {
      /* we have to provide id to duration, fromdays and toDays cells  */
      // at 0th cell is  duration 
      if (index === 0) {
        $(this).html('<input type="text" class="form-control" name = "duration" id ="duration" value="' + $(this).text() + '">');
      }
      // at 3rd cell of row fromDays is id for particular cell
      else if (index === 3) {
        $(this).html('<input type="text" class="form-control" name = "fromDays" id ="fromDays" value="' + $(this).text() + '">');
      }
      // at 4th index of row toDays is id for particular cell
      else if (index === 4) {
        $(this).html('<input type="text" class="form-control" name = "toDays" id ="toDays" value="' + $(this).text() + '">');
      }
      // 2nd and 3rd cell are senior interest Info and general interest info so class interest given to them
      else {
        $(this).html('<input type="text" class="interest form-control" value="' + $(this).text() + '">');
      }
    });
    // toggle between edit and add
    $(this).parents("tr").find(".add, .edit").toggle();
  });
  // Delete row -> to delete particular row from table
  $(document).on("click", ".delete", function () {
    $(this).parents("tr").remove();
    SavingData();
  });

  $(document).on("click", ".bankDetailAdd", function () {
    var empty = false;
    var input = $(this).parents("tr").find('input[type="text"]');

    var inputBankStatus = $(this).parents("tr").find('input[name="radioBtn7"]');
    var inputBankCpd = $(this).parents("tr").find('input[name="radioBtn8"]');
    var inputBankTypes = $(this).parents("tr").find('input[name="radioBtn9"]');
    var inputRatingsOne = $(this).parents("tr").find('input[name="radioBtn10"]');
    var inputRatingsTwo = $(this).parents("tr").find('input[name="radioBtn11"]');
    var inputRatingsThree = $(this).parents("tr").find('input[name="radioBtn12"]');
    var inputRatingsFour = $(this).parents("tr").find('input[name="radioBtn13"]');

    input.each(function () {
      if (!$(this).val()) {
        $(this).addClass("error");
        empty = true;
      } else {
        $(this).removeClass("error");
      }
    });

    $(this).parents("tr").find(".error").first().focus();
    if (!empty) {
      input.each(function () {
        $(this).parent("td").html($(this).val());
      });

      inputBankStatus.each(function () {
        $(this).parent("td").html($("input[type='radio']:checked").val());
      });

      inputBankCpd.each(function () {
        $(this).parent("td").html($("input[type='radio']:checked").val());
      });

      inputBankTypes.each(function () {
        $(this).parent("td").html($("input[type='radio']:checked").val());
      });

      inputRatingsOne.each(function () {
        $(this).parent("td").html($("input[type='radio']:checked").val());
      });
      inputRatingsTwo.each(function () {
        $(this).parent("td").html($("input[type='radio']:checked").val());
      });
      inputRatingsThree.each(function () {
        $(this).parent("td").html($("input[type='radio']:checked").val());
      });
      inputRatingsFour.each(function () {
        $(this).parent("td").html($("input[type='radio']:checked").val());
      });

      $(this).parents("tr").find(".bankDetailAdd, .bankDetailEdit").toggle();

    }
  });
  // Edit row on edit bankdetails edit click
  $(document).on("click", ".bankDetailEdit", function () {
    $(this).parents("tr").find("td:not(:last-child)").each(function (index) {
      if (index > 0) {
        $(this).html('<input type="text" class="form-control" value="' + $(this).text() + '">');
      }
      var rowIndex = $(this).closest('tr').index();
      if (rowIndex == 7) {
        if (index > 0) {
          let tdVal = this.innerHTML;
          var value = $(tdVal).val();
          for (var i = 0; i < statusArray.length; i++) {
            var htmlind = "";
            for (var j = 0; j < statusArray.length; j++) {
              if (value == statusArray[j])
                htmlind += '<input type="radio" class = "inputradio" checked  name= "radioBtn' + rowIndex + '"  id= "myradio' + rowIndex + '" value="' + statusArray[j] + '">' + statusArray[j] + '<br>';
              else
                htmlind += '<input type="radio"  class = "inputradio" id= "myradio' + rowIndex + '" name= "radioBtn' + rowIndex + '" value="' + statusArray[j] + '">' + statusArray[j] + '<br>';

            }
            $(this).html(htmlind);
          }
        }
      }
      if (rowIndex == 8) {
        if (index > 0) {
          let tdVal = this.innerHTML;
          var value = $(tdVal).val();
          for (var i = 0; i < compoundingArray.length; i++) {
            var htmlind = "";
            for (var j = 0; j < compoundingArray.length; j++) {
              if (value == compoundingArray[j])
                htmlind += '<input type="radio" checked class = "inputradio"  name= "radioBtn' + rowIndex + '"  id= "myradio' + rowIndex + '" value="' + compoundingArray[j] + '">' + compoundingArray[j] + '<br>';
              else
                htmlind += '<input type="radio" class = "inputradio" id= "myradio' + rowIndex + '" name= "radioBtn' + rowIndex + '" value="' + compoundingArray[j] + '">' + compoundingArray[j] + '<br>';
            }
            $(this).html(htmlind);
          }
        }
      }
      if (rowIndex == 9) {
        if (index > 0) {
          let tdVal = this.innerHTML;
          var value = $(tdVal).val();
          for (var i = 0; i < typesArray.length; i++) {
            var htmlind = "";
            for (var j = 0; j < typesArray.length; j++) {
              if (value == typesArray[j])
                htmlind += '<input type="radio" class = "inputradio" checked  name= "radioBtn' + rowIndex + '"  id= "myradio' + rowIndex + '" value="' + typesArray[j] + '">' + typesArray[j] + '<br>';
              else
                htmlind += '<input type="radio" class = "inputradio" id= "myradio' + rowIndex + '" name= "radioBtn' + rowIndex + '" value="' + typesArray[j] + '">' + typesArray[j] + '<br>';
            }
            $(this).html(htmlind);
          }
        }
      }
      if (rowIndex > 9) {
        if (index > 0) {
          let tdVal = this.innerHTML;
          var value = $(tdVal).val();
          for (var i = 0; i < ratingArray.length; i++) {
            var htmlind = "";
            for (var j = 1; j <= ratingArray.length; j++) {
              // $(this).html('<input type="radio" checked value="' + value+ '">' +value);
              if (value == j)
                htmlind += '<input type="radio" checked class = "inputradio"  name= "radioBtn' + rowIndex + '"  id= "myradio' + rowIndex + '" value="' + ratingArray[j - 1] + '">' + ratingArray[j - 1] + '<br>';
              else
                htmlind += '<input type="radio"  class = "inputradio" id= "myradio' + rowIndex + '" name= "radioBtn' + rowIndex + '" value="' + ratingArray[j - 1] + '">' + ratingArray[j - 1] + '<br>';
            }
            $(this).html(htmlind);
          }
        }
      }
    });
    $(this).parents("tr").find(".bankDetailAdd, .bankDetailEdit").toggle();
  });
  // and after click post button of ir table :
  // checks that interest info table is blank or not if blank then we need to change the status of bank from active to diffrent status
  $("#irPostBtn").click(function () {
    if (_IRTABLEVAL_.rows.length <= MINLENIRTABLE) {
      document.getElementById("irTableStatus").style.visibility = "visible";
    }
    else {
      document.getElementById("irTableStatus").style.visibility = "hidden";
    }
  })
});

/* Banks List objects with Nick_Name, Bank_ID, Bank_Name */
function ListOfBank(banksList) {

  // banksListWithNickName will create a list of banks with nick name as string
  var banksListWithNickName = '['
  for (var cnt = 0; cnt < banksList.length; cnt++) {
    if (cnt !== banksList.length - 1) {
      banksListWithNickName += `{"Nick_Name":"${banksList[cnt].Nick_Name}", "Bank_Name":"${banksList[cnt].Bank_Name}", "Bank_ID":${banksList[cnt].Bank_ID}},`
    }
    else {
      banksListWithNickName += `{"Nick_Name":"${banksList[cnt].Nick_Name}", "Bank_Name":"${banksList[cnt].Bank_Name}", "Bank_ID":${banksList[cnt].Bank_ID}}`
    }
  }
  banksListWithNickName += ']';

  // parse the banksListWithNickName string to object
  _TOTALBANKS_ = JSON.parse(banksListWithNickName);

  // function to display list of banks
  AutoComplete(document.getElementById("bank-search-bar"), _TOTALBANKS_);
}
/* List of banks in search bar */
function AutoComplete(inp, arr) {
  /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function (e) {
    var a,
      b,
      el,
      val = this.value;
    /*close any already open lists of autocompleted values*/
    closeAllLists();

    // $(".bank-not-found").hide();
    if (!val) {

      $(".bank-not-found").hide();
      return false;
    }
    currentFocus = -1;
    /*create a DIV element that will contain the items (values):*/
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    /*append the DIV element as a child of the autocomplete container:*/
    this.parentNode.appendChild(a);
    /*for each item in the array...*/
    for (el = 0; el < arr.length; el++) {
      /*check if the item starts with the same letters as the text field value:*/
      if (arr[el].Nick_Name.toUpperCase().includes(val.toUpperCase()) || arr[el].Bank_Name.toUpperCase().includes(val.toUpperCase())) {
        /*create a DIV element for each matching element:*/
        b = document.createElement("DIV");
        /*make the matching letters bold:*/
        b.innerHTML = arr[el].Bank_Name.substr(0, val.length);
        b.innerHTML += arr[el].Bank_Name.substr(val.length);
        /*insert a input field that will hold the current array item's value:*/
        b.innerHTML += "<input type='hidden' value='" + arr[el].Bank_Name + "'>";
        /*execute a function when someone clicks on the item value (DIV element):*/
        b.addEventListener("click", function (e) {
          /*insert the value for the autocomplete text field:*/
          inp.value = this.getElementsByTagName("input")[0].value;
          /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
          closeAllLists();
        });

        //code to check if a bank is already exist into the suggestions list
        var a_children = a.children;
        if (a_children.length == 0) {
          a.appendChild(b);
        }
        else {

          let insertflag = 0;
          for (var cnt = 0; cnt < a_children.length; cnt++) {
            if (b.innerHTML == a_children[cnt].innerHTML) {

              insertflag = 1;
              break;
            }
          }
          if (insertflag == 0) {
            a.appendChild(b);
          }
        }

      }
    }

    //code to rendered bank not found status if a bank is not exist
    var tm1 = a.outerHTML;
    var tm = '<div id="searchbarautocomplete-list" class="autocomplete-items"></div>';
    if (tm1 == tm) {
      var bank_not_found = '<div class="searchbar-alert-fd">Bank Not Found*</div>';
      $(".autocomplete-items").css("border-bottom", "none");
      $(".bank-not-found").html(bank_not_found);
      $(".bank-not-found").show();
    }
    else {
      $(".bank-not-found").hide();
    }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = x.length - 1;
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }

  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var el = 0; el < x.length; el++) {
      x[el].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var el = 0; el < x.length; el++) {
      if (elmnt != x[el] && elmnt != inp) {
        x[el].parentNode.removeChild(x[el]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}
// checks bank exists or not
function BankExists(_TOTALBANKS_) {
  /* Compares based on Bank Name */
  return _TOTALBANKS_.Bank_Name === _BANKNAME_;
}

/* Post request to bankName and contains the data of Bank */
function BankDataBtn() {
  event.preventDefault();
  // Adding Bank Name to Global Variable from Search bar
  _BANKNAME_ = document.getElementById("bank-search-bar").value;
  if (_BANKNAME_ === "") {
    alert("Enter Bank Name")
    return;
  }
  let objBank = _TOTALBANKS_.find(BankExists);
  if (typeof (objBank) === 'undefined') {
    return;
  }
  $.ajax({
    type: "POST",
    url: "/api/admin/bank-data",
    data: JSON.stringify(objBank),
    contentType: "application/json; charset=utf-8",
    success: function (data) {
      data = data.Data
      _BANKDATA_ = data[0][0]; // it is giving [[Bank data], [scrapfd data]] so we need to extract it accordingly
      _SCRAPFDDATA_ = data[1][0];
      _INTERESTINFO_ = JSON.parse(_BANKDATA_.Interest_info);
      _MAXIR_ = _BANKDATA_.MaxIR;
      _BANKNAME_ = _BANKDATA_.Bank_Name;
      ShowBankDataTable();
      ShowMaxDataTable();
      ShowScrapFdData();
      $(".save-data").removeAttr('disabled'); // to disable to post data button in Interest info and bank Details
      $(".discard-changes").removeAttr('disabled');
      $(".add-new-row").removeAttr('disabled');
    },
    error: function (xhr) {
      // console.log("bro", xhr);
      setTimeout(function () {
        let objErr = JSON.parse(xhr.responseText)
        document.getElementById("error_msg").innerText = objErr.Message;
        $("#error_msg").show();
        $("#error_msg").delay(4000).fadeOut();
      });
    }
  });
}

/* Function will help to show Interest Info table */
function ShowIr() {
  var html = '';
  /* Displays Interest Information */
  for (var el = 0; el < _INTERESTINFO_.length; el++) {
    html += '<tr draggable="true" ondragstart="start()"  ondragover="dragover()">';
    html += '<td>' + _INTERESTINFO_[el].Duration + '</td>';
    html += '<td>' + _INTERESTINFO_[el].Interest + '</td>';
    html += '<td>' + _INTERESTINFO_[el].SrInterest + '</td>'
    html += '<td>' + _INTERESTINFO_[el].From_days + '</td>'
    html += '<td>' + _INTERESTINFO_[el].To_days + '</td>'
    html += '<td>'
    html += '<a class="add" title="Add" data-toggle="tooltip"><i class="material-icons"></i></a>'
    html += '<a class="edit" title="Edit" data-toggle="tooltip"><i class="material-icons"></i></a>'
    html += '<a class="insert" title="add_box"><i class="material-icons add-box">add_box</i></a>'
    html += '<a class="delete" title="Delete" data-toggle="tooltip"><i class="material-icons"></i></a>'
    html += '</td>'
    html += '</tr>'
  }
  if (!(_INTERESTINFO_.length)) {
    $("#statusTR").addClass('trclass');
  }
  else {
    $("#statusTR").removeClass('trclass');
  }
  $("#tbody").html(html);
}

/* Display the data of bank after successful search */
function ShowBankDataTable() {
  var notSavedWarn = "Image Not Saved";
  var imageHTML = '<form id="myform" onsubmit="LogoPostData()"><input type = "hidden" id ="new_image_name" name = "new_image_name"><input type="file"  id="bankImage" name="bankFileName" onChange="CheckImage(this)"><button type="submit" id = "submitBtn" class="btn btn-info image-data imagebtn" disabled> <span class="btnlht" >Post Logo</span> </button></form><img src="" id="display"><p id="message" class="danger"></p>'
  document.getElementById('name_of_bank').innerHTML = _BANKDATA_.Bank_Name;
  document.getElementById('type_of_bank').innerHTML = _BANKDATA_.Bank_Type;
  document.getElementById('status_of_bank').innerHTML = _BANKDATA_.Status;
  document.getElementById('rating1_of_bank').innerHTML = _BANKDATA_.Rating1;
  document.getElementById('rating2_of_bank').innerHTML = _BANKDATA_.Rating2;
  document.getElementById('rating3_of_bank').innerHTML = _BANKDATA_.Rating3;
  document.getElementById('rating4_of_bank').innerHTML = _BANKDATA_.Rating4;
  document.getElementById('nick_name_of_bank').innerHTML = _BANKDATA_.Nick_Name;
  document.getElementById('address_of_bank').innerHTML = _BANKDATA_.Address;
  document.getElementById('primary_of_bank').innerHTML = _BANKDATA_.Pri_URL;
  document.getElementById('alterurl_of_bank').innerHTML = _BANKDATA_.Alter_URL;
  document.getElementById('compounding_of_bank').innerHTML = _BANKDATA_.Compounding_Period;
  document.getElementById('id_of_bank').innerHTML = _BANKDATA_.Bank_ID;
  document.getElementById('bankImageDiv').innerHTML = imageHTML;
  document.getElementById('imageurl_of_bank').innerHTML = _BANKDATA_.Image_URL ? _BANKDATA_.Image_URL : notSavedWarn;

  var bankDetailHtml = '';
  bankDetailHtml += '<a class="bankDetailAdd" data-toggle="tooltip"><i class="material-icons"></i></a>'
  bankDetailHtml += '<a class="bankDetailEdit"  data-toggle="tooltip"><i class="material-icons"></i></a>'
  $(".edithtml").html(bankDetailHtml);
  $("#updatepost").removeAttr('disabled');
  $("#deletepost").removeAttr('disabled');
  /*  THIS PART IS USED FOR FETCHING INTEREST INFO */
  // function call for fetching the interest info
  ShowIr();

}

/* Displays scrap fd data of particular bank at their particular fields */
function ShowScrapFdData() {
  document.getElementById("keyword").value = _SCRAPFDDATA_.Keywords;
  document.getElementById("logic-code").textContent = _SCRAPFDDATA_.Logic_Code;
  document.getElementById("return-type").value = _SCRAPFDDATA_.Return_Type;
}

/* This function discard changes from current Interest Info table */
function DiscardChanges() {
  // replace the interest info from previous ir
  ShowIr();
  // replace the maxIr object with previous object
  SavingData();
}

function CreateMaxIrRow() {
  let table = document.getElementById("maxIrTbody");
  var row = table.insertRow();
  var cell1 = row.insertCell(0); // max general interest rate
  var cell2 = row.insertCell(1); // max senior interest rate
  var cell3 = row.insertCell(2); // max general interest rate duration
  var cell4 = row.insertCell(3); // max senior interest rate duration

  // assigning them ids for particular fields
  cell1.setAttribute("id", "MaxGenIR");
  cell2.setAttribute("id", "MaxSrIR");
  cell3.setAttribute("id", "MaxGenDur");
  cell4.setAttribute("id", "MaxSrDur");
}

/* Show Max IR of a particular bank based on current IR */
function ShowMaxDataTable() {
  if (_MAXIR_ != null) {
    $('#maxIrTbody').find("tr").remove();
    _MAXIR_ = JSON.parse(_MAXIR_);

    // removes previously existing row from maxir table
    for (let maxir = 0; maxir < _MAXIR_.length; maxir++) {
      CreateMaxIrRow(); // creates  new row at bottom with rows
      document.getElementById('MaxGenIR').innerHTML = _MAXIR_[maxir].maxGenIr;
      document.getElementById('MaxSrIR').innerHTML = _MAXIR_[maxir].maxSrIr;
      document.getElementById('MaxGenDur').innerHTML = _MAXIR_[maxir].maxGenDur;
      document.getElementById('MaxSrDur').innerHTML = _MAXIR_[maxir].maxSrDur;
    }
  }
}

/**
 * this function will calculate maxir based on current ir table
 */
function SavingData() {
  // removes the current existing row from the max Ir table
  $('#maxIrTbody').find("tr").remove();
  if (_IRTABLEVAL_.rows.length > MINLENIRTABLE) {
    CreateMaxIrRow();
    // created a maxIR object to create comparison first
    let MaxIR = []
    MaxIR[0] = {
      maxGenIr: 0,
      maxSrIr: 0,
      maxGenDur: "",
      maxSrDur: ""
    }

    // iterate over irtable and compare the maximum ir for maxIr
    for (var cnt = 1, row; row = _IRTABLEVAL_.rows[cnt]; cnt++) {
      var durationValue = row.cells[0].textContent;
      var interestValue = parseFloat(row.cells[1].textContent);
      var srInterestValue = parseFloat(row.cells[2].textContent);
      if (interestValue > MaxIR[0].maxGenIr) {
        MaxIR[0].maxGenIr = interestValue;
        MaxIR[0].maxGenDur = durationValue;
      }
      if (srInterestValue > MaxIR[0].maxSrIr) {
        MaxIR[0].maxSrIr = srInterestValue;
        MaxIR[0].maxSrDur = durationValue;
      }
    }
    document.getElementById('MaxGenIR').innerHTML = MaxIR[0].maxGenIr;
    document.getElementById('MaxSrIR').innerHTML = MaxIR[0].maxSrIr;
    document.getElementById('MaxGenDur').innerHTML = MaxIR[0].maxGenDur;
    document.getElementById('MaxSrDur').innerHTML = MaxIR[0].maxSrDur;
  }
}

///Inbuilt function for Checking the file is image or not.
function isImage(file) {
  try {
    var sizeInKb = (file.size) / 1024;
    return new Promise((resolve, reject) => {
      READER.onload = () => {
        if (sizeInKb > LEAST_SIZE && sizeInKb < MAX_SIZE) {
          var url = window.URL || window.webkitURL;
          var image = new Image();
          image.onload = function () {
            resolve(true);
          };
          image.onerror = function () {
            document.getElementById('message').innerHTML = INVLDMSG;
            $(".image-data").attr('disabled', true);
            $('#display').removeAttr("src");
            $('#display').removeAttr("style");
            resolve(false);
          };
          image.src = url.createObjectURL(file);
        }
        else {
          document.getElementById('message').innerHTML = INVLDSIZE;
          $(".image-data").attr('disabled', true);
          $('#display').removeAttr('src');
          $('#display').removeAttr("style");
          resolve(false);
        }
      };
      READER.onerror = () => {
        reject("Error reading file");
      };
      READER.readAsArrayBuffer(file.slice(0, 4));
    });
  }
  catch (err) {
    return null;
  }
}

//For previewing  and checking the image on the screen.
async function CheckImage(input) {
  try {
    if (input.files[0]) {
      await isImage(input.files[0])
        .then((isValid) => {
          if (isValid) {
            READER.readAsDataURL(input.files[0]);
            //the image got displayed on the frontend THROUGH jQUERY .
            READER.onload = function (e) {
              $('#display').attr('src', e.target.result)
                .width(55)
                .height(55);
              $(".image-data").removeAttr('disabled');
              document.getElementById('message').innerHTML = VLDMSG;
            }
            return true;
          }
        })
    }
  }
  catch (err) {
    return null;
  }
}

//posting the logo through AJAX Call.
async function LogoPostData() {
  var fileInput = document.getElementById('bankImage');
  var FileUploadPath = fileInput.value;
  var extension = FileUploadPath.substring(FileUploadPath.lastIndexOf('.') + 1).toLowerCase();
  var file = fileInput.files[0];

  if (!file) {
    event.preventDefault();
    document.getElementById('message').innerHTML = "Please insert Image."
  }
  else {
    event.preventDefault();
    var formData = new FormData();
    formData.append("id", _BANKDATA_.Bank_ID);
    formData.append("extension", extension);
    //Appending the encoded image buffer to the formData.(encoded in base64) through the FileReader.
    var imgBuffer = READER.result;
    formData.append("logo", imgBuffer);

    //AJAX request for sending the data to the backend.
    $.ajax({
      type: "POST",
      url: "/api/admin/update-bank-logo",
      data: formData,
      contentType: false,
      enctype: "multipart/form-data",
      processData: false,
      success: function (data) {
        setTimeout(function () {
          $("#success_message").show();
          $("#success_message").delay(3000).fadeOut();
        });
      },
      error: function (xhr) {
        let objErr = JSON.parse(xhr.responseText)
        document.getElementById("error_msg").innerText = objErr.Message;
        $("#error_msg").show();
        $("#error_msg").delay(4000).fadeOut();
      }
    });
  }

}

//posting the updated body through AJAX call.
function BankDetailPostData() {
  if (_BANKNAME_ == "") {
    alert("Name is empty");
    $(this).addClass("error");
  }

  else {
    //declaring and assigning variables with the values thru Id.
    var bankName = bankDetailEditTable.rows[1].cells[1].textContent;
    var nickName = bankDetailEditTable.rows[2].cells[1].textContent;
    var bankAddress = bankDetailEditTable.rows[3].cells[1].textContent;
    bankAddress = bankAddress ? bankAddress : null;
    var priUrl = bankDetailEditTable.rows[4].cells[1].textContent;
    var alterUrl = bankDetailEditTable.rows[5].cells[1].textContent;
    var imageUrl = bankDetailEditTable.rows[6].cells[1].textContent;
    var bankId = bankDetailEditTable.rows[7].cells[1].textContent;
    var bankStatus = bankDetailEditTable.rows[8].cells[1].textContent;
    var compoundingpd = bankDetailEditTable.rows[9].cells[1].textContent;
    var bankType = bankDetailEditTable.rows[10].cells[1].textContent;
    var bankRating1 = parseInt(bankDetailEditTable.rows[11].cells[1].textContent);
    bankRating1 = isNaN(bankRating1) ? null : bankRating1;
    var bankRating2 = parseInt(bankDetailEditTable.rows[12].cells[1].textContent);
    bankRating2 = isNaN(bankRating2) ? null : bankRating2;
    var bankRating3 = parseInt(bankDetailEditTable.rows[13].cells[1].textContent);
    bankRating3 = isNaN(bankRating3) ? null : bankRating3;
    var bankRating4 = parseInt(bankDetailEditTable.rows[14].cells[1].textContent);
    bankRating4 = isNaN(bankRating4) ? null : bankRating4;

    var objBankDetail = {
      name: "",
      type: "",
      status: "",
      rating1: "",
      rating2: "",
      rating3: "",
      rating4: "",
      nickname: "",
      address: "",
      pri: "",
      alter: "",
      compounding: "",
      imageurl: "",
      id: ""
    }

    //Assigning it to a input object
    objBankDetail.name = bankName;
    objBankDetail.type = bankType;
    objBankDetail.status = bankStatus;
    objBankDetail.rating1 = bankRating1;
    objBankDetail.rating2 = bankRating2;
    objBankDetail.rating3 = bankRating3;
    objBankDetail.rating4 = bankRating4;
    objBankDetail.nickname = nickName;
    objBankDetail.address = bankAddress;
    objBankDetail.pri = priUrl;
    objBankDetail.alter = alterUrl;
    objBankDetail.compounding = compoundingpd;
    objBankDetail.imageurl = imageUrl;
    objBankDetail.id = bankId;

    $.ajax({
      type: "POST",
      url: "/api/admin/update-bank-data",
      data: JSON.stringify(objBankDetail),
      contentType: "application/json; charset=utf-8",
      success: function (data) {
        setTimeout(function () {
          $("#success_message").show();
          $("#success_message").delay(3000).fadeOut();
        });
      },
      error: function (xhr) {
        // setTimeout(function () {
        //   $("#error_message").show();
        //   $("#error_message").delay(3000).fadeOut();
        // });
        let objErr = JSON.parse(xhr.responseText)
        document.getElementById("error_msg").innerText = objErr.Message;
        $("#error_msg").show();
        $("#error_msg").delay(4000).fadeOut();
      }
    });
  }
}

//posting the updated body through AJAX call.
function InterestInfoPostData() {

  // if BankName is available or not in the search bar
  if (_BANKNAME_ == "") {
    alert("Data is empty");
    $(this).addClass("error");
  }
  else {
    // initalization of array to store objects of maxIr object and Ir object
    var maxIrArr = [];
    var irInfoArr = [];

    // iterate over maxIr html element for values;
    for (var cnt = 1, row; row = _MAXIRTABLEVAL_.rows[cnt]; cnt++) {
      var maximumGenIRVal = parseFloat(row.cells[0].textContent); // genral Interest rate 
      var maximumSrIrVal = parseFloat(row.cells[1].textContent);  // Sr interest rate value;
      var maximumGenDurVal = row.cells[2].textContent;            // max general Duration value
      var maximumSrDurVal = row.cells[3].textContent;             // max senior Duration value;

      // Max IR object to insert it into maxIrArr array
      let objMaxIr = {
        maxGenIr: "",
        maxSrIr: "",
        maxGenDur: "",
        maxSrDur: ""
      }

      // assigining values to objMaxIr elements
      objMaxIr.maxGenIr = maximumGenIRVal;
      objMaxIr.maxSrIr = maximumSrIrVal;
      objMaxIr.maxGenDur = maximumGenDurVal;
      objMaxIr.maxSrDur = maximumSrDurVal;
      // pushing object to maxIrArr 
      maxIrArr.push(objMaxIr);
    }

    // iterating over the interest info table to extract the values
    for (var cnt = 1, row; row = _IRTABLEVAL_.rows[cnt]; cnt++) {
      var durationValue = row.cells[0].textContent;
      var interestValue = parseFloat(row.cells[1].textContent);   // genral ir 
      var srInterestValue = parseFloat(row.cells[2].textContent);
      var fromDaysValue = row.cells[3].textContent;
      var toDaysValue = row.cells[4].textContent;
      // initalization of Interest Rate object
      let objIr = {
        Duration: "",
        Interest: "",
        SrInterest: "",
        From_days: "",
        To_days: ""
      }
      objIr.Duration = durationValue;
      objIr.Interest = interestValue;
      objIr.SrInterest = srInterestValue;
      objIr.From_days = fromDaysValue;
      objIr.To_days = toDaysValue;
      //pushing Irinfo objeect to IrInfoArr
      irInfoArr.push(objIr);
    }

    // initalization of Interest rate object  
    var objIrPostData = {
      Interest_info: "",
      Bank_Name: "",
      MaxIR: "",
      comp_period: "",
      Bank_ID: "",
      Prev_Ir_info: "",
      status: ""
    };

    // asssigning values to Interest rate objects
    objIrPostData.status = document.getElementById("selectBankStatus").value;
    objIrPostData.Interest_info = JSON.stringify(irInfoArr);
    objIrPostData.Bank_Name = JSON.stringify(_BANKDATA_.Bank_Name);
    objIrPostData.MaxIR = JSON.stringify(maxIrArr);
    objIrPostData.comp_period = _BANKDATA_.Compounding_Period;
    objIrPostData.Bank_ID = _BANKDATA_.Bank_ID;
    objIrPostData.Prev_Ir_info = _BANKDATA_.Interest_info;

    // ajax call to post Interest Rate 
    $.ajax({
      type: "POST",
      url: "/api/admin/update-ir",
      data: JSON.stringify(objIrPostData),
      contentType: "application/json; charset=utf-8",
      success: function (data) {
        window.location.href = window.location.href + "?success=1"
      },
      error: function (xhr) {
        setTimeout(function () {
          let objErr = JSON.parse(xhr.responseText)
          document.getElementById("error_msg").innerText = objErr.Message;
          $("#error_msg").show();
          $("#error_msg").delay(4000).fadeOut();
        });
      }
    });
  }
}

// Scrap FD post function
function ScrapFdPostData() {
  // checks if the bank name is available or not in search bar
  if (_BANKNAME_ == "") {
    alert("Data is empty");
    $(this).addClass("error");
  }
  else {
    event.preventDefault();
    // values from the form of scrap fd 
    var bankId = _BANKDATA_.Bank_ID;
    var returnType = document.getElementById("return-type").value;
    var keywords = document.getElementById("keyword").value;
    var logicCode = document.getElementById("logic-code").value;
    /*
    Checks if the logic code is here then it is must that Return_Type of the same available in the form
    and vice vesa for same case
    using XOR operator
    */
    if ((logicCode.length > 1) ^ (returnType.length > 1)) {
      // display error message
      document.getElementById("error_msg").innerText = "Logic_Code and return Type are mandatory";
      $("#error_msg").show();
      $("#error_msg").delay(3000).fadeOut();
      $(this).addClass("error");
      return;
    }

    // Initalization scrap FD object
    var scrapBankData = {
      Bank_ID: "",
      Return_Type: "",
      Keywords: "",
      Logic_Code: ""
    };

    // assigning values to Scrap FD
    scrapBankData.Bank_ID = bankId;
    scrapBankData.Return_Type = returnType;
    scrapBankData.Keywords = keywords;
    scrapBankData.Logic_Code = logicCode;

    // ajax calll for scrapfd 
    $.ajax({
      type: "POST",
      url: "/api/admin/update-scrap-fd",
      data: JSON.stringify(scrapBankData),
      contentType: "application/json; charset=utf-8",
      success: function (data) {
        window.location.href = window.location.href + "?success=1"
      },
      error: function (xhr) {
        setTimeout(function () {
          let objErr = JSON.parse(xhr.responseText)
          document.getElementById("error_msg").innerText = objErr.Message;
          $("#error_msg").show();
          $("#error_msg").delay(4000).fadeOut();
        });
      }
    });
  }
}

/* Function for compare fd func activation */
function CompareFD() {
  $.ajax({
    type: "POST",
    url: "/api/admin/update-compare-fd",
    success: function () {
      setTimeout(function () {
        $("#success_message").show();
        $("#success_message").delay(3000).fadeOut();
      });
    },
    error: function (xhr) {
      setTimeout(function () {
        let objErr = JSON.parse(xhr.responseText)
        document.getElementById("error_msg").innerText = objErr.Message;
        $("#error_msg").show();
        $("#error_msg").delay(4000).fadeOut();
      });
    }
  })
}

// run script code backend call
async function RunScript() {
  var returnType = document.getElementById("return-type").value;
  var keywords = document.getElementById("keyword").value;
  var logicCode = document.getElementById("logic-code").value;

  var html = "";
  $("#runScript").html(html);
  const objScrap = {
    Bank_ID: _BANKDATA_.Bank_ID,
    Logic_Code : logicCode,
    Return_Type : returnType,
    Bank_Name : _BANKDATA_.Bank_Name,
    Pri_URL : _BANKDATA_.Pri_URL,
    Keywords : keywords
  }
  
  await $.ajax({
    type: "POST",
    url: "/api/admin/run-script",
    data: JSON.stringify(objScrap),
    contentType: "application/json; charset=utf=8",
    success: function (data) {
      _RSIRVALS_ = data.Data[0];
      _RSMAXIRVALS_ = data.Data[1];
      // alert('passed')
    },
    error: function (xhr) {
      html += "Wrong Script!! please modify or contact to super admin";
      $("#runScript").html(html);
      setTimeout(function () {
        
        document.getElementById("error_msg").innerText = "Unable to run Script!!";
        $("#error_msg").show();
        $("#error_msg").delay(4000).fadeOut();
      });
    }
  })
  // var html = "";
  html += '<h6>Max Value Details </h6>';
  html += '<table class = "maxIrTable table-bordered" id = "maxIrTable" >';
  html += '<thead> <th>Max Gen IR</th> <th>Max Sr IR</th> <th>Max Gen Dur</th> <th>Max Sr Dur</th> </thead>';
  html += '<tbody id="maxIrTbody">';
  html += '<td>' + _RSMAXIRVALS_.maxGenIr+ '</td>';
  html += '<td>' + _RSMAXIRVALS_.maxSrIr+ '</td>';
  html += '<td>' + _RSMAXIRVALS_.maxGenDur+ '</td>';
  html += '<td>' + _RSMAXIRVALS_.maxSrDur+ '</td>';
  html += '</tbody>';

  html += '<table class = "irtable table text-center table-bordered table-responsive-sm" id ="scrap-table">'
  html += '<thead> <tr> <th>Duration</th> <th>Interest</th> <th>Sr Interest</th> <th>From Days</th> <th>To Days</th> </tr> </thead>';
  html += '<tbody>'
  for (var el = 0; el < _RSIRVALS_.length; el++) {
    html += '<tr>';
    html += '<td>' + _RSIRVALS_[el].Duration + '</td>';
    html += '<td>' + _RSIRVALS_[el].Interest + '</td>';
    html += '<td>' + _RSIRVALS_[el].SrInterest + '</td>';
    html += '<td>' + _RSIRVALS_[el].From_days + '</td>';
    html += '<td>' + _RSIRVALS_[el].To_days + '</td>';
  }
  html +=
   '</tbody>'
  $("#runScript").html(html);
}

/* Function for creating tabs on home page */
function openContent(evt, item) {
  var i, tabContent, tabLinks;
  tabContent = document.getElementsByClassName("tabContent");
  for (var cnt = 0; cnt < tabContent.length; cnt++) {
    tabContent[cnt].style.display = "none";
  }
  tabLinks = document.getElementsByClassName("tabLinks");
  for (var cnt = 0; cnt < tabLinks.length; cnt++) {
    tabLinks[cnt].className = tabLinks[cnt].className.replace(" active", "");
  }
  document.getElementById(item).style.display = "block";
  evt.currentTarget.className += " active";
}

function toggleEditMode(fieldName) {
  let field = document.getElementById(fieldName);
  if (fieldName == "return-type") {
    field.removeAttribute('disabled');
  }
  else if (fieldName == "keyword") {
    field.removeAttribute("disabled");
  }
  else if (fieldName == "logic-code") {
    field.removeAttribute('disabled');
  }
  field.removeAttribute('readonly');
  field.focus();
  $(`.${fieldName}`).find(".scrap-add, .scrap-edit").toggle();
  $('[data-toggle="tooltip"]').tooltip();
}

function toggleAddMode(fieldName) {
  const field = document.getElementById(fieldName);
  const defaultValue = field.value;
  if (fieldName == "return-type") {
    field.setAttribute("disabled", "");
  }

  else {
    field.setAttribute('readonly', 'readonly');
  }

  field.value = defaultValue;
  $(`.${fieldName}`).find(".scrap-add, .scrap-edit").toggle();
  $('[data-toggle="tooltip"]').tooltip();
}

// Initialize default values
document.addEventListener('DOMContentLoaded', function () {
  const fields = document.querySelectorAll('input[data-default]');
  fields.forEach(function (field) {
    field.value = field.getAttribute('data-default');
  });
});

//code for make table row draggable in interest rate table
var row;
function start() {
  row = event.target;
}
function dragover() {
  var e = event;
  e.preventDefault();

  let children = Array.from(e.target.parentNode.parentNode.children);

  if (children.indexOf(e.target.parentNode) > children.indexOf(row))
    e.target.parentNode.after(row);
  else
    e.target.parentNode.before(row);
}

// success message code
if (window.location.search.indexOf('success=1') > -1) {

  // Remove the success message query string parameter from the URL
  var newUrl = window.location.href.replace(/[\?&]success=1/, '');

  // Set a cookie to indicate that the success message has been displayed
  document.cookie = "successDisplayed=true";

  // Redirect to the new URLz
  window.location.href = newUrl;
}
else {

  // Check if the cookie is set to indicate that the success message has been displayed
  if (document.cookie.indexOf('successDisplayed=true') > -1) {

    // Do something different on the next refresh
    $("#success_message").show();
    $("#success_message").delay(8000).fadeOut();

    // Remove the cookie to reset the state of the page
    document.cookie = `successDisplayed=; max-age=1; path=/admin;`;
  }
}

// <---------------------------------- PARSER CODE ------------------------------------->

function convertToDays(periodString) {
  //regex pattern to get the integers(string) just before the keywords "y"
  fdPeriodRegexYear = /(\d+)(?=(\s*(y+)))/gim;

  //regex pattern to get the integers(string) just before the keywords "m"
  fdPeriodRegexMonth = /(\d+)(?=(\s*(m+)))/gim;

  //regex pattern to get the integers(string) just before the keywords "w"
  fdPeriodRegexWeek = /(\d+)(?=(\s*(w+)))/gim;

  removeBracketTextRegex = / *\([^)]*\) */gim;

  //remove all special characters except <, >, =
  removeSpecialCharactersRegex = /[^\w\s<>=&-]/gim;

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

  numList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  //regex pattern to match any years months weeks or days
  ymwdRegex = /(\d+)(?=(\s*(y+))|(\s*(m+))|(\s*(w+))|(\s*(d+)))/gim;
  //regex pattern to match only digits
  digitsRegex = /(\d+)/gim;
  //find and remove bracket and enclosed text
  periodString = periodString.replace(removeBracketTextRegex, "");

  //find and remove all special chars
  periodString = periodString.replace(removeSpecialCharactersRegex, "");
  //replacing duration words with nums
  for (const index in charToNumRegexList) {
    periodString = periodString.replace(charToNumRegexList[index], numList[index]);

  }

  //find and convert Years to Days then store it in an array
  periodString = periodString.replace(
    fdPeriodRegexYear,
    function func(match) {
      yearsToDays = parseInt(match) * 365;
      return yearsToDays;
    }
  );
  //find and convert Months to Days then store it in an array
  periodString = periodString.replace(
    fdPeriodRegexMonth,
    function func(match) {

      match = parseInt(match);

      //convert to days acc to years and months if months > 12
      if (match >= 12) {
        years = parseInt(match / 12);
        months = match % 12;
        monthsToDays = years * 365 + months * 30;
      }
      else
        monthsToDays = match * 30;

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
}

function scrapPeriod(periodString) {
  //if - is present use digit regex || y/m/d before to
  if (/\s*-\s*/.test(periodString) ||
    !/(y+|m+|d+)(?=[a-zA-Z0-9\s]*to\s*)/gim.test(periodString))
    arr = periodString.match(digitsRegex);
  else
    arr = periodString.match(ymwdRegex);

  if (arr == null)
    return [0];
  Arr = []; // array to store matched array and period string
  Arr.push(arr);
  Arr.push(periodString);

  return Arr;
}

function convertFromTo(Arr) {
  arr = Arr[0];
  periodString = Arr[1];

  let newArr = [];

  //convert string arr into integer array
  for (i = 0; i < arr.length; i++) {
    arr[i] = parseInt(arr[i]);
  }

  if (arr == null)
    arr.push("null");

  //if only 1  element , push them directly
  else if (arr.length == 1) {
    for (element of arr)
      newArr.push(element);
    if (periodString.match(/above/gi))
      newArr.push(3650);
  } else if (arr.length == 2) {
    yearCount = periodString.match(/([^a-z-A-Z]\s*(y+))/gim) || [];
    monthCount = periodString.match(/([^a-z-A-Z]\s*(m+))/gim) || [];
    weekCount = periodString.match(/([^a-z-A-Z]\s*(w+))/gim) || [];
    dayCount = periodString.match(/([^a-z-A-Z]\s*(d+))/gim) || [];
    //if pattern like 1 year 1 day i.e 365 year 1 day
    if (arr[0] > arr[1]) {
      newArr.push(arr[0] + arr[1]);
    } else if (yearCount.length == 1 &&
      monthCount.length == 0 &&
      weekCount.length == 0 &&
      dayCount.length == 0) {
      newArr.push(365 * arr[0]);
      newArr.push(arr[1]);
    } else if (yearCount.length == 0 &&
      monthCount.length == 1 &&
      weekCount.length == 0 &&
      dayCount.length == 0) {
      newArr.push(30 * arr[0]);
      newArr.push(arr[1]);
    } else if (yearCount.length == 0 &&
      monthCount.length == 0 &&
      weekCount.length == 1 &&
      dayCount.length == 0) {
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
}


//Delete the bank details 
function Deletebankdata() {
  console.log("delerd in frontenmd");
  var objDeleteBank = {
    id: ""
  }
  var Bank_ID = bankDetailEditTable.rows[7].cells[1].textContent;
  objDeleteBank.id = Bank_ID;
  console.log("entered.", objDeleteBank);
  $.ajax({
    type: "POST",
    url: "/api/admin/delete-bank",
    data: JSON.stringify(objDeleteBank),
    contentType: "application/json; charset=utf-8",
    success: function () {
      setTimeout(function () {
        // alert("success");
        window.location.reload();
        $("#success_message").show();
        $("#success_message").delay(5000).fadeOut();
      })
    },
    error: function (xhr) {
      setTimeout(function () {
        let objErr = JSON.parse(xhr.responseText)
        document.getElementById("error_msg").innerText = objErr.Message;
        $("#error_msg").show();
        $("#error_msg").delay(4000).fadeOut();
      })
    }
  })

}

//Add the email in Admin Table
function AddEmailPost() {
  let emailInput = document.getElementById('email-input').value;
  var objAddUser = {
    email: ""
  }
  objAddUser.email = emailInput;
  console.log("entered.==", objAddUser);
  $.ajax({
    type: "POST",
    url: "/api/admin/add-user",
    data: JSON.stringify(objAddUser),
    contentType: "application/json; charset=utf-8",
    success: function () {
      setTimeout(function () {
        alert("success");
        window.location.reload();
        $("#success_message").show();
        $("#success_message").delay(5000).fadeOut();
      })
    },
    error: function (xhr) {
      setTimeout(function () {
        let objErr = JSON.parse(xhr.responseText)
        document.getElementById("error_msg").innerText = objErr.Message;
        $("#error_msg").show();
        $("#error_msg").delay(4000).fadeOut();
      })
    }
  })
}

