'use strict';

// This file is only used to test depcheck detection for a specific dependency.
// By default, the require and usage are commented out so depcheck should report
// the dependency as unused.

// To mark the dependency as USED (so depcheck will NOT flag it):
// 1) Uncomment the two lines below
// 2) Run `depcheck` and check that the package is no longer listed under "Unused dependencies"
// 3) Re-comment the lines to restore the "unused" state.

// Example toggles for the 'compare-versions' package (one of the unused deps from your list):

// const compareVersions = require('compare-versions');
// console.log('compare-versions test:', compareVersions('1.2.0', '1.3.0'));

module.exports = function depcheckToggle() {
	// No-op. Uncomment the require/console.log above to make this file actually use the dependency.
	return 'depcheck-toggle';
};
