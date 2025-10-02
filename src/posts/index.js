'use strict';

const _ = require('lodash');

const db = require('../database');
const utils = require('../utils');
const user = require('../user');
const privileges = require('../privileges');
const plugins = require('../plugins');

const Posts = module.exports;

require('./data')(Posts);
require('./create')(Posts);
require('./delete')(Posts);
require('./edit')(Posts);
require('./parse')(Posts);
require('./user')(Posts);
require('./topics')(Posts);
require('./category')(Posts);
require('./summary')(Posts);
require('./recent')(Posts);
require('./tools')(Posts);
require('./votes')(Posts);
require('./bookmarks')(Posts);
require('./endorsements')(Posts);
require('./queue')(Posts);
require('./diffs')(Posts);
require('./uploads')(Posts);

Posts.attachments = require('./attachments');

Posts.exists = async function (pids) {
	return await db.exists(
		Array.isArray(pids) ? pids.map(pid => `post:${pid}`) : `post:${pids}`
	);
};

Posts.getPidsFromSet = async function (set, start, stop, reverse) {
	if (isNaN(start) || isNaN(stop)) {
		return [];
	}
	return await db[reverse ? 'getSortedSetRevRange' : 'getSortedSetRange'](set, start, stop);
};

Posts.getPostsByPids = async function (pids, uid) {
	if (!Array.isArray(pids) || !pids.length) {
		return [];
	}

	let posts = await Posts.getPostsData(pids);
	posts = await Promise.all(posts.map(Posts.parsePost));
	const data = await plugins.hooks.fire('filter:post.getPosts', { posts: posts, uid: uid });
	if (!data || !Array.isArray(data.posts)) {
		return [];
	}
	return data.posts.filter(Boolean);
};

Posts.getPostSummariesFromSet = async function (set, uid, start, stop) {
	let pids = await db.getSortedSetRevRange(set, start, stop);
	pids = await privileges.posts.filter('topics:read', pids, uid);
	const posts = await Posts.getPostSummaryByPids(pids, uid, { stripTags: false });
	return { posts: posts, nextStart: stop + 1 };
};

Posts.getPidIndex = async function (pid, tid, topicPostSort) {
	const set = topicPostSort === 'most_votes' ? `tid:${tid}:posts:votes` : `tid:${tid}:posts`;
	const reverse = topicPostSort === 'newest_to_oldest' || topicPostSort === 'most_votes';
	const index = await db[reverse ? 'sortedSetRevRank' : 'sortedSetRank'](set, pid);
	if (!utils.isNumber(index)) {
		return 0;
	}
	return utils.isNumber(index) ? parseInt(index, 10) + 1 : 0;
};

Posts.getPostIndices = async function (posts, uid) {
	if (!Array.isArray(posts) || !posts.length) {
		return [];
	}
	const settings = await user.getSettings(uid);

	const byVotes = settings.topicPostSort === 'most_votes';
	let sets = posts.map(p => (byVotes ? `tid:${p.tid}:posts:votes` : `tid:${p.tid}:posts`));
	const reverse = settings.topicPostSort === 'newest_to_oldest' || settings.topicPostSort === 'most_votes';

	const uniqueSets = _.uniq(sets);
	let method = reverse ? 'sortedSetsRevRanks' : 'sortedSetsRanks';
	if (uniqueSets.length === 1) {
		method = reverse ? 'sortedSetRevRanks' : 'sortedSetRanks';
		sets = uniqueSets[0];
	}

	const pids = posts.map(post => post.pid);
	const indices = await db[method](sets, pids);
	return indices.map(index => (utils.isNumber(index) ? parseInt(index, 10) + 1 : 0));
};

Posts.modifyPostByPrivilege = function (post, privileges) {
	if (post && post.deleted && !(post.selfPost || privileges['posts:view_deleted'])) {
		post.content = '[[topic:post-is-deleted]]';
		if (post.user) {
			post.user.signature = '';
		}
	}
};

Posts.getPostsByTimeRange = async function (uid, startTime, endTime, start, stop, cid) {
	const parseTime = (time) => {
		if (utils.isNumber(time)) {
			return time;
		}
		if (typeof time === 'string') {
			const parsed = new Date(time);
			if (isNaN(parsed.getTime())) {
				throw new Error('[[error:invalid-date-format]]');
			}
			return parsed.getTime();
		}
		if (time instanceof Date) {
			return time.getTime();
		}
		throw new Error('[[error:invalid-time-format]]');
	};
	
	startTime = parseTime(startTime);
	endTime = parseTime(endTime);
	
	if (startTime >= endTime) {
		throw new Error('[[error:invalid-time-range]]');
	}
		
	let set;
	if (cid && cid !== -1) {
		set = `cid:${cid}:pids`;
	} else {
		set = 'posts:pid';
	}
	
	const count = stop - start + 1;
	let pids = await db.getSortedSetRevRangeByScore(set, start, count, endTime, startTime);
	
	pids = await privileges.posts.filter('topics:read', pids, uid);
	
	return await Posts.getPostSummaryByPids(pids, uid, { stripTags: true });
};

// created using Claude Sonnet 4
Posts.getPostsByTitleKeywords = async function (uid, keywords, start, stop) {
	if (!keywords) {
		throw new Error('[[error:invalid-keyword]]');
	}
	
	// Handle both string and array inputs
	let keywordArray;
	if (typeof keywords === 'string') {
		keywordArray = keywords.split(/\s+/).map(k => k.trim()).filter(k => k.length > 0);
	} else if (Array.isArray(keywords)) {
		keywordArray = keywords.map(k => String(k).trim()).filter(k => k.length > 0);
	} else {
		throw new Error('[[error:invalid-keyword]]');
	}
	
	if (!keywordArray.length) {
		throw new Error('[[error:invalid-keyword]]');
	}
	
	let pids = await db.getSortedSetRevRange('posts:pid', start, stop);
	pids = await privileges.posts.filter('topics:read', pids, uid);
	
	if (!pids.length) {
		return [];
	}
	
	const postsData = await Posts.getPostsFields(pids, ['tid', 'pid']);
	const tids = _.uniq(postsData.map(post => post.tid).filter(Boolean));
	
	if (!tids.length) {
		return [];
	}
	
	const topics = require('../topics');
	const topicsData = await topics.getTopicsFields(tids, ['tid', 'title']);
	
	const tidToTitle = {};
	topicsData.forEach((topic) => {
		if (topic && topic.tid && topic.title) {
			tidToTitle[topic.tid] = topic.title.toLowerCase();
		}
	});
	
	const keywordsLower = keywordArray.map(k => k.toLowerCase());
	const matchedPids = [];
	
	for (const post of postsData) {
		if (post && post.tid && tidToTitle[post.tid]) {
			const title = tidToTitle[post.tid];
			// Check if any of the keywords appears in the title
			if (keywordsLower.some(keyword => title.includes(keyword))) {
				matchedPids.push(post.pid);
			}
		}
	}
	
	return await Posts.getPostSummaryByPids(matchedPids, uid, { stripTags: true });
};

require('../promisify')(Posts);
