const path = require('path');
const fs = require('fs-extra');

// -----------------------------------------------------------------------------
// main build
// -----------------------------------------------------------------------------
function makeOutputFilePath(inputPath, outputPath, fileName, options, cb) {
  let relPath = inputPath.replace(options.rootAppsPath, ''); // build relative path for output file
  // Remove trailing html from the root of the app directory
  if (relPath.split('/')[2] === 'html') {
    relPath = relPath.replace('/html', '');
  }
  const out = path.join(outputPath, relPath, fileName);
  console.log(out)
  const dir = path.dirname(out);
  fs.mkdirs(dir, {}, () => {
    cb(out);
  });
  return out;
}

// -----------------------------------------------------------------------------
// write file
// -----------------------------------------------------------------------------
function write(inputPath, outputPath, fileName, content, options) {
  return makeOutputFilePath(inputPath, outputPath, fileName, options, (out) => {
    fs.writeFile(out, content, (err) => {
      if (err) { console.log(err); }
    });
  });
}

// -----------------------------------------------------------------------------
// copy file
// -----------------------------------------------------------------------------
function copy(inputPath, sourcePath, fileName, outputPath, options) {
  return makeOutputFilePath(inputPath, outputPath, fileName, options, (out) => {
    fs.copy(path.join(sourcePath, fileName), out, (err) => {
      if (err) { console.log(err); }
    });
  });
}

module.exports = {
  write,
  copy
};
