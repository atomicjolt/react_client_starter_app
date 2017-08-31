const fs = require('fs-extra');
const _ = require('lodash');
const webpack = require('webpack');

const settings = require('../../config/settings');
const build = require('./build');
const log = require('./log');
const webpackConfigBuilder = require('../../config/webpack.config');

// -----------------------------------------------------------------------------
// Build a single app
// -----------------------------------------------------------------------------
function buildAppParts(app, onlyPack) {
  if (!onlyPack) {
    const result = build.build(app);
    log.out(`Built ${result.pages.length} html pages for ${app.name}.`);
    log.out(`Finished building ${app.name}.`);
  }
  return app;
}

// -----------------------------------------------------------------------------
// Build a single app
// -----------------------------------------------------------------------------
function buildApp(appName, options) {
  const apps = settings.apps(options);
  const app = _.find(apps, (e, name) => appName === name);
  const webpackCompiler = webpack(webpackConfigBuilder(app, options));

  if (!options.noClean) {
    fs.emptyDirSync(app.outputPath);
  }

  return {
    app,
    webpackCompiler,
  };
}

// -----------------------------------------------------------------------------
// Build all apps
// -----------------------------------------------------------------------------
function buildApps(options) {
  const apps = settings.apps(options);

  // Clean dirs
  if (!options.noClean) {
    _.each(apps, (app) => {
      fs.emptyDirSync(app.outputPath);
    });
  }

  const webpackConfigs = _.map(apps, app => webpackConfigBuilder(app, options));
  const webpackCompiler = webpack(webpackConfigs);

  return {
    apps,
    webpackCompiler,
  };
}

module.exports = {
  buildApp,
  buildApps
};
