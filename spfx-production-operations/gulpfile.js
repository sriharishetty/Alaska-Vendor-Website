'use strict';

const build = require('@microsoft/sp-build-web');

build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

build.configureWebpack.mergeConfig({
  additionalConfiguration: (generatedConfiguration) => {
    generatedConfiguration.resolve = generatedConfiguration.resolve || {};
    const existingExtensions = generatedConfiguration.resolve.extensions || ['.ts', '.tsx', '.js'];
    for (const ext of ['.jsx', '.js', '.json']) {
      if (!existingExtensions.includes(ext)) {
        existingExtensions.push(ext);
      }
    }
    generatedConfiguration.resolve.extensions = existingExtensions;
    return generatedConfiguration;
  }
});

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);
  result.set('serve', result.get('serve-deprecated'));
  return result;
};

build.initialize(require('gulp'));

