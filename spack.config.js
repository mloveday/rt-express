const { config } = require("@swc/core/spack");

module.exports = config({
  mode: "production",
  entry: {
    web: __dirname + '/src/react/index.tsx',
  },
  output: {
    path: __dirname + '/dist',
  }
});
