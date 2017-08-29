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
function buildAppParts(app, webpackCompiler, onlyPack) {
  if (onlyPack) {
    const buildPromise = build.buildWebpackEntries(app, webpackCompiler);
    buildPromise.then(() => {
      log.out(`Finished Javascript for ${app.name}`);
    });
    return buildPromise;
  }
  const buildPromise = build.build(app, webpackCompiler);
  buildPromise.then((result) => {
    log.out(`Finished Javascript for ${app.name}.`);
    log.out(`Built ${result.pages.length} pages.`);
  });
  return buildPromise;
}

// -----------------------------------------------------------------------------
// Build a single app
// -----------------------------------------------------------------------------
function buildApp(appName, options) {
  const apps = settings.apps(options);
  const app = _.find(apps, (e, name) => appName === name);
  const webpackCompiler = webpack(webpackConfigBuilder(app));

  if (!options.noClean) {
    fs.emptyDirSync(app.outputPath);
  }
  return {
    app,
    buildPromise: buildAppParts(app, webpackCompiler, options.onlyPack),
    webpackCompiler,
  };
}

// -----------------------------------------------------------------------------
// Build apps in order one at a time
// -----------------------------------------------------------------------------
function buildAppWait(app, webpackCompiler, options) {
  return new Promise((resolve) => {
    const buildPromise = buildAppParts(app, webpackCompiler, options.onlyPack);
    buildPromise.then(() => {
      resolve({
        app,
        buildPromise
      });
    });
  });
}

// -----------------------------------------------------------------------------
// Build all apps
// -----------------------------------------------------------------------------
async function buildApps(options) {
  const apps = settings.apps(options);

  const webpackConfigs = _.map(apps, app => webpackConfigBuilder(app));
  const webpackCompiler = webpack(webpackConfigs);

  // Clean dirs
  if (!options.noClean) {
    _.each(apps, (app) => {
      fs.emptyDirSync(app.outputPath);
    });
  }

  if (options.order) {
    const results = [];
    for (let i = 0; i < options.order.length; i += 1) {
      const appName = options.order[i];
      results.push(await buildAppWait(apps[appName], webpackCompiler, options));
    }
    return results;
  }

  const builtApps = _.map(apps, app => ({
    app,
    buildPromise: buildAppParts(app, webpackCompiler, options.onlyPack),
  }));

  return {
    apps: builtApps,
    webpackCompiler,
  };

}

module.exports = {
  buildApp,
  buildApps
};
