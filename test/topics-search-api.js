/**
 * Integration tests for Topic Search API Connection Layer
 * Test cases and test structure + route created with help of Cursor.
 * 
 */

'use strict';

const assert = require('assert');

const db = require('./mocks/databasemock');
const helpers = require('./helpers');
const user = require('../src/user');
const groups = require('../src/groups');
const categories = require('../src/categories');
const topics = require('../src/topics');
const privileges = require('../src/privileges');

describe('Topic Search API Connection Layer', function () {
	let jar;
	let testUser;
	let testCategory;
	const testTopics = [];

	before(async function () {
		this.timeout(30000);
		
		console.log('Setting up test user for API authentication');
		
		// Create a test user and login to get authenticated session
		const userObj = await helpers.registerUser({
			username: 'searchtestuser',
			password: 'testpass123',
			email: 'searchtest@example.com',
			gdpr_consent: true,
		});
		
		testUser = userObj.body;
		jar = userObj.jar;
		
		// Add user to registered-users group for permissions
		await groups.join('registered-users', testUser.uid);
		
		// Create test category
		testCategory = await categories.create({
			name: 'API Search Test Category',
			description: 'Category for API search testing',
		});
		
		// Give permissions to read topics
		await privileges.categories.give(['topics:read', 'read'], testCategory.cid, 'registered-users');
		
		// Create test topics with searchable titles
		const topicTitles = [
			'JavaScript Fundamentals and Basics',
			'Advanced JavaScript Programming Patterns',
			'Python Programming for Beginners',
			'React Component Development Guide',
			'Node.js Backend Development Tutorial',
			'JavaScript Testing Best Practices',
			'Python Data Analysis with Pandas',
		];
		
		for (const title of topicTitles) {
			// eslint-disable-next-line no-await-in-loop
			const topicData = await topics.post({
				uid: testUser.uid,
				cid: testCategory.cid,
				title: title,
				content: `This is a test topic about ${title}. It contains detailed information and examples.`,
			});
			testTopics.push(topicData);
		}
		
		console.log(`Test user created, authenticated, and ${testTopics.length} test topics created`);
	});

	after(async function () {
		console.log('Cleaning up test data');
		
		// Clean up test topics
		for (const topic of testTopics) {
			// eslint-disable-next-line no-await-in-loop
			await topics.delete(topic.topicData.tid);
		}
		
		// Clean up test category
		await categories.purge(testCategory.cid);
	});

	describe('API Endpoint Tests', function () {
		it('should return 400 for request without keywords', async function () {
			const { response, body } = await helpers.request('get', '/api/v3/topics/search-by-title?start=0&stop=100', {
				jar: jar,
				json: true,
			});
			
			assert.strictEqual(response.statusCode, 400);
			assert(body.status);
			assert.strictEqual(body.status.code, 'bad-request');
			console.log('Correctly rejected request without keywords');
		});

		it('should handle valid search query structure', async function () {
			const { response, body } = await helpers.request('get', '/api/v3/topics/search-by-title?keywords=javascript&start=0&stop=100&fuzzy=false', {
				jar: jar,
				json: true,
			});
			
			assert.strictEqual(response.statusCode, 200);
			assert(body.response);
			assert(body.response.topics);
			assert(Array.isArray(body.response.topics));
			assert(body.response.topics.length >= 3, 'Should find at least 3 JavaScript topics');
			console.log(`API returned ${body.response.topics.length} topics for "javascript"`);
		});

		it('should handle fuzzy search parameter', async function () {
			const { response, body } = await helpers.request('get', '/api/v3/topics/search-by-title?keywords=python&fuzzy=true&start=0&stop=100', {
				jar: jar,
				json: true,
			});
			
			assert.strictEqual(response.statusCode, 200);
			assert(body.response);
			assert(body.response.topics);
			assert(Array.isArray(body.response.topics));
			assert(body.response.topics.length >= 2, 'Should find at least 2 Python topics');
			console.log(`Fuzzy search returned ${body.response.topics.length} topics for "python"`);
		});

		it('should handle pagination parameters', async function () {
			const { response, body } = await helpers.request('get', '/api/v3/topics/search-by-title?keywords=javascript&start=0&stop=1&fuzzy=false', {
				jar: jar,
				json: true,
			});
			
			assert.strictEqual(response.statusCode, 200);
			assert(body.response);
			assert(body.response.topics);
			assert(Array.isArray(body.response.topics));
			assert(body.response.topics.length <= 2); // 0 to 1 inclusive = 2 items
			assert(body.response.topics.length >= 1, 'Should find at least 1 JavaScript topic');
			console.log(`Pagination returned ${body.response.topics.length} topics (max 2)`);
		});

		it('should return empty results for non-matching keywords', async function () {
			const { response, body } = await helpers.request('get', '/api/v3/topics/search-by-title?keywords=nonexistentkeyword12345xyz&start=0&stop=100&fuzzy=false', {
				jar: jar,
				json: true,
			});
			
			assert.strictEqual(response.statusCode, 200);
			assert(body.response);
			assert(body.response.topics);
			assert(Array.isArray(body.response.topics));
			assert.strictEqual(body.response.topics.length, 0);
			console.log('Non-matching keyword correctly returned 0 results');
		});
	});
});