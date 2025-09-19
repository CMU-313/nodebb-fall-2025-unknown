'use strict';

const db = require('../database');
const plugins = require('../plugins');

module.exports = function (Posts) {
	Posts.endorse = async function (pid, uid) {
		return await toggleEndorsement('endorse', pid, uid);
	};

	Posts.unendorse = async function (pid, uid) {
		return await toggleEndorsement('unendorse', pid, uid);
	};

	async function toggleEndorsement(type, pid, uid) {
		if (parseInt(uid, 10) <= 0) {
			throw new Error('[[error:not-logged-in]]');
		}

		const isEndorsing = type === 'endorse';

		const [postData, hasEndorsed] = await Promise.all([
			Posts.getPostFields(pid, ['pid', 'uid']),
			Posts.hasEndorsed(pid, uid),
		]);

		if (isEndorsing && hasEndorsed) {
			throw new Error('[[error:already-endorsed]]');
		}

		if (!isEndorsing && !hasEndorsed) {
			throw new Error('[[error:already-unendorsed]]');
		}

		if (isEndorsing) {
			await db.sortedSetAdd(`uid:${uid}:endorsements`, Date.now(), pid);
		} else {
			await db.sortedSetRemove(`uid:${uid}:endorsements`, pid);
		}
		await db[isEndorsing ? 'setAdd' : 'setRemove'](`pid:${pid}:users_endorsed`, uid);
		postData.endorsements = await db.setCount(`pid:${pid}:users_endorsed`);
		await Posts.setPostField(pid, 'endorsements', postData.endorsements);

		plugins.hooks.fire(`action:post.${type}`, {
			pid: pid,
			uid: uid,
			owner: postData.uid,
			current: hasEndorsed ? 'endorsed' : 'unendorsed',
		});

		return {
			post: postData,
			isEndorsed: isEndorsing,
		};
	}

	Posts.hasEndorsed = async function (pid, uid) {
		if (parseInt(uid, 10) <= 0) {
			return Array.isArray(pid) ? pid.map(() => false) : false;
		}

		if (Array.isArray(pid)) {
			const sets = pid.map(pid => `pid:${pid}:users_endorsed`);
			return await db.isMemberOfSets(sets, uid);
		}
		return await db.isSetMember(`pid:${pid}:users_endorsed`, uid);
	};

	Posts.getEndorsers = async function (pid) {
		return await db.getSetMembers(`pid:${pid}:users_endorsed`);
	};

	Posts.getEndorsersCount = async function (pid) {
		return await db.setCount(`pid:${pid}:users_endorsed`);
	};
};
