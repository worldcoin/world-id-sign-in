const ddTrace = require("dd-trace");

/** @type {import('dd-trace').Tracer} */
const tracer = ddTrace.init({
  logInjection: true,
});
tracer.use("http", {
  env: process.env.NODE_ENV,
});

module.exports = tracer;
