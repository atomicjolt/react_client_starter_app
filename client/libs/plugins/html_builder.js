const build = require('../build/build');
const log = require('../build/log');

class HtmlBuilderPlugin {
  constructor(app, options) {
    this.app = app;
    this.options = options;
    this.shouldBuild = true;
  }

  buildAppParts() {
    if (!this.options.onlyPack) {
      const result = build.build(this.app);
      log.out(`Built ${result.pages.length} html pages for ${this.app.name}.`);
      log.out(`Finished building ${this.app.name}.`);
    }
  }

  apply(compiler) {
    compiler.plugin('done', () => {
      // we kick off the initial build but then handle the watching and
      // rebuilding of the html ourselves
      if (this.shouldBuild) {
        this.buildAppParts();
        this.shouldBuild = false;
      }
    });
  }
}

module.exports = HtmlBuilderPlugin;
