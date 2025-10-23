/* 
This helper test file exists to demonstrate that StandardJS is installed and
working. It intentionally contains a style warning for demonstration.
test/standardjs/standardjs-run-initial-test.js will call npx standard on this
file to ensure that the expected error is returned by standardJS. 
*/

const foo = 1 == '1'; // intentional '==' instead of '==='

function greet(name) {
	console.log('Hello, ' + name);
}

greet('StandardJS Test');
