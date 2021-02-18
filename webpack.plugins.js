const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const webpack = require('webpack');

module.exports = [
  new ForkTsCheckerWebpackPlugin({
    async: false
  }),
  new webpack.DefinePlugin({
        'process.env.FLUENTFFMPEG_COV': false
    })
];
