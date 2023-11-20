const FS = require('fs');
const path = require('path');

const GetAsset = (req, res, pathName, responseContentType) => {
    res.setHeader('Content-Type', responseContentType);
    pathName = pathName.replaceAll("%20", " ");
    FS.readFile(path.join(__dirname,`../${pathName}`), (error, data) => {
        if (!error) {
            res.writeHead(200);
            res.end(data);
        } else {
            console.log(error);
            res.writeHead(404);
            res.end('404 - File Not Found');
        }
    });
}

module.exports = {GetAsset};