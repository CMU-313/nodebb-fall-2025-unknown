
/* eslint-disable strict */
// var request = require('request');

const translatorApi = module.exports;

translatorApi.translate = async function (postData) {
//  Edit the translator URL below

	const TRANSLATOR_API = 'http://128.2.220.229:5000';
	try { 
		const response = await fetch(TRANSLATOR_API + '/?content=' + encodeURIComponent(postData.content));
		const data = await response.json();
		return [false, data.translated_content];
	} catch(err) {
		console.log('no need to translate');
		return [false, postData.content];
	}
};