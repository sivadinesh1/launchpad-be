const https = require('https');
const http = require('http');
const app = require('./app');

// var options = {
// 	key: fs.readFileSync('/etc/letsencrypt/live/demo.squapl.com/privkey.pem'),
// 	cert: fs.readFileSync('/etc/letsencrypt/live/demo.squapl.com/cert.pem'),
// 	ca: fs.readFileSync('/etc/letsencrypt/live/demo.squapl.com/chain.pem'),
// };

// var options = {
// 	key: fs.readFileSync('/etc/letsencrypt/live/launchpad.squapl.com/privkey.pem'),
// 	cert: fs.readFileSync('/etc/letsencrypt/live/launchpad.squapl.com/cert.pem'),
// 	ca: fs.readFileSync('/etc/letsencrypt/live/launchpad.squapl.com/chain.pem'),
// };

//devlopment en

//demo
// https.createServer(options, app).listen(8440);
// prod
// https.createServer(options, app).listen(8441);

// if (process.env.NODE_ENV === 'development') {
http.createServer(app).listen(5050);
// } else {
// 	var options = {
// 		key: fs.readFileSync(process.env.SSL_KEY),
// 		cert: fs.readFileSync(process.env.SSL_CERT),
// 		ca: fs.readFileSync(process.env.SSL_CHAIN),
// 	};

// 	https.createServer(options, app).listen(process.env.PORT);
// }
