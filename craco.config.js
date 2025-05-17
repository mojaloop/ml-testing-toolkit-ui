const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "http": require.resolve("stream-http"),
          "https": require.resolve("https-browserify"),
          "url": require.resolve("url/"),
          "util": require.resolve("util/"),
          "buffer": require.resolve("buffer/"),
          "process": require.resolve("process/browser.js"),
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
      },
      plugins: [
        new webpack.ProvidePlugin({
          process: 'process/browser.js',
          Buffer: ['buffer', 'Buffer'],
        }),
      ],
    }
  }
}; 