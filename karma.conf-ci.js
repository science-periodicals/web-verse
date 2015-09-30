
var fs = require('fs')
  , localConf = require('./karma.conf')
;

// karma for CI
module.exports = function (config) {
  // Use ENV vars on Travis and sauce.json locally to get credentials
  if (!process.env.SAUCE_USERNAME) {
    if (!fs.existsSync('sauce.json')) {
      console.log('Create a sauce.json with your credentials based on the sauce-sample.json file.');
      process.exit(1);
    }
    else {
      process.env.SAUCE_USERNAME = require('./sauce.json').username;
      process.env.SAUCE_ACCESS_KEY = require('./sauce.json').accessKey;
    }
  }
  // XXX need to add quite a few more here
  // Browsers to run on Sauce Labs
  var customLaunchers = {
    // chrome, two versions back
    'sl_chrome-latest': {
      base:         'SauceLabs',
      browserName:  'chrome',
      version:      '45'
    },
    'sl_chrome-1': {
      base:         'SauceLabs',
      browserName:  'chrome',
      version:      '44'
    },
    'sl_chrome-2': {
      base:         'SauceLabs',
      browserName:  'chrome',
      version:      '43'
    },

    // IE, back to IE9
    'sl_ie-latest': {
      base:         'SauceLabs',
      browserName:  'microsoftedge',
    },
    'sl_ie-11': {
      base:         'SauceLabs',
      browserName:  'internet explorer',
      version:      '11'
    },
    'sl_ie-10': {
      base:         'SauceLabs',
      browserName:  'internet explorer',
      version:      '10'
    },
    'sl_ie-9': {
      base:         'SauceLabs',
      browserName:  'internet explorer',
      version:      '9'
    },

    // Firefox, two versions back
    'sl_firefox-latest': {
      base:         'SauceLabs',
      browserName:  'firefox',
      version:      '41'
    },
    'sl_firefox-1': {
      base:         'SauceLabs',
      browserName:  'firefox',
      version:      '40'
    },
    'sl_firefox-2': {
      base:         'SauceLabs',
      browserName:  'firefox',
      version:      '39'
    },

    // Safari, desktop, two versions back
    'sl_safari-latest': {
      base:         'SauceLabs',
      browserName:  'safari',
      version:      '8'
    },
    'sl_safari-1': {
      base:         'SauceLabs',
      browserName:  'safari',
      version:      '7'
    },
    'sl_safari-2': {
      base:         'SauceLabs',
      browserName:  'safari',
      version:      '6'
    },

    // iOS, two versions back
    'sl_ios-latest': {
      base:         'SauceLabs',
      browserName:  'iphone',
      version:      '8'
    },
    'sl_ios-1': {
      base:         'SauceLabs',
      browserName:  'iphone',
      version:      '7'
    },
    'sl_ios-2': {
      base:         'SauceLabs',
      browserName:  'iphone',
      version:      '6'
    },

    // Android, down to 4.3
    'sl_android-latest': {
      base:         'SauceLabs',
      browserName:  'android',
      version:      '5.1'
    },
    'sl_android-1': {
      base:         'SauceLabs',
      browserName:  'android',
      version:      '4.3'
    },
    'sl_android-2': {
      base:         'SauceLabs',
      browserName:  'android',
      version:      '4.2'
    }
  };

  localConf(config);
  config.set({
    sauceLabs: {
      testName: 'Web Verse'
    },
    captureTimeout: 120000,
    customLaunchers: customLaunchers,
    reporters: ['dots', 'saucelabs', 'coverage', 'coveralls'],
    coverageReporter: {
      type: 'lcov',
      dir:  'coverage/'
    },

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: Object.keys(customLaunchers),
    singleRun: true
  });
};
