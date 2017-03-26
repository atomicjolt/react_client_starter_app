const fs = require('fs-extra');
const _ = require('lodash');
const path = require('path');

const settings = require('../../config/settings');
const build = require('./index');
const file = require('./file');

let launchPort = settings.hotPort;

// -----------------------------------------------------------------------------
// Iterate through all applications calling the callback with the webpackOptions
// -----------------------------------------------------------------------------
function iterateApps(stage, cb) {
  _.each(settings.apps, (appPath, appName) => {
    const webpackOptions = {
      stage,
      appName,
      appPath,
      buildSuffix: settings.buildSuffix,
      prodOutput: path.join(settings.prodOutput, appName),
      prodAssetsUrl: settings.prodAssetsUrl,
      devOutput: path.join(settings.devOutput, appName),
      devAssetsUrl: settings.devAssetsUrl,
      devRelativeOutput: settings.devRelativeOutput
    };
    cb(webpackOptions);
  });

}

// -----------------------------------------------------------------------------
// build a home page that links to each application
// -----------------------------------------------------------------------------
function buildHome(rootBuildPath) {
  console.log('Building default home page with links to all apps');
  const links = _.map(settings.apps, (appPath, appName) =>
    `<a href="/${appName}">${appName}</a>`
  );
  const home = `<html><head></head><body>${links.join('')}</body></html>`;
  file.write(path.join(rootBuildPath, 'index.html'), home);
}

// -----------------------------------------------------------------------------
// Wrapper to provide values for launching a webpack server
// -----------------------------------------------------------------------------
function launchHotWrapper(launchCallback, webpackOptions) {
  const servePath = path.join(settings.devOutput, webpackOptions.appName);
  launchCallback(webpackOptions, launchPort, servePath);
  launchPort += 1;
}

// -----------------------------------------------------------------------------
// Build all apps
// -----------------------------------------------------------------------------
function buildApps(stage, onlyjs, launchCallback) {

  const rootBuildPath = stage === 'production' ? settings.prodOutput : settings.devOutput;

  // Delete everything in the output path
  fs.emptydir(rootBuildPath, () => {

    iterateApps(stage, (webpackOptions) => {

      if (onlyjs) {
        build.buildWebpackEntries(webpackOptions).then(() => {
          console.log('Done building Javascript.');
        });
      } else {
        build.build(rootBuildPath, webpackOptions, settings.htmlOptions).then((result) => {
          console.log(`Done building Javascript and ${result.pages.length} pages.`);
        });
      }

      if (launchCallback) {
        launchHotWrapper(launchCallback, webpackOptions);
      }

    });

    if (!onlyjs) {
      buildHome(rootBuildPath);
    }

  });
}

module.exports = {
  buildApps
};
