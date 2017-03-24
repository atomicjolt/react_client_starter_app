const build = require('./libs/build');

build.build(false).then((result) => {
  console.log(`Done building Javascript and ${result.pages.length} pages.`);
});
