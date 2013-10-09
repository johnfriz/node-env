var connect = require('fh-connect'),
  http = require("http"),
  url = require("url"),
  path = require("path"),
  fs = require("fs"),
  mustache = require("./lib/mustache"),
  keyprocessor = require("./lib/keyprocessor"),
  sysinfo = require('./lib/sysinfo'),
  port = process.env.PORT || 8888;

module.exports = connect().use(connect.bodyParser()).use(
  connect.router(function (app) {
    // For CORS Requests - responds with the headers a browser likes to see so that CORs can function.
    app.get('/', function (request, response) {

      var uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd(), uri);

      path.exists(filename, function (exists) {
        if (!exists) {
          response.writeHead(404, {
            "Content-Type": "text/plain"
          });
          response.write("404 Not Found\n");
          response.end();
          return;
        }

        if (uri == "/") {
          var t = path.join(filename, '/index.html');
          var v = {
            env: [],
            sys: sysinfo.sysInfo()
          };
          for (var item in process.env) {
            v['env'].push({
              'key': item,
              'value': keyprocessor.procKey(item, process.env[item])
            });
          }

          console.log('t = ' + t);

          fs.readFile(t, 'utf8', function (err, data) {
            console.log('err:',err, ' : data:', data);
            var html = mustache.to_html(data, v);
            response.writeHead(200);
            response.write(html, "binary");
            response.end()
            return;
          });
        }

        if (fs.statSync(filename).isDirectory()) filename += '/index.html';

        fs.readFile(filename, "binary", function (err, file) {
          if (err) {
            response.writeHead(500, {
              "Content-Type": "text/plain"
            });
            response.write(err + "\n");
            response.end();
            return;
          }

          response.writeHead(200);
          response.write(file, "binary");
          response.end();
        });
      });
    });
  })
);
