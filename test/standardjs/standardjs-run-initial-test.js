/*
This test file runs StandardJS (calls npx standard) on the helper test file 
test/standardjs/standardjs-initial-test.js to verify that the expected 
lint warning is produced (among many). This test file was helped generated
by coPilot upon request.
*/
'use strict';

const { exec } = require('child_process');
const assert = require('assert');

describe('StandardJS Linting Tests', () => {
	it('should detect expected lint warning for == vs ===', function (done) {
		exec('npx standard test/standardjs/standardjs-initial-test.js', (err, stdout, stderr) => {
			try {
				// Check if stdout contains the specific "Expected '===' and instead saw '=='" message
				if (stdout.includes("Expected '===' and instead saw '=='")) {
					console.log('Specific lint warning detected as expected: == instead of ===');
					done(); // Test passes
				} else {
					console.log('Expected lint warning not detected!');
					console.log('Actual stdout:', stdout);
					console.log('Actual stderr:', stderr);
					done(new Error('Expected lint warning not found'));
				}
			} catch (error) {
				done(error);
			}
		});
	});

	it('should verify StandardJS is available and working', function (done) {
		exec('npx standard --version', (err, stdout, stderr) => {
			if (err) {
				done(new Error(`StandardJS not available: ${err.message}`));
			} else {
				console.log(`StandardJS version: ${stdout.trim()}`);
				done();
			}
		});
	});
});