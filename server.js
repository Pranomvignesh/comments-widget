const express       = require('express');
const bodyParser    = require('body-parser');
const path          = require('path');
const fs            = require('fs');
const http          = require('http');
const app           = express();
const PORT          = process.argv[2] || 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', express.static(__dirname));
app.get('/', function (request, response) {
    response.send(path.join(__dirname, 'index.html'));
})
http.createServer(app).listen(PORT);
console.log(`Server running in http://localhost:${PORT}/`);