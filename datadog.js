const ddTrace = require("dd-trace");

/** @type {import('dd-trace').Tracer} */
const tracer = ddTrace.init({});
tracer.use("http", {
  env: process.env.NODE_ENV,
});

module.exports = tracer;
