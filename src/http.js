import fs from 'fs';
import http from 'http';
import https from 'https';
import url from 'url';
import mime from 'mime';

const logPrefix = 'HTTP(s) ';

class Http {

	/**
	 * http(s) server
	 * @param config {Object} configuration
	 */
	constructor(config) {

		this._config = config;

		if (this._config.ssl) {
			this._http = https.createServer({
				key: fs.readFileSync(this._config.ssl.key, 'utf8'),
				cert: fs.readFileSync(this._config.ssl.cert, 'utf8')
			});
		} else {
			this._http = http.createServer();
		}


		this._http.on('request', (req, res) => {

			let documentRoot = __dirname + '/www';
			let urlParse = url.parse(req.url, true);
			let pathname = urlParse.pathname;
			let urlPath = (pathname.slice(-1) !== '/') ? pathname : pathname + 'index.html';
			let encoding = '';
			let file = false;

			try {
				let mimeType = mime.getType(documentRoot + urlPath);
				if (mimeType === 'text/html') {
					encoding = 'utf8';
				}
				if (!file) {
					file = fs.readFileSync(documentRoot + urlPath, encoding);
					res.setHeader("Content-Type", mimeType);
				}
				LOG.msg(logPrefix, urlPath + ' ' + mimeType);
				res.writeHead(200);
				res.end(file);
			} catch (e) {
				LOG.err(logPrefix, urlPath);
				res.writeHead(404);
				res.end()
			}
		});
	}

	getServer() {
		return this._http;
	}

	start() {
		this._http.listen(this._config.port);
		if (this._config.ssl) {
			this.startRedirect();
		}
		LOG.msg(logPrefix, 'started at port ' + this._config.port);
	}

	startRedirect() {
		http.createServer().on('request', (req, res) => {
			LOG.msg(logPrefix, req.url);
			res.writeHead(302, {
				'Location': 'https://' + req.headers.host + req.url
			});
			res.end();
		}).listen(80);
	}
}

module.exports = Http;
