const path = require('path');

module.exports = {
  entry: './src/sidebar.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'sidebar.js',
    path: path.resolve(__dirname, 'dist-firefox'),
  },
};
