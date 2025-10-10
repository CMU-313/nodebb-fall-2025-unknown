const assert = require('assert');

describe('Endorsement UI', function () {

	let document, endorseBtn, unendorseBtn, postEl;

	function createMockDOM() {
		const el = {
			classList: new Set(),
			setAttribute: function (name, value) { this[name] = value; },
			getAttribute: function (name) { return this[name]; },
			contains: function (cls) { return this.classList.has(cls); },
			add: function (cls) { this.classList.add(cls); },
			remove: function (cls) { this.classList.delete(cls); },
			toggle: function (cls, force) {
				if (force) this.add(cls); else this.remove(cls);
			},
		};
		return {
			endorseBtn: Object.assign({}, el, { classList: new Set(), postsEndorsed: 'false' }),
			unendorseBtn: Object.assign({}, el, { classList: new Set(['hidden']), postsEndorsed: 'false' }),
			indicator: Object.assign({}, el, { classList: new Set(['hidden']) }),
		};
	}

	beforeEach(() => {
		const dom = createMockDOM();
		document = {
			querySelector: (sel) => {
				if (sel === '[data-pid="123"]') return {
					querySelector: (c) => {
						if (c === '[component="post/endorse"]') return dom.endorseBtn;
						if (c === '[component="post/unendorse"]') return dom.unendorseBtn;
						if (c === '.endorsed.post-indicator') return dom.indicator;
					},
				};
				return null;
			},
		};
		postEl = {
			querySelector: (c) => {
				if (c === '[component="post/endorse"]') return dom.endorseBtn;
				if (c === '[component="post/unendorse"]') return dom.unendorseBtn;
				if (c === '.endorsed.post-indicator') return dom.indicator;
			},
		};
		endorseBtn = dom.endorseBtn;
		unendorseBtn = dom.unendorseBtn;
	});

	function togglePostEndorse(data) {
		const el = document.querySelector('[data-pid="' + data.post.pid + '"]');
		if (!el) return;
		const unendorseBtn = el.querySelector('[component="post/unendorse"]');
		const endorseBtn = el.querySelector('[component="post/endorse"]');
		const indicator = el.querySelector('.endorsed.post-indicator');
		if (data.isEndorsed) {
			unendorseBtn.remove('hidden');
			unendorseBtn.setAttribute('posts-endorsed', 'true');
			endorseBtn.add('hidden');
			endorseBtn.setAttribute('posts-endorsed', 'true');
			indicator.remove('hidden');
		} else {
			unendorseBtn.add('hidden');
			unendorseBtn.setAttribute('posts-endorsed', 'false');
			endorseBtn.remove('hidden');
			endorseBtn.setAttribute('posts-endorsed', 'false');
			indicator.add('hidden');
		}
	}

	it('should show endorse button and hide unendorse button initially', function () {
		assert.strictEqual(endorseBtn.contains('hidden'), false);
		assert.strictEqual(unendorseBtn.contains('hidden'), true);
		assert.strictEqual(postEl.querySelector('.endorsed.post-indicator').contains('hidden'), true);
	});

	it('should show unendorse button and indicator after endorsement', function () {
		togglePostEndorse({ post: { pid: '123' }, isEndorsed: true });
		assert.strictEqual(endorseBtn.contains('hidden'), true);
		assert.strictEqual(unendorseBtn.contains('hidden'), false);
		assert.strictEqual(postEl.querySelector('.endorsed.post-indicator').contains('hidden'), false);
	});

	it('should show endorse button and hide indicator after unendorsement', function () {
		togglePostEndorse({ post: { pid: '123' }, isEndorsed: true });
		togglePostEndorse({ post: { pid: '123' }, isEndorsed: false });
		assert.strictEqual(endorseBtn.contains('hidden'), false);
		assert.strictEqual(unendorseBtn.contains('hidden'), true);
		assert.strictEqual(postEl.querySelector('.endorsed.post-indicator').contains('hidden'), true);
	});

	it('should not throw if post element is missing', function () {
		assert.doesNotThrow(() => togglePostEndorse({ post: { pid: '999' }, isEndorsed: true }));
	});
});
