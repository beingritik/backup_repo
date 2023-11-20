//For previewing  and checking the image on the screen. (Global variable)
var _NEWLOGONAME_;
// selects ir table from html
const _NEWIRTABLE_ = document.getElementById("newIrTable")
// selects maxir table from html
const _NEWMAXIRTABLE_ = document.getElementById("newMaxIrTable");
// minimum length of interest rate Table
const _MINLENIRTABLE_ = 1;
const FR = new FileReader();


//Function to convert binary buffer to base64 for further processing
function BuffertoBase64(buffer) {
  let uint8Array = new Uint8Array(buffer);
  let length = uint8Array.byteLength;
  let binaryString = new Array(length);
  for (let i = 0; i < length; i++) {
    binaryString[i] = String.fromCharCode(uint8Array[i]);
  }
  let base64Stringdata = btoa(binaryString.join(''));
  return base64Stringdata;
}

// Functions tp be performed when page gets loaded
$(document).ready(function () {
  var base_color = "rgb(230,230,230)";
  var active_color = "#1350AD";
  var child = 1;
  var length = $("section").length - 1;
  $("#prev").addClass("disabled");
  $("#submit").addClass("disabled");
  $("#save").removeClass("disabled");
  $("section").not("section:nth-of-type(1)").hide();
  $("section").not("section:nth-of-type(1)").css('transform', 'translateX(100px)');

  var svgWidth = length * 200 + 24;
  $("#svg_wrap").html(
    '<svg version="1.1" id="svg_form_time" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 ' +
    svgWidth +
    ' 24" xml:space="preserve"></svg>'
  );

  function makeSVG(tag, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  for (i = 0; i < length; i++) {
    var positionX = 12 + i * 200;
    var rect = makeSVG("rect", { x: positionX, y: 9, width: 200, height: 6 });
    document.getElementById("svg_form_time").appendChild(rect);
    // <g><rect x="12" y="9" width="200" height="6"></rect></g>'
    var circle = makeSVG("circle", {
      cx: positionX,
      cy: 12,
      r: 12,
      width: positionX,
      height: 6
    });
    document.getElementById("svg_form_time").appendChild(circle);
  }

  var circle = makeSVG("circle", {
    cx: positionX + 200,
    cy: 12,
    r: 12,
    width: positionX,
    height: 6
  });
  document.getElementById("svg_form_time").appendChild(circle);

  $('#svg_form_time rect').css('fill', base_color);
  $('#svg_form_time circle').css('fill', base_color);
  $("circle:nth-of-type(1)").css("fill", active_color);


  $(".button").click(function () {
    $("#svg_form_time rect").css("fill", active_color);
    $("#svg_form_time circle").css("fill", active_color);
    var id = $(this).attr("id");
    if (id == "next") {

      $("#prev").removeClass("disabled");
      $("#save").addClass('disabled');
      if (child >= length) {
        $(this).addClass("disabled");
        $('#submit').removeClass("disabled");

      }
      if (child <= length) {
        child++;

      }
    } else if (id == "prev") {

      $("#next").removeClass("disabled");
      $('#submit').addClass("disabled");
      if (child <= 2) {
        $(this).addClass("disabled");
        $('#save').removeClass("disabled");
      }
      if (child > 1) {
        child--;
      }
    }
    var circle_child = child + 1;
    $("#svg_form_time rect:nth-of-type(n + " + child + ")").css(
      "fill",
      base_color
    );
    $("#svg_form_time circle:nth-of-type(n + " + circle_child + ")").css(
      "fill",
      base_color
    );
    var currentSection = $("section:nth-of-type(" + child + ")");
    currentSection.fadeIn();
    currentSection.css('transform', 'translateX(0)');
    currentSection.prevAll('section').css('transform', 'translateX(-100px)');
    currentSection.nextAll('section').css('transform', 'translateX(100px)');
    $('section').not(currentSection).hide();
  });
  // inserts new row next to current row 
  $(document).on("click", ".newInsert", function () {
    let index = $(this).closest('tr').index();
    let row = _NEWIRTABLE_.insertRow(index + 1); // insert row at the next to the current index 
    let cell1 = row.insertCell(0);
    let cell2 = row.insertCell(1);
    let cell3 = row.insertCell(2);
    let cell4 = row.insertCell(3);
    let cell5 = row.insertCell(4);
    let cell6 = row.insertCell(5);
    cell1.innerHTML = '<td><input type="text" class="form-control" name="duration" id="duration"></td>';
    cell2.innerHTML = '<td><input type="text" class="interest form-control" name="interest" id="interest"></td>';
    cell3.innerHTML = '<td><input type="text" class="interest form-control" name="srInterest" id="srInterest"></td>';
    cell4.innerHTML = '<td><input type="text" class="form-control" name="fromDays" id="fromDays"></td>';
    cell5.innerHTML = '<td><input type="text" class="form-control" name="toDays" id="toDays"></td>';
    cell6.innerHTML = '<td>' + '<a class="newAdd" title="Add" data-toggle="tooltip"><i class="material-icons"></i></a>' +
      '<a class="newEdit" title="Edit" data-toggle="tooltip"><i class="material-icons"></i></a>' +
      '<a class="newInsert" title="add_box"><i class="material-icons add-box">add_box</i></a>' +
      '<a class="newDelete" title="Delete" data-toggle="tooltip"><i class="material-icons"></i></a>' +
      '</td>';
    $(".newIrTable  tbody tr").eq(index + 1).find(".newAdd, .newEdit").toggle(); // toggle edit and add, next to current index
    $('[data-toggle="tooltip"]').tooltip();
    if (_NEWIRTABLE_.rows.length > _MINLENIRTABLE_) {
      document.getElementById("newStatusId").removeAttribute("disabled");
    }
  });
  // On click of add new row button it will create a row at bottom of table 
  $(document).on("click", ".newAddNewRow", function () {
    var row = _NEWIRTABLE_.insertRow(-1); //Insert row at bottom of table
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(4);
    var cell6 = row.insertCell(5);

    cell1.innerHTML = '<td><input type="text" class="form-control" name="duration" id="duration"></td>';
    cell2.innerHTML = '<td><input type="text" class="interest form-control" name="interest" id="interest"></td>';
    cell3.innerHTML = '<td><input type="text" class="interest form-control" name="srInterest" id="srInterest"></td>';
    cell4.innerHTML = '<td><input type="text" class="form-control" name="fromDays" id="fromDays"></td>';
    cell5.innerHTML = '<td><input type="text" class="form-control" name="toDays" id="toDays"></td>';
    cell6.innerHTML = '<td>' + '<a class="newAdd" title="Add" data-toggle="tooltip"><i class="material-icons"></i></a>' +
      '<a class="newEdit" title="Edit" data-toggle="tooltip"><i class="material-icons"></i></a>' +
      '<a class="newInsert" title="add_box"><i class="material-icons add-box">add_box</i></a>' +
      '<a class="newDelete" title="Delete" data-toggle="tooltip"><i class="material-icons"></i></a>' +
      '</td>';
    $(".newIrTable  tbody tr").eq(-1).find(".newAdd, .newEdit").toggle();
    $('[data-toggle="tooltip"]').tooltip();
  })
  // add the content of input filed of table to table row
  $(document).on("click", ".newAdd", function () {
    var empty = false;
    var input = $(this).parents("tr").find('input[type="text"]');
    var irVal = $(".interest"); // fetches interest rate and senior interest rate fields
    irVal.each(function () {
      var regx = /[^0-9.]/
      if (regx.test($(this).val())) {
        alert("Interest rate can only float type")
        document.getElementById("message").innerHTML = "<p>Interest Rate can only be float type</p>"
        $("#message").show();
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

      $(this).parents("tr").find(".newAdd, .newEdit").toggle();
      $(this).parents("tr").attr("draggable", "True")
      $(this).parents("tr").attr("ondragstart", "start()")
      $(this).parents("tr").attr("ondragover", "dragover()")
    }
    newSavingData();
    FinalSubmit();
    if (_NEWIRTABLE_.rows.length > _MINLENIRTABLE_) {
      document.getElementById("newStatusId").removeAttribute("disabled");
    }
  });
  // Edit row on edit button click
  $(document).on("click", ".newEdit", function () {
    $(this).parents("tr").find("td:not(:last-child)").each(function (index) {
      if (index === 0) {
        $(this).html('<input type="text" class="form-control" name = "newDuration" id ="newDuration" value="' + $(this).text() + '">');
      }

      else if (index === 3) {
        $(this).html('<input type="text" class="form-control" name = "newFromDays" id ="newFromDays" value="' + $(this).text() + '">');

      }
      else if (index === 4) {
        $(this).html('<input type="text" class="form-control" name = "newToDays" id ="newToDays" value="' + $(this).text() + '">');

      }
      else {
        $(this).html('<input type="text" class="interest form-control" value="' + $(this).text() + '">');
      }
    });
    $(this).parents("tr").find(".newAdd, .newEdit").toggle();
  });

  // Delete row on delete button click
  $(document).on("click", ".newDelete", function () {
    let html = '<i class="material-icons"></i>';
    $(this).parents("tr").remove();
    newSavingData();
    FinalSubmit()
  });

  $(document).on("click", ".newDelete", function () {
    if (_NEWIRTABLE_.rows.length <= _MINLENIRTABLE_) {
      document.getElementById("newStatusId").setAttribute("disabled", "");
      document.getElementById("newStatusId").innerHTML = `<select class="inputmargin selectfieldbackgroundcolor marginleft inputhalf" id="newStatusId"
      name="newStatus" disabled>
      <option value=""> --Select Status--</option>
      <option value="Active">Active</option>
      <option value="Inactive" selected="Inactive">Inactive</option>
      <option value="Suspended">Suspended</option>
      <option value="Closed">Closed</option>
      <option value="Not Available">Not Available</option>
    </select>`
    }
  })
});

//Function of saving bank details to database , sending AJAX request on parsing body of data in an object.
function SaveBankDetail() {
  try {
    //All variable declarations contained in the passed body
    var bankName = document.getElementById('banknameId').value;
    var nickName = document.getElementById('banknicknameId').value;
    var priUrl = document.getElementById('primaryUrlId').value;
    var alterUrl = document.getElementById('bankalterUrlId').value;
    var compoundingpd = document.getElementById('compoundingpdId').value;
    var bankType = document.getElementById('banktypeId').value;

    var bankRating1 = parseInt(document.getElementById('rating1Id').value);
    bankRating1 = isNaN(bankRating1) ? null : bankRating1;
    var bankRating2 = parseInt(document.getElementById('rating2Id').value);
    bankRating2 = isNaN(bankRating2) ? null : bankRating2;
    var bankRating3 = parseInt(document.getElementById('rating3Id').value);
    bankRating3 = isNaN(bankRating3) ? null : bankRating3;
    var bankRating4 = parseInt(document.getElementById('rating4Id').value);
    bankRating4 = isNaN(bankRating4) ? null : bankRating4;
    var banklogofile = document.querySelector('#banklogoId');
    var address = document.getElementById('bankaddressId').value;
    address = address ? address : null;

    // to take out the extension of the given file
    var FileUploadPath = banklogofile.value;
    var extension = FileUploadPath.substring(FileUploadPath.lastIndexOf('.') + 1).toLowerCase();


    //Using formData to pass the payload to backend
    var formdata = new FormData();

    var objSaveBankDetail = {
      name: "",
      type: "",
      rating1: "",
      rating2: "",
      rating3: "",
      rating4: "",
      nickname: "",
      address: " ",
      pri: "",
      alter: "",
      compounding: "",
    }

    objSaveBankDetail.name = bankName.trim();
    objSaveBankDetail.type = bankType.trim();
    objSaveBankDetail.rating1 = bankRating1;
    objSaveBankDetail.rating2 = bankRating2;
    objSaveBankDetail.rating3 = bankRating3;
    objSaveBankDetail.rating4 = bankRating4;
    objSaveBankDetail.nickname = nickName.trim();

    objSaveBankDetail.address = address;
    // objSaveBankDetail.apy = apyRate;
    objSaveBankDetail.pri = (priUrl.trim()).toLowerCase();
    objSaveBankDetail.alter = (alterUrl.trim()).toLowerCase();
    objSaveBankDetail.compounding = compoundingpd;

    //tO Convert the arraybuffer to base64
    let base64String = BuffertoBase64(FR.result);

    //Appending the data in formdata buffer
    formdata.append("newlogo", base64String)
    formdata.append("extension", extension)
    formdata.append("objinfo", JSON.stringify(objSaveBankDetail))

    $.ajax({
      type: "POST",
      url: "/api/admin/save-bank-data",
      data: formdata,
      contentType: false,
      enctype: "multipart/form-data",
      processData: false,
      // contentType: "application/json; charset=utf-8",
      success: function (data) {
        setTimeout(function () {
          $("#success_message").show();
          $("#success_message").delay(3000).fadeOut();
        });
      },
      error: function (xhr) {
        setTimeout(function () {
          $("#error_message").show();
          $("#error_message").delay(3000).fadeOut();
        });
      }
    });
  }
  catch (err) {
    throw err;
  }

}

// create new row in Max IR table
function NewBankMaxIrRow() {
  let table = document.getElementById("newMaxIrTbody")
  let row = table.insertRow();
  var cell1 = row.insertCell(0);
  var cell2 = row.insertCell(1);
  var cell3 = row.insertCell(2);
  var cell4 = row.insertCell(3);
  cell1.setAttribute("id", "newMaxGenIr");
  cell2.setAttribute("id", "newMaxSrIr");
  cell3.setAttribute("id", "newMaxGenDur");
  cell4.setAttribute("id", "newMaxSrDur");
}

function newSavingData() {
  $("#newMaxIrTbody").find("tr").remove();
  if (_NEWIRTABLE_.rows.length > _MINLENIRTABLE_) {
    NewBankMaxIrRow();
    var newMaxIr = [];
    newMaxIr[0] = {
      newMaxGenIr: 0,
      newMaxSrIr: 0,
      newMaxGenDur: "",
      newMaxSrDur: ""
    }
    for (var ele = 1, row; row = _NEWIRTABLE_.rows[ele]; ele++) {
      var durationValue = row.cells[0].textContent;
      var interestValue = parseFloat(row.cells[1].textContent);
      var srInterestValue = parseFloat(row.cells[2].textContent);
      if (interestValue > newMaxIr[0].newMaxGenIr) {
        newMaxIr[0].newMaxGenIr = interestValue;
        newMaxIr[0].newMaxGenDur = durationValue;
      }
      if (srInterestValue > newMaxIr[0].newMaxSrIr) {
        newMaxIr[0].newMaxSrIr = srInterestValue;
        newMaxIr[0].newMaxSrDur = durationValue;
      }
      document.getElementById('newMaxGenIr').innerHTML = newMaxIr[0].newMaxGenIr;
      document.getElementById('newMaxSrIr').innerHTML = newMaxIr[0].newMaxSrIr;
      document.getElementById('newMaxGenDur').innerHTML = newMaxIr[0].newMaxGenDur;
      document.getElementById('newMaxSrDur').innerHTML = newMaxIr[0].newMaxSrDur;
    }
  }
}
// create new bank with interest information and maxir
function CreateBank() {
  // data for body of bank details form
  var bankName = document.getElementById('banknameId').value;
  var nickName = document.getElementById('banknicknameId').value;
  var priUrl = document.getElementById('primaryUrlId').value;
  var alterUrl = document.getElementById('bankalterUrlId').value;
  var compoundingpd = document.getElementById('compoundingpdId').value;
  var bankType = document.getElementById('banktypeId').value;

  var bankRating1 = parseInt(document.getElementById('rating1Id').value);
  bankRating1 = isNaN(bankRating1) ? null : bankRating1;
  var bankRating2 = parseInt(document.getElementById('rating2Id').value);
  bankRating2 = isNaN(bankRating2) ? null : bankRating2;
  var bankRating3 = parseInt(document.getElementById('rating3Id').value);
  bankRating3 = isNaN(bankRating3) ? null : bankRating3;
  var bankRating4 = parseInt(document.getElementById('rating4Id').value);
  bankRating4 = isNaN(bankRating4) ? null : bankRating4;
  var banklogofile = document.querySelector('#banklogoId');
  var address = document.getElementById('bankaddressId').value;
  address = address ? address : null;

  // to take out the extension of the given file
  var FileUploadPath = banklogofile.value;
  var extension = FileUploadPath.substring(FileUploadPath.lastIndexOf('.') + 1).toLowerCase();
  var status = document.getElementById("newStatusId").value;

  // data from body of ir table
 
  var newMaxIrArr = []; 
  var newIrInfoArr = [];
  // formData.append("banklogo", logoImage.files[0]);
  for (var i = 1, row; row = _NEWMAXIRTABLE_.rows[i]; i++) {
    var maxGenIr = parseFloat(row.cells[0].textContent);
    var maxSrIr = parseFloat(row.cells[1].textContent);
    var maxGenDur = row.cells[2].textContent;
    var maxSrDur = row.cells[3].textContent;

    objMaxIr = {
      maxGenIr: 0,
      maxSrIr: 0,
      maxGenDur: "",
      maxSrDur: ""
    }
    objMaxIr.maxGenIr = maxGenIr;
    objMaxIr.maxSrIr = maxSrIr;
    objMaxIr.maxGenDur = maxGenDur;
    objMaxIr.maxSrDur = maxSrDur;
    newMaxIrArr.push(objMaxIr);
  }

  for (var ele = 1, row; row = _NEWIRTABLE_.rows[ele]; ele++) {
    var durationValue = row.cells[0].textContent;
    var interestValue = parseFloat(row.cells[1].textContent);
    var srInterestValue = parseFloat(row.cells[2].textContent);
    var fromDays = row.cells[3].textContent;
    var toDays = row.cells[4].textContent;

    objIr = {
      Duration: "",
      Interest: "",
      SrInterest: "",
      From_days: "",
      To_days: ""
    }
    objIr.Duration = durationValue;
    objIr.Interest = interestValue;
    objIr.SrInterest = srInterestValue;
    objIr.From_days = fromDays;
    objIr.To_days = toDays;

    newIrInfoArr.push(objIr);

  }

  var objCreateBankIr = {
    newIrInfoArr: "",
    newMaxIrArr: "",
    newStatus: "",
    name: "",
    nickname: "",
    pri: "",
    alter: "",
    type: "",
    compounding: "",
    rating1: "",
    rating2: "",
    rating3: "",
    rating4: "",
    address: ""
  }
  objCreateBankIr.newIrInfoArr = newIrInfoArr;
  objCreateBankIr.newMaxIrArr = newMaxIrArr;
  objCreateBankIr.name = bankName.trim();
  objCreateBankIr.nickname = nickName.trim();
  objCreateBankIr.pri = (priUrl.trim()).toLowerCase();
  objCreateBankIr.alter = (alterUrl.trim()).toLowerCase();
  objCreateBankIr.compounding = compoundingpd;
  objCreateBankIr.type = bankType.trim();
  objCreateBankIr.rating1 = bankRating1;
  objCreateBankIr.rating2 = bankRating2;
  objCreateBankIr.rating3 = bankRating3;
  objCreateBankIr.rating4 = bankRating4;
  objCreateBankIr.address = address;
  objCreateBankIr.newStatus = status;
  
  const uint8Array = new Uint8Array(FR.result);
  const length = uint8Array.byteLength;
  const binaryString = new Array(length);
  for(let i = 0; i<length; i++){
    binaryString[i] = String.fromCharCode(uint8Array[i]);
  }
  const base64String = btoa(binaryString.join(''));
  var formData = new FormData();
  formData.append("newlogo", base64String)
  formData.append("extension", extension)
  formData.append("objinfo", JSON.stringify(objCreateBankIr));
  $.ajax({
    type: "POST",
    url: "/api/admin/create-bank",
    data: formData,
    contentType: false,
    enctype: "multipart/form-data",
    processData: false,
    success: function (data) {
      setTimeout(function () {
        $("#success_message").show();
        $("#success_message").delay(3000).fadeOut();
      });
      // window.location.href = window.location.href + "?success=1"
    },
    error: function (xhr) {
      let objErr = JSON.parse(xhr.responseText);
      console.log(objErr);
      document.getElementById("error_msg").innerText = "An Internal server error" 
      $("#error_message").show();
      $("#error_message").delay(3000).fadeOut();
     }
  })
}



//inbuilt function required in validating the logo;
function isValidLogo(file) {
  try {
    var flag = true;
    var imageData = document.getElementById('banklogoId');
    var sizeInKb = (imageData.files[0].size) / 1024;

    return new Promise((resolve, reject) => {
      FR.onload = () => {
        if (sizeInKb > LEAST_SIZE && sizeInKb < MAX_SIZE) {
          var url = window.URL || window.webkitURL;
          var image = new Image();
          image.onload = function () {
            var isValid = true;

            //tO Convert the arraybuffer to base64
            const uint8Array = new Uint8Array(FR.result);
            const length = uint8Array.byteLength;
            const binaryString = new Array(length);
            for (let i = 0; i < length; i++) {
              binaryString[i] = String.fromCharCode(uint8Array[i]);
            }
            const base64String = btoa(binaryString.join(''));

            //Append the buffer and boolean 
            let bufferArray = [];
            bufferArray.push(base64String, isValid);
            resolve(bufferArray);

          };
          image.onerror = function () {
            document.getElementById('banklogo_message').innerHTML = "Image is not of JPG/JPEG format.."
            $("#display_logo").remove();
            flag = false;
            resolve(flag);
          };
          image.src = url.createObjectURL(imageData.files[0]);
        }
        else {
          document.getElementById('banklogo_message').innerHTML = "Image size should be between 2kb and 100kb."
          $("#display_logo").remove();
          flag = false;
          resolve(flag);
        }
      };
      FR.onerror = () => {
        reject("Error reading file");
      };

      FR.readAsArrayBuffer(file);
    });
  }
  catch (err) {
    throw err;
  }
}

//for checking the logo is valid or not; (Frontend checking of logo and display warnings)
async function CheckLogo() {
  try {
    var flag = true;
    var imageData = document.getElementById('banklogoId');
    if (imageData.files[0]) {
      await isValidLogo(imageData.files[0])
        .then((result) => {
          let isValid = result[1];
          if (isValid) {
            flag = isValid;
            document.getElementById('banklogo_message').innerHTML = " <span class='success'>Verified Successfully.</span>";
            $(".image-data").removeAttr('disabled');
            return result;
          }
          else {
            // flag = isValid;
            return false;
          }
        })
      return flag;
    }
    else {
      flag = false;
      return flag;
    }
  }
  catch (err) {
    throw err;
  }
}

//Inbuilt function called for checking  the validation on the body
async function FormValidation() {
  var name = document.getElementById('banknameId');
  var nickname = document.getElementById('banknicknameId');
  var priUrl = document.getElementById('primaryUrlId');
  var alterUrl = document.getElementById('bankalterUrlId');
  var compoundingpd = document.getElementById('compoundingpdId');
  var type = document.getElementById('banktypeId');
  var address = document.getElementById('bankaddressId');
  var imageData = document.getElementById('banklogoId');

  //regex for all fields
  var nameRegex = /^[a-zA-Z][a-zA-Z0-9\. ]*$/;
  var nicknameRegex = /^[a-zA-Z][a-zA-Z0-9\. ]*$/;
  var priUrlRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
  var alterUrlRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

  //declaring variables for matching regex;
  var isValidName = nameRegex.test((name.value));
  var isValidnickName = nicknameRegex.test(nickname.value);
  var isValidPriUrl = priUrlRegex.test(priUrl.value);
  var isValidAlterUrl = alterUrlRegex.test(alterUrl.value);

  if (name.value || nickname.value || priUrl.value || alterUrl.value || compoundingpd.value || type.value || imageData.files[0]) {
    if (name.value) {
      name.setCustomValidity("name is reqd.")
      if (isValidName && (name.value).length < 50) {
        document.getElementById('name_message').innerHTML = "";
      }
      else {
        name.setCustomValidity("");
        document.getElementById('name_message').innerHTML = "Invalid Name. Not matched proper format.(Alphanumerics allowed; Maybe white spaces.)"
        return false;
      }
    }
    else if (!name.value) {
      return false;
    }
    if (nickname.value) {
      nickname.setCustomValidity("nickname is reqd.")
      if (isValidnickName && (nickname.value).length < 15) {
        document.getElementById('nickname_message').innerHTML = "";
      }
      else {
        nickname.setCustomValidity("");
        document.getElementById('nickname_message').innerHTML = "Invalid NickName. Not matched proper format.(Alphanumerics allowed;)"
        return false;
      }
    }
    else if (!nickname.value) {
      return false;
    }

    if (priUrl.value) {
      if (isValidPriUrl) {
        document.getElementById('pri_message').innerHTML = "";
      }
      else {
        priUrl.setCustomValidity("priUrl is reqd.")
        document.getElementById('pri_message').innerHTML = "Invalid Primary Url. Not matched proper format. Include https://"
        return false;
      }
    }
    else if (!priUrl.value) {
      return false;
    }
    if (alterUrl.value) {
      alterUrl.setCustomValidity("alterUrl is reqd.")
      if (isValidAlterUrl) {
        document.getElementById('alter_message').innerHTML = "";
      }
      else {
        alterUrl.setCustomValidity("");
        document.getElementById('alter_message').innerHTML = "Invalid Alter URL. Not matched proper format. Include https://"
        return false;
      }
    }
    else if (!alterUrl.value) {
      return false;
    }
    if (!compoundingpd.value) {
      document.getElementById('compounding_message').innerHTML = "Mandatory Compounding-Period."
      return false;
    }
    else if (compoundingpd.value) {
      document.getElementById('compounding_message').innerHTML = "";
    }
    if (!type.value) {
      document.getElementById('type_message').innerHTML = "Mandatory type of bank."
      return false;
    }
    else if (type.value) {
      document.getElementById('type_message').innerHTML = "";
    }
    if (address.value) {
      if ((address.value).length < 200) {
        document.getElementById('address_message').innerHTML = "";
      }
      else {
        document.getElementById('address_message').innerHTML = "Address is too long. Please insert 200 characters ."
        return false;
      }
    }
    if (imageData.files[0]) {
      var valid = await CheckLogo(imageData.files[0]);
      if (!valid) {
        return false;
      }
    }
    else if (!imageData.files[0]) {
      return false;
    }
    return true;
  }
  else {
    return false;
  }

}

async function IrInfoValidation() {
  if (_NEWIRTABLE_.rows.length > _MINLENIRTABLE_) {
    return true;
  }
  return false;
}

//Final function call for checking the body on front end
async function BankFormValidation() {
  //checking the validation function result 
  var bankValidity = await FormValidation();
  if (bankValidity) {
    $('#save').removeClass("save-btn");
    $('#save').removeAttr("disabled");
  }
  else {
    $('#save').addClass("save-btn");
    $('#save').attr("disabled");
  }
}


/*-------------------------------create bank with interest info starts-------------------------------*/
// create new row in Max IR table
function NewBankMaxIrRow() {
  let table = document.getElementById("newMaxIrTbody")
  let row = table.insertRow();
  var cell1 = row.insertCell(0);
  var cell2 = row.insertCell(1);
  var cell3 = row.insertCell(2);
  var cell4 = row.insertCell(3);
  cell1.setAttribute("id", "newMaxGenIr");
  cell2.setAttribute("id", "newMaxSrIr");
  cell3.setAttribute("id", "newMaxGenDur");
  cell4.setAttribute("id", "newMaxSrDur");
}
// After adding a row this function will calculate the maxIrTable datass
function newSavingData() {
  $("#newMaxIrTbody").find("tr").remove();
  if (_NEWIRTABLE_.rows.length > _MINLENIRTABLE_) {
    NewBankMaxIrRow();
    var newMaxIr = [];
    newMaxIr[0] = {
      newMaxGenIr: 0,
      newMaxSrIr: 0,
      newMaxGenDur: "",
      newMaxSrDur: ""
    }
    for (var ele = 1, row; row = _NEWIRTABLE_.rows[ele]; ele++) {
      var durationValue = row.cells[0].textContent;
      var interestValue = parseFloat(row.cells[1].textContent);
      var srInterestValue = parseFloat(row.cells[2].textContent);
      if (interestValue > newMaxIr[0].newMaxGenIr) {
        newMaxIr[0].newMaxGenIr = interestValue;
        newMaxIr[0].newMaxGenDur = durationValue;
      }
      if (srInterestValue > newMaxIr[0].newMaxSrIr) {
        newMaxIr[0].newMaxSrIr = srInterestValue;
        newMaxIr[0].newMaxSrDur = durationValue;
      }
      document.getElementById('newMaxGenIr').innerHTML = newMaxIr[0].newMaxGenIr;
      document.getElementById('newMaxSrIr').innerHTML = newMaxIr[0].newMaxSrIr;
      document.getElementById('newMaxGenDur').innerHTML = newMaxIr[0].newMaxGenDur;
      document.getElementById('newMaxSrDur').innerHTML = newMaxIr[0].newMaxSrDur;
    }
  }
}

// validates interest rate is coming or not from new bank
async function IrInfoValidation() {
  if (_NEWIRTABLE_.rows.length > _MINLENIRTABLE_) {
    return true;
  }
  return false;
}
// create bank with Interest Rate final submit
async function FinalSubmit() {
  var bankInfoValid = await FormValidation(); // validate the bank details like bank name, urls, etc
  var bankIrValid = await IrInfoValidation(); // validate the bank ir info is coming or not
  if (bankInfoValid && bankIrValid) {
    $("#submit").removeClass("final-submit-btn")
    $("#submit").removeAttr("disabled");
  }
  else {
    $("#submit").addClass("final-submit-btn");
    $("#submit").attr("disbaled");
  }
}
/*-------------------------------create bank with interest info end  -------------------------------*/


