### Post Endorsement 
To use the endorsement feature, the user needs to be an admin/teacher. If they have access, an endorsement button will appear next to each post under a topic. To endorse the post, simply click the button. Then, an icon will appear at the top right of the post and, if hovered over, will display that the post has been endorsed. To un-endorse the post, the teacher/admin simply clicks the un-endorse button, which replaces the endorse button whenever a post has been endorsed.

## Testing
To test the backend functionality of the endorsements, the endpoints to endorse and unendorse were tested. The endorsement status in the database was checked in these tests to see if they reflected the action. These tests are enough because there are only two inputs to the endorsement feature (endorse and un-endorse). The tests can be run by running:
`npx mocha test/posts.js`

To test the front end functionality of the endorsements, we mocked some post data and then simulated the act of toggling the endorsement feature on and off so see if the correct status of the post and the toggle button was met based on the situation. We covered all situations to ensure the tests were exhaustive: toggle on, toggle off, and error handling. To run the test you can use the following command: 
`npx mocha test/posts/endoresments.ui.test.js`

### Search by Title
The Search Topic by Title feature allows users to quickly find topics by name across the tabs, including the Unread, Recent, and Popular tabs.
You can search for posts or discussions by querying the title in the search bar, with optional fuzzy matching to catch typos or close matches.
Locate the search bar at the tool bar section of the tabs. The user must type in at least two characters in the search bar for the query to register input. The search only happens when you actually click the search icon (no keyboard inputs currently). To clear the results, click the ‘x’ button next to the search bar to clear filtered topics and bring back all original topics.
## Testing
Automated tests were included in the local test suite for both backend and connection layer. These backend tests tested several inputs with both fuzzy and non-fuzzy options enabled. It tested single-keyword, multiple-keywords, slightly-off words, misspelled words, words that weren’t in any topics, and error handling. This is sufficient for covering the changes made because it tested a wide variety of inputs that cover all types of cases/outputs that the feature should have. 
The controller / connection layer tests utilizes live server API calls through the search by title route with mock queries on mock databases to confirm expected data flow behavior between the two end points. It includes invalid query handling (ex. empty query) and expected result on valid queries. 
The following command runs the tests: 
- `npx mocha test/topics-keyword-search.js` 
- `npx mocha test/topics-search-api.js`


### Filter by Time Intervals
To use this feature, the user needs to click on the filter icon in the navigation bar on the left hand side of the 	screen. The filter UI should appear and the user must enter a valid start date and end date to search for posts that occur within their inputted time range. The end date must be a date that occurs after the start date. To submit the query, either hit enter or click the apply button. The filtered posts should appear on the screen. 

## Testing 
To test the filter query function of the interval by time ranges feature, you can run 
`npx mocha test/posts-time-range.test.js`
This file mocks some test post data and then tests that the query works for valid time ranges. It also tests that proper error handling occurs for invalid date range queries. 

To test the filter-by-date end to end functionality we created the following tests: 

- Controller API Tests for frontend to controller communication
- Post services tests
- Integration tests
- Performance and edge case tests

These test files are available and can be run from test/filter.js. The cases cover query handling- such as missing start or end dates, bad format (etc.), post retrieval (in terms of correct posts and how the posts get displayed), and edge cases. You can run the file by running: `npx mocha test/filter.js` 
