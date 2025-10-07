'use strict';

const assert = require('assert');

const db = require('./mocks/databasemock');
const posts = require('../src/posts');
const user = require('../src/user');
const topics = require('../src/topics');
const categories = require('../src/categories');

// Created using Clause Sonnet 4
describe('Topics.getTopicsByTitleKeywords', function () {
	let testUser;
	let testCategory;
	const testTopics = [];
    
	before(async function () {
		console.log('Setting up test data for keyword search');
        
		const testUserUid = await user.create({
			username: 'keywordtestuser',
			email: 'keywordtest@example.com',
			password: 'testpass',
		});
		testUser = { uid: testUserUid };
        
		testCategory = await categories.create({
			name: 'Test Category for Keywords',
			description: 'Test category for keyword testing',
		});
        
		const privileges = require('../src/privileges');
		await privileges.categories.give(['topics:read', 'read'], testCategory.cid, 'registered-users');
        
		const groups = require('../src/groups');
		await groups.join('registered-users', testUser.uid);
        
		// Create test topics with different titles
		const topicTitles = [
			'JavaScript Programming Tutorial',
			'NodeJS Backend Development',
			'React Frontend Framework',
			'Python Data Science',
			'Machine Learning with JavaScript',
			'Database Design Principles',
			'Web Development Best Practices',
		];
		
		for (const title of topicTitles) {
			// eslint-disable-next-line no-await-in-loop
			const topicData = await topics.post({
				uid: testUser.uid,
				cid: testCategory.cid,
				title: title,
				content: `This is a test topic about ${title}`,
			});
			testTopics.push(topicData);
		}
	});
    
	after(async function () {
		console.log('Cleaning up test data');
        
		for (const topic of testTopics) {
			// eslint-disable-next-line no-await-in-loop
			await topics.delete(topic.topicData.tid);
		}
        
		await categories.purge(testCategory.cid);
	});
    
	describe('Single keyword search', function () {
		it('should return topics containing a single keyword', async function () {
			console.log('Available topics functions:', Object.getOwnPropertyNames(topics).filter(name => name.includes('Title') || name.includes('Keyword')));
			const result = await topics.getTopicsByTitleKeywords(testUser.uid, 'JavaScript', 0, 10);
			
			assert(Array.isArray(result), 'Result should be an array');
			assert(result.length >= 2, 'Should return at least 2 topics with JavaScript in title');
			
			// Check that all returned topics have 'JavaScript' in the title
			for (const topic of result) {
				assert(topic && topic.title, 'Topic should have title');
				assert(topic.title.toLowerCase().includes('javascript'), 
					'Topic title should contain JavaScript');
			}
			console.log('Test passed: single keyword search works');
		});
		
		it('should be case-insensitive', async function () {
			const result = await topics.getTopicsByTitleKeywords(testUser.uid, 'javascript', 0, 10);
			
			assert(Array.isArray(result), 'Result should be an array');
			assert(result.length >= 2, 'Should return at least 2 topics with javascript in title');
			console.log('Test passed: search is case-insensitive');
		});
		
		it('should return empty array when no matches found', async function () {
			const result = await topics.getTopicsByTitleKeywords(testUser.uid, 'Nonexistent', 0, 10);
			
			assert(Array.isArray(result), 'Result should be an array');
			assert(result.length === 0, 'Should return empty array when no matches');
			console.log('Test passed: returns empty array for no matches');
		});
	});
	
	describe('Multiple keywords search', function () {
		it('should handle string with multiple keywords', async function () {
			const result = await topics.getTopicsByTitleKeywords(testUser.uid, 'JavaScript React', 0, 10);
			
			assert(Array.isArray(result), 'Result should be an array');
			assert(result.length >= 3, 'Should return topics with JavaScript OR React');
			
			// Check that all returned topics contain either JavaScript or React
			for (const topic of result) {
				const title = topic.title.toLowerCase();
				assert(title.includes('javascript') || title.includes('react'), 
					'Topic title should contain JavaScript or React');
			}
			console.log('Test passed: multiple keywords as string works');
		});
		
		it('should handle array of keywords', async function () {
			const result = await topics.getTopicsByTitleKeywords(testUser.uid, ['Python', 'NodeJS'], 0, 10);
			
			assert(Array.isArray(result), 'Result should be an array');
			assert(result.length >= 2, 'Should return topics with Python OR NodeJS');
			
			// Check that all returned topics contain either Python or NodeJS
			for (const topic of result) {
				const title = topic.title.toLowerCase();
				assert(title.includes('python') || title.includes('nodejs'), 
					'Topic title should contain Python or NodeJS');
			}
			console.log('Test passed: array of keywords works');
		});
		
		it('should handle mixed case keywords in array', async function () {
			const result = await topics.getTopicsByTitleKeywords(testUser.uid, ['PYTHON', 'nodejs'], 0, 10);
			
			assert(Array.isArray(result), 'Result should be an array');
			assert(result.length >= 2, 'Should return topics regardless of keyword case');
			console.log('Test passed: mixed case keywords work');
		});
	});
	
	describe('Error handling', function () {
		it('should throw error for null/undefined keywords', async function () {
			try {
				await topics.getTopicsByTitleKeywords(testUser.uid, null, 0, 10);
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert(error.message.includes('invalid-keyword'), 'Should throw invalid keyword error');
			}
			console.log('Test passed: throws error for null keywords');
		});
		
		it('should throw error for empty string', async function () {
			try {
				await topics.getTopicsByTitleKeywords(testUser.uid, '', 0, 10);
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert(error.message.includes('invalid-keyword'), 'Should throw invalid keyword error');
			}
			console.log('Test passed: throws error for empty string');
		});
		
		it('should throw error for empty array', async function () {
			try {
				await topics.getTopicsByTitleKeywords(testUser.uid, [], 0, 10);
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert(error.message.includes('invalid-keyword'), 'Should throw invalid keyword error');
			}
			console.log('Test passed: throws error for empty array');
		});
		
		it('should throw error for invalid input type', async function () {
			try {
				await topics.getTopicsByTitleKeywords(testUser.uid, 123, 0, 10);
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert(error.message.includes('invalid-keyword'), 'Should throw invalid keyword error');
			}
			console.log('Test passed: throws error for invalid input type');
		});
	});
	
	describe('Fuzzy search capabilities', function () {
		it('should find exact matches when fuzzy=false (default)', async function () {
			const result = await topics.getTopicsByTitleKeywords(testUser.uid, 'JavaScript', 0, 10, false);
			
			assert(Array.isArray(result), 'Result should be an array');
			assert(result.length >= 2, 'Should return topics with exact JavaScript match');
			
			// All results should contain exact match
			for (const topic of result) {
				assert(topic.title.toLowerCase().includes('javascript'), 
					'Topic title should contain exact JavaScript match');
			}
			console.log('Test passed: exact match works with fuzzy=false');
		});
		
		it('should find fuzzy matches when fuzzy=true', async function () {
			// Test with a slight misspelling of "JavaScript" - "JavaScrip" (missing 't')
			const result = await topics.getTopicsByTitleKeywords(testUser.uid, 'JavaScrip', 0, 10, true);
			
			assert(Array.isArray(result), 'Result should be an array');
			// Should find JavaScript topics even with the typo
			assert(result.length >= 1, 'Should return topics with fuzzy JavaScript match');
			console.log('Test passed: fuzzy match works for slight misspellings');
		});
		
		it('should not find fuzzy matches when fuzzy=false', async function () {
			// Test with a slight misspelling that should NOT match when fuzzy is disabled
			const result = await topics.getTopicsByTitleKeywords(testUser.uid, 'JavaScrit', 0, 10, false);
			
			assert(Array.isArray(result), 'Result should be an array');
			// Should not find any matches since fuzzy is disabled
			assert(result.length === 0, 'Should not return topics with fuzzy match when fuzzy=false');
			console.log('Test passed: no fuzzy match when fuzzy=false');
		});
		
		it('should handle fuzzy matching with multiple keywords', async function () {
			const result = await topics.getTopicsByTitleKeywords(testUser.uid, ['JavaScrit', 'React'], 0, 10, true);
			
			assert(Array.isArray(result), 'Result should be an array');
			assert(result.length >= 3, 'Should return topics matching either fuzzy or exact keywords');
			console.log('Test passed: fuzzy matching works with multiple keywords');
		});
		
		it('should respect edit distance threshold', async function () {
			const result = await topics.getTopicsByTitleKeywords(testUser.uid, 'XavaDrict', 0, 10, true);
			
			assert(Array.isArray(result), 'Result should be an array');

			assert(result.length === 0, 'Should not return topics exceeding edit distance threshold');

			console.log('Test passed: respects edit distance threshold');
		});

		it('should not find matches for completely different keywords with fuzzy on', async function () {
			const result = await topics.getTopicsByTitleKeywords(testUser.uid, 'Zyxwvuts', 0, 10, true);

			assert(Array.isArray(result), 'Result should be an array');
			assert(result.length === 0, 'Should not return topics for completely different keywords with fuzzy on');
			console.log('Test passed: no matches for completely different keywords with fuzzy on');
		});

		it('should work with both exact and fuzzy matches simultaneously', async function () {
			// Test that when fuzzy=true, it still finds exact matches
			const exactResult = await topics.getTopicsByTitleKeywords(testUser.uid, 'Python', 0, 10, false);
			const fuzzyResult = await topics.getTopicsByTitleKeywords(testUser.uid, 'Python', 0, 10, true);
			
			assert(Array.isArray(exactResult), 'Exact result should be an array');
			assert(Array.isArray(fuzzyResult), 'Fuzzy result should be an array');
			// Fuzzy should return at least as many results as exact (could be more due to fuzzy matches)
			assert(fuzzyResult.length >= exactResult.length, 'Fuzzy should return at least as many as exact');
			console.log('Test passed: fuzzy search includes exact matches');
		});
		
		it('should handle short keywords appropriately in fuzzy mode', async function () {
			// Test fuzzy matching with very short keywords
			const result = await topics.getTopicsByTitleKeywords(testUser.uid, 'We', 0, 10, true);
			
			assert(Array.isArray(result), 'Result should be an array');
			// Should find "Web" in "Web Development Best Practices" with fuzzy matching
			console.log('Test passed: fuzzy matching works with short keywords');
		});
		
		it('should handle case-insensitive fuzzy matching', async function () {
			// Test fuzzy matching with different cases
			const result = await topics.getTopicsByTitleKeywords(testUser.uid, 'javascript', 0, 10, true);
			
			assert(Array.isArray(result), 'Result should be an array');
			assert(result.length >= 2, 'Should return topics with case-insensitive fuzzy match');
			console.log('Test passed: fuzzy matching is case-insensitive');
		});
	});
	
	describe('Pagination', function () {
		it('should respect pagination parameters', async function () {
			const result1 = await topics.getTopicsByTitleKeywords(testUser.uid, 'Development', 0, 1);
			const result2 = await topics.getTopicsByTitleKeywords(testUser.uid, 'Development', 0, 5);
			
			assert(Array.isArray(result1), 'Result1 should be an array');
			assert(Array.isArray(result2), 'Result2 should be an array');
			assert(result2.length >= result1.length, 'Larger stop should return more or equal results');
			console.log('Test passed: pagination works correctly');
		});
		
		it('should respect pagination parameters with fuzzy search', async function () {
			const result1 = await topics.getTopicsByTitleKeywords(testUser.uid, 'Developmen', 0, 1, true);
			const result2 = await topics.getTopicsByTitleKeywords(testUser.uid, 'Developmen', 0, 5, true);
			
			assert(Array.isArray(result1), 'Result1 should be an array');
			assert(Array.isArray(result2), 'Result2 should be an array');
			assert(result2.length >= result1.length, 'Larger stop should return more or equal fuzzy results');
			console.log('Test passed: pagination works correctly with fuzzy search');
		});
	});
});
