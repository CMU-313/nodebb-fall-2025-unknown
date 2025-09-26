'use strict';

const assert = require('assert');

const db = require('./mocks/databasemock');
const posts = require('../src/posts');
const user = require('../src/user');
const topics = require('../src/topics');
const categories = require('../src/categories');

describe('Posts.getPostsByTimeRange', function () {
	let testUser;
	let testCategory;
	let testTopic;
	let testPosts = [];
		
	async function createTestPost(content, timestamp, uid = testUser.uid, tid = testTopic.tid, cid = testCategory.cid) {
		const postData = {
			uid: uid,
			tid: tid,
			content: content,
			timestamp: timestamp,
		};
		
		const pid = await db.incrObjectField('global', 'nextPid');
		await db.setObject(`post:${pid}`, {
			pid: pid,
			uid: uid,
			tid: tid,
			content: content,
			timestamp: timestamp,
		});
		
		await db.sortedSetAdd('posts:pid', timestamp, pid);
		await db.sortedSetAdd(`cid:${cid}:pids`, timestamp, pid);
		await db.sortedSetAdd(`tid:${tid}:posts`, timestamp, pid);
		
		await db.setObjectField(`post:${pid}`, 'cid', cid);
		
		return { pid, uid, tid, cid, content, timestamp };
	}
	
	before(async function () {
		console.log('Setting up test data');
		
		const testUserUid = await user.create({
			username: 'testuser',
			email: 'test@example.com',
			password: 'testpass',
		});
		testUser = { uid: testUserUid };
		
		testCategory = await categories.create({
			name: 'Test Category',
			description: 'Test category for time range testing',
		});
		
		const privileges = require('../src/privileges');
		await privileges.categories.give(['topics:read', 'read'], testCategory.cid, 'registered-users');
		
		const groups = require('../src/groups');
		await groups.join('registered-users', testUser.uid);
		
		const isInGroup = await groups.isMember(testUser.uid, 'registered-users');
		const canRead = await privileges.categories.can('topics:read', testCategory.cid, testUser.uid);
		
		const testTopicTid = await topics.create({
			uid: testUser.uid,
			cid: testCategory.cid,
			title: 'Test Topic for Time Range',
			content: 'This is a test topic',
		});
		testTopic = { tid: testTopicTid };
		
		const now = Date.now();
		const oneHourAgo = now - (60 * 60 * 1000);
		const twoHoursAgo = now - (2 * 60 * 60 * 1000);
		const threeHoursAgo = now - (3 * 60 * 60 * 1000);
		const fourHoursAgo = now - (4 * 60 * 60 * 1000);
		
		testPosts = [
			await createTestPost('Post from 1 hour ago', oneHourAgo),
			await createTestPost('Post from 2 hours ago', twoHoursAgo),
			await createTestPost('Post from 3 hours ago', threeHoursAgo),
			await createTestPost('Post from 4 hours ago', fourHoursAgo, testUser.uid, testTopic.tid, 2),
		];
	});
	
	after(async function () {
		console.log('Cleaning up test data');
		
		for (const post of testPosts) {
			db.delete(`post:${post.pid}`);
			db.sortedSetRemove('posts:pid', post.pid);
			db.sortedSetRemove(`cid:${testCategory.cid}:pids`, post.pid);
			db.sortedSetRemove(`tid:${testTopic.tid}:posts`, post.pid);
		}
		
		await topics.delete(testTopic.tid);
		await categories.purge(testCategory.cid);
		// await user.delete(testUser.uid);
	});
	
	describe('Time range filtering', function () {
		it('should return posts within a specific time range', async function () {
			const now = Date.now();
			// start time = 2.5 hours ago 
			// end time = 0.5 hours ago
			const startTime = now - (2.5 * 60 * 60 * 1000); 
			const endTime = now - (0.5 * 60 * 60 * 1000);   
			
			const result = await posts.getPostsByTimeRange(
				testUser.uid,
				startTime,
				endTime,
				0,
				10,
				testCategory.cid
			);
			
			console.log('Test result:', { 
				resultLength: result.length, 
				startTime: new Date(startTime).toISOString(), 
				endTime: new Date(endTime).toISOString(), 
			});
			
			assert(Array.isArray(result), 'Result should be an array');
			assert(result.length >= 2, 'Should return at least 2 posts');
	
			for (const post of result) {
				assert(post.timestamp >= startTime, 'Post timestamp should be >= startTime');
				assert(post.timestamp <= endTime, 'Post timestamp should be <= endTime');
			}
			console.log('Test passed: should return posts within a specific time range');
		});
		
		it('should work with string datetime values', async function () {
			const startTime = new Date(Date.now() - (2.5 * 60 * 60 * 1000)).toISOString();
			const endTime = new Date(Date.now() - (0.5 * 60 * 60 * 1000)).toISOString();
			
			const result = await posts.getPostsByTimeRange(
				testUser.uid,
				startTime,
				endTime,
				0,
				10,
				testCategory.cid
			);
			
			assert(Array.isArray(result), 'Result should be an array');
			assert(result.length >= 2, 'Should return at least 2 posts');
			console.log('Test passed: should work with string datetime values');
		});
		
		it('should work with Date objects', async function () {
			const startTime = new Date(Date.now() - (2.5 * 60 * 60 * 1000));
			const endTime = new Date(Date.now() - (0.5 * 60 * 60 * 1000));
			
			const result = await posts.getPostsByTimeRange(
				testUser.uid,
				startTime,
				endTime,
				0,
				10,
				testCategory.cid
			);
			
			assert(Array.isArray(result), 'Result should be an array');
			assert(result.length >= 2, 'Should return at least 2 posts');
			console.log('Test passed: should work with Date objects');
		});
		
		it('should return empty array when no posts in time range', async function () {
			const now = Date.now();
			// start time = 10 hrs ago 
			// end time = 5 hrs ago
			const startTime = now - (10 * 60 * 60 * 1000); 
			const endTime = now - (5 * 60 * 60 * 1000);   
			
			const result = await posts.getPostsByTimeRange(
				testUser.uid,
				startTime,
				endTime,
				0,
				10,
				testCategory.cid
			);
			
			assert(Array.isArray(result), 'Result should be an array');
			assert(result.length === 0, 'Should return empty array when no posts in range');
			console.log('Test passed: should return empty array when no posts in time range');
		});
			
	});
	
	describe('Error handling', function () {
		it('should throw error for invalid time range (start >= end)', async function () {
			const now = Date.now();
			// start time = 1 hr ago 
			// end time = 2 hrs ago
			const startTime = now - (1 * 60 * 60 * 1000);
			const endTime = now - (2 * 60 * 60 * 1000);
			
			try {
				await posts.getPostsByTimeRange(
					testUser.uid,
					startTime,
					endTime,
					0,
					10,
					testCategory.cid
				);
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert(error.message.includes('invalid-time-range'), 'Should throw invalid time range error');
			}
			console.log('Test passed: should throw error for invalid time range (start >= end)');
		});
		
		it('should throw error for invalid date format', async function () {
			try {
				await posts.getPostsByTimeRange(
					testUser.uid,
					'invalid-date',
					'2023-01-01',
					0,
					10,
					testCategory.cid
				);
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert(error.message.includes('invalid-date-format'), 'Should throw invalid date format error');
			}
			console.log('Test passed: should throw error for invalid date format');
		});
		
		it('should throw error for invalid time format', async function () {
			try {
				await posts.getPostsByTimeRange(
					testUser.uid,
					{ invalid: 'object' },
					Date.now(),
					0,
					10,
					testCategory.cid
				);
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert(error.message.includes('invalid-time-format'), 'Should throw invalid time format error');
			}
			console.log('Test passed: should throw error for invalid time format');
		});
	});
	
	describe('Category filtering', function () {
		it('should filter posts by category when cid is provided', async function () {
			const now = Date.now();
			const startTime = now - (5 * 60 * 60 * 1000);
			const endTime = now + (1 * 60 * 60 * 1000);
			
			const result = await posts.getPostsByTimeRange(
				testUser.uid,
				startTime,
				endTime,
				0,
				10,
				testCategory.cid
			);
			
			assert(Array.isArray(result), 'Result should be an array');

			for (const post of result) {
				assert(post.topic && post.topic.cid === testCategory.cid, 'All posts should be from test category');
			}
			console.log('Test passed: should filter posts by category when cid is provided');
		});
		
		it('should use global posts set when cid is -1', async function () {
			const now = Date.now();
			const startTime = now - (5 * 60 * 60 * 1000);
			const endTime = now + (1 * 60 * 60 * 1000);
			
			const result = await posts.getPostsByTimeRange(
				testUser.uid,
				startTime,
				endTime,
				0,
				10,
				-1
			);
			
			assert(Array.isArray(result), 'Result should be an array');
			console.log('Test passed: should use global posts set when cid is -1');
		});
	});
});

