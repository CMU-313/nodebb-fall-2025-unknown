'use strict';

const assert = require('assert');
const posts = require('../src/posts');
const user = require('../src/user');
const topics = require('../src/topics');
const categories = require('../src/categories');

describe('Endorsement Feature', () => {
	let testUser;
	let testPost;
	let testTopic;
	let cid;

	before(async () => {
		// Create test user
		testUser = await user.create({ username: 'endorser', password: 'endorserpwd' });
		
		// Create test category
		({ cid } = await categories.create({
			name: 'Test Category',
			description: 'Test category for endorsement testing',
		}));

		// Create test topic and post
		({ topicData: testTopic, postData: testPost } = await topics.post({
			uid: testUser,
			cid: cid,
			title: 'Test Topic for Endorsement',
			content: 'This is a test post for endorsement functionality',
		}));
	});

	it('should endorse a post', async () => {
		const result = await posts.endorse(testPost.pid, testUser);
		assert.equal(result.isEndorsed, true);
		assert.equal(result.post.endorsed, true);
	});

	it('should check if post is endorsed', async () => {
		const isEndorsed = await posts.isEndorsed(testPost.pid);
		assert.equal(isEndorsed, true);
	});

	it('should unendorse a post', async () => {
		const result = await posts.unendorse(testPost.pid, testUser);
		assert.equal(result.isEndorsed, false);
		assert.equal(result.post.endorsed, false);
	});

	it('should check if post is unendorsed', async () => {
		const isEndorsed = await posts.isEndorsed(testPost.pid);
		assert.equal(isEndorsed, false);
	});

	it('should handle multiple posts endorsement check', async () => {
		// Create another post
		const { postData: testPost2 } = await topics.post({
			uid: testUser,
			cid: cid,
			title: 'Test Topic 2',
			content: 'Second test post',
		});

		// Endorse first post
		await posts.endorse(testPost.pid, testUser);
		
		// Check both posts
		const results = await posts.isEndorsed([testPost.pid, testPost2.pid]);
		assert.equal(results[0], true);  // First post endorsed
		assert.equal(results[1], false); // Second post not endorsed
	});

	it('should throw error when trying to endorse already endorsed post', async () => {
		await posts.endorse(testPost.pid, testUser);
		
		try {
			await posts.endorse(testPost.pid, testUser);
			assert.fail('Should have thrown an error');
		} catch (err) {
			assert.equal(err.message, '[[error:already-endorsed]]');
		}
	});

	it('should throw error when trying to unendorse non-endorsed post', async () => {
		await posts.unendorse(testPost.pid, testUser);
		
		try {
			await posts.unendorse(testPost.pid, testUser);
			assert.fail('Should have thrown an error');
		} catch (err) {
			assert.equal(err.message, '[[error:already-unendorsed]]');
		}
	});
});

