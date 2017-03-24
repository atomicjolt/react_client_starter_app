const path      = require('path');
const fs        = require('fs-extra');
const _         = require('lodash');
const webpack   = require('webpack');
const nodeWatch = require('node-watch');

const file      = require('./file');
const content   = require('./content');

// Settings
const webpackConfigBuilder = require('../../config/webpack.config');
const settings             = require('../../config/settings');

const argv                 = require('minimist')(process.argv.slice(2));

const release              = argv.release;
const stage                = release ? 'production' : 'development';

const rootAppsPath         = path.join(__dirname, '../../apps');
const rootBuildPath        = stage === 'production' ? settings.prodOutput : settings.devOutput;

const options = {
  truncateSummaryAt : 1000,
  buildExtensions   : ['.html', '.htm', '.md', '.markdown'], // file types to build (others will just be copied)
  buildSuffix       : settings.buildSuffix, // Webpack build suffix. ie _bundle.js
  templateDirs      : ['layouts'],
  templateData      : {}, // Object that will be passed to every page as it is rendered
  templateMap       : {}, // Used to specify specific templates on a per file basis
  rootAppsPath
};

// -----------------------------------------------------------------------------
// run webpack to build entry points
// -----------------------------------------------------------------------------
function buildWebpackEntries(isHot) {
  return new Promise((resolve, reject) => {
    const webpackConfig = webpackConfigBuilder(stage);
    if (!isHot) {
      const bundler = webpack(webpackConfig);
      const bundle = (err, stats) => {
        if (err) {
          console.log('webpack error', err);
          reject(err);
        }
        // console.log('webpack', stats.toString({ colors: true }));
        resolve({
          webpackConfig,
          webpackStats: stats.toJson()
        });
      };
      bundler.run(bundle);
    } else {
      resolve(webpackConfig, null);
    }
  });
}

function buildHome() {
  const links = _.map(settings.apps, (appPath, appName) =>
    `<a href="/${appName}">${appName}</a>`
  );
  const home = `<html><head></head><body>${links.join('')}</body></html>`;
  file.write(path.join(rootBuildPath, 'index.html'), home);
}

// -----------------------------------------------------------------------------
// main build
// -----------------------------------------------------------------------------
function build(isHot) {
  return new Promise((resolve) => {

    // Delete everything in the output path
    fs.emptydir(rootBuildPath, () => {

      // Copy static files to build directory
      _.each(settings.apps, (app) => {
        try {
          const staticDir = `${app}/static`;
          console.log(`Copying static files in ${staticDir}`);
          fs.copySync(staticDir, rootBuildPath);
        } catch (err) {
          // No static dir. Do nothing
        }
      });

      // Build files
      console.log('Building Javascript for all applications');
      buildWebpackEntries(isHot).then((packResults) => {
        let webpackAssets;
        if (stage === 'production') {
          webpackAssets = fs.readJsonSync(`${packResults.webpackConfig.output.path}/webpack-assets.json`);
        }

        let pages = [];

        // Build html for each application
        _.each(settings.apps, (appPath, appName) => {

          console.log(`Building html for: ${appName}`);

          const inputPath = path.join(appPath, 'html');
          const templateDirs = _.map(options.templateDirs,
            templateDir => path.join(inputPath, templateDir)
          );

          pages = _.concat(pages, content.buildContents(
            inputPath,
            inputPath,
            path.join(rootBuildPath, appName),
            webpackAssets,
            stage,
            templateDirs,
            options
          ));
        });

        // Build a default home page
        buildHome();

        resolve({
          webpackConfig : packResults.webpackConfig,
          webpackAssets,
          pages,
        });
      });
    });
  });
}

// -----------------------------------------------------------------------------
// watch
// -----------------------------------------------------------------------------
function appWatch(appPath, appName, buildResults) {

  // Watch for content to change
  nodeWatch(appPath, { recursive: true }, (evt, filePath) => {

    const templateDirs = _.map(options.templateDirs,
      templateDir => path.join(appPath, 'html', templateDir)
    );

    const outputPath = path.join(rootBuildPath, appName);
    const originalInputPath = path.join(appPath, 'html');

    // Build the page
    const page = content.buildContent(
      filePath,
      templateDirs,
      buildResults.webpackAssets,
      stage,
      options
    );

    page.outputFilePath = file.write(
      content.outFilePath(page, outputPath, filePath, originalInputPath),
      page.html
    );

  });
}

function watch() {
  return new Promise((resolve) => {
    build(true).then((buildResults) => {
      _.each(settings.apps, (appPath, appName) => {
        appWatch(appPath, appName, buildResults);
      });
      resolve();
    });
  });
}

module.exports = {
  watch,
  build,
  buildWebpackEntries
};
