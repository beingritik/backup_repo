// Mime Types
const MIME_TYPES = {
    '.html': 'text/html',
    '.jgp': 'image/jpeg',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
};

const GetBodyData = function (req, res) {
    return new Promise((resolve, reject) => {
        try {
            let body = "";
            // listen to data sent by client
            req.on("data", (chunk) => {
                // append the string version to the body                
                body += chunk.toString();
                
            });
            // listen till the end
            req.on("end", () => {
                // send back the data
                resolve(body);
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Get the content type for a given path
const GetContentType = pathName => {
    let contentType = 'application/octet-stream';  // Set the default content type
    for (var key in MIME_TYPES) { // Set the contentType based on mime type
        if (MIME_TYPES.hasOwnProperty(key)) {
            if (pathName.indexOf(key) > -1) {
                contentType = MIME_TYPES[key];
            }
        }
    }
    return contentType;
};

//Get the data of the formdata stream when an image is sent over Ajax Request., returns an object
async function ExtractFormData(req,body) {
    try {
      let formdata = {};
      let imgData;
      const boundary = req.headers['content-type'].split('; ')[1].split('=')[1];
      const parts = body.split(`--${boundary}`);
      for (let i = 1; i < parts.length - 1; i++) {
        const content = parts[i].split('\r\n\r\n')[1].slice(0, -2);
        const headers = parts[i].split('\r\n').slice(1, -2);
        const name = headers[0].split('; ')[1].split('=')[1].replace(/"/g, '');
        formdata[name] = content;
      }
      return formdata;
    }
    catch (err) {
      LOG.logError(`Image extraction failed from the request.==${err.message}`)
      ERRHANDLER.APIerr(res)
      return err;
    }
  }


module.exports = { GetBodyData, GetContentType, ExtractFormData }