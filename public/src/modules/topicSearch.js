// created with help of Cursor : 
// on general javascript structure and usage, and
// on HTML componenet retrieval, set / other interactions

define('topicSearch', [
	'alerts',
	'api',
], function (alerts, api) {
	const TopicSearch = {};
	let currentSearchTerm = '';
	let originalTopics = [];

	TopicSearch.init = function () {
		console.log('TopicSearch.init() called');
		
		// Wait for DOM to be ready
		setTimeout(function () {
			TopicSearch.attachEventListeners();
		}, 100);
	};

	TopicSearch.attachEventListeners = function () {
		// Store original topics for restoration
		TopicSearch.storeOriginalTopics();

		// Debug: Check if elements exist
		console.log('Search button found:', $('[component="topic/search"]').length);
		console.log('Search input found:', $('[component="topic/input"]').length);
		console.log('Clear button found:', $('[component="topic/search/clear"]').length);

		// Handle search button click - ONLY way to trigger search
		$('[component="topic/search"]').on('click', function (e) {
			console.log('search button clicked!');
			e.preventDefault();
			const searchTerm = $('[component="topic/input"]').val().trim();
			if (searchTerm) { 
				TopicSearch.performSearch(searchTerm);
			}
		});

		// Handle clear button click
		$('[component="topic/search/clear"]').on('click', function (e) { 
			console.log('clear button clicked!');
			e.preventDefault();
			TopicSearch.clearSearch();
		});

		// No automatic input handling - search only on button click
	};

	TopicSearch.performSearch = function (searchTerm) {
		if (!searchTerm || searchTerm === currentSearchTerm) {
			return;
		}

		// Minimum search length
		if (searchTerm.length < 2) {
			console.log('Search term must be greater than 1');
			TopicSearch.clearSearch();
			return;
		}

		currentSearchTerm = searchTerm;
		console.log('Searching for:', searchTerm);

		// Show loading state
		$('[component="topic/search"]').prop('disabled', true).find('i').removeClass('fa-search').addClass('fa-spinner fa-spin');

		// Use the fixed Topics.getTopicsByTitleKeywords function
		api.get('/topics/search-by-title', {
			keywords: searchTerm,
			start: 0,
			stop: 100, // Get more results to filter from
		}, function (err, results) {
			if (err) {
				console.error('API call error:', err);
				alerts.error('Search failed. Please try again.');
				$('[component="topic/search"]').prop('disabled', false).find('i').removeClass('fa-spinner fa-spin').addClass('fa-search');
				return;
			}
			console.log('API call successful, results:', results);
			TopicSearch.handleSearchResults(results);
		}).catch(function (error) {
			console.error('Search failed:', error);
			alerts.error('Search failed. Please try again.');
			// Reset loading state
			$('[component="topic/search"]').prop('disabled', false).find('i').removeClass('fa-spinner fa-spin').addClass('fa-search');
		});
	};

	TopicSearch.handleSearchResults = function (results) {
		// Reset loading state
		$('[component="topic/search"]').prop('disabled', false).find('i').removeClass('fa-spinner fa-spin').addClass('fa-search');

		console.log('Frontend received results:', results);
		console.log('Results type:', typeof results);
		console.log('Results.topics:', results ? results.topics : 'undefined');
		console.log('Results.topics length:', results && results.topics ? results.topics.length : 'undefined');

		if (!results || !results.topics || !results.topics.length) {
			console.log('No results found, showing no results message');
			TopicSearch.showNoResults();
			return;
		}

		// Extract unique topic IDs from search results
		const matchingTids = [...new Set(results.topics.map(topic => topic.tid))];
		console.log('Extracted TIDs:', matchingTids);
		TopicSearch.rebuildTopicList(matchingTids);
	};

	TopicSearch.rebuildTopicList = function (matchingTids) {
		console.log('Rebuilding topic list for TIDs:', matchingTids);

		// Get the topic container
		const topicContainer = $('[component="category"]');
		console.log('Topic container found:', topicContainer.length);

		// Clear the container
		topicContainer.empty();

		// Rebuild from original topics
		let visibleCount = 0;
		originalTopics.each(function () {
			const $originalTopic = $(this);
			const tid = $originalTopic.attr('data-tid');
			
			if (matchingTids.includes(parseInt(tid))) {
				// Clone and append matching topics
				const $clonedTopic = $originalTopic.clone();
				topicContainer.append($clonedTopic);
				visibleCount++;
				console.log(`Added topic with tid=${tid}`);
			}
		});

		console.log('Rebuilt topic list with', visibleCount, 'topics');
		TopicSearch.updateResultsCount(visibleCount);
	};

	TopicSearch.showNoResults = function () {
		// Clear the topic container
		const topicContainer = $('[component="category"]');
		topicContainer.empty();
		
		// Show no results message
		alerts.info('No topics found matching "' + currentSearchTerm + '"');
		TopicSearch.updateResultsCount(0);
	};

	TopicSearch.updateResultsCount = function (count) {
		console.log(`Found ${count} matching topics`);
	};

	TopicSearch.clearSearch = function () {
		currentSearchTerm = '';
		$('[component="topic/input"]').val('');

		// Restore original topics from stored array
		if (originalTopics.length > 0) {
			// Clear container and restore original topics
			const topicContainer = $('[component="category"]');
			topicContainer.empty();
			
			// Clone and append all original topics
			originalTopics.each(function () {
				const $clonedTopic = $(this).clone();
				topicContainer.append($clonedTopic);
			});
			
			console.log('Restored', originalTopics.length, 'original topics');
		} else {
			// Fallback: show all topics
			$('[component="category/topic"]').show();
		}

		// Reset results count
		TopicSearch.updateResultsCount($('[component="category/topic"]').length);
	};

	TopicSearch.storeOriginalTopics = function () {
		// Store reference to original topic elements for restoration
		originalTopics = $('[component="category/topic"]').clone();
	};

	return TopicSearch;
});