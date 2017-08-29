const fs = require('fs-extra');
const _ = require('lodash');
const nodeWatch = require('node-watch');
const exec = require('child_process').exec;

const content = require('./content');
const webpackUtils = require('./webpack_utils');
const log = require('./log');

// Settings

// -----------------------------------------------------------------------------
// run webpack to build entries
// -----------------------------------------------------------------------------
function buildWebpackEntries(app, webpackCompiler) {
  return new Promise((resolve, reject) => {
    const bundle = (err, stats) => {
      if (err) {
        log.error(`webpack error: ${err}`);
        reject(err);
      }
      // log.out(`webpack: ${stats.toString({ colors: true })}`);
      resolve({
        webpackStats: stats.toJson()
      });
    };
    webpackCompiler.run(bundle);
  });
}

// -----------------------------------------------------------------------------
// copy over static files to build directory
// -----------------------------------------------------------------------------
function buildStatic(app) {
  log.out(`Copying static files in ${app.staticPath}`);
  exec(`cp -r ${app.staticPath}/. ${app.outputPath}`);
}

// -----------------------------------------------------------------------------
// watchStatic
// Used to copy over static files if they change
// -----------------------------------------------------------------------------
function watchStatic(app) {
  log.out(`Watching static files in ${app.staticPath}`);
  nodeWatch(app.staticPath, { recursive: true }, (evt, filePath) => {
    log.out(`Change in static file ${filePath}`);
    fs.copySync(filePath, app.outputPath);
  });
}

// -----------------------------------------------------------------------------
// watchHtml
// Used to rebuild html or templates if files change.
// -----------------------------------------------------------------------------
function watchHtml(webpackAssets, app) {
  log.out(`Watching html files in ${app.htmlPath}`);
  nodeWatch(app.htmlPath, { recursive: true }, (evt, fullInputPath) => {
    log.out(`Change in html file ${fullInputPath}`);
    content.writeContent(
      fullInputPath,
      webpackAssets,
      app);
  });
}

function buildHtml(app, webpackAssets) {
  const pages = content.buildContents(
    app.htmlPath,
    app,
    webpackAssets
  );

  if (app.stage === 'hot' && fs.existsSync(app.htmlPath)) {
    watchHtml(webpackAssets, app);
  }

  return pages;
}

// -----------------------------------------------------------------------------
// main build
// -----------------------------------------------------------------------------
function build(app, webpackCompiler) {

  return new Promise((resolve) => {

    if (fs.existsSync(app.staticPath)) {
      // Copy static files to build directory
      buildStatic(app);
      if (app.stage === 'hot') {
        watchStatic(app);
      }
    }

    // Webpack build
    log.out(`Webpacking ${app.name}`);

    buildWebpackEntries(app, webpackCompiler).then((packResults) => {

      _.each(packResults.webpackStats.errors, (error) => {
        log.error(error);
      });

      const webpackAssets = webpackUtils.loadWebpackAssets(app);

      // Build html
      log.out(`Building html for ${app.name}`);
      const pages = buildHtml(app, webpackAssets);

      resolve({
        app,
        webpackConfig : packResults.webpackConfig,
        webpackAssets,
        pages,
      });
    });

  });
}

module.exports = {
  build,
  buildHtml,
  buildWebpackEntries
};
