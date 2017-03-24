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
            rootBuildPath,
            webpackAssets,
            stage,
            templateDirs,
            options
          ));
        });

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
function watch() {
  return new Promise((resolve) => {
    build(true).then((buildResults) => {

      // Watch content
      nodeWatch(rootAppsPath, (filePath) => {

        const mainApp = _.find(settings.apps, app => _.include(filePath, app));
        const templateDirs = _.map(options.templateDirs,
          templateDir => path.join(mainApp, 'html', templateDir)
        );

        // Build the page
        const page = content.buildContent(
          filePath,
          templateDirs,
          buildResults.webpackAssets,
          stage,
          options
        );
        page.outputFilePath = file.write(
          buildResults.inputPath,
          rootBuildPath,
          path.basename(filePath),
          page.html,
          options
        );
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
