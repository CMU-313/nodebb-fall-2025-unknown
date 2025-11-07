
/* eslint-disable strict */
//var request = require('request');

const translatorApi = module.exports;

translatorApi.translate = async function (postData) {
//  Edit the translator URL below

const TRANSLATOR_API = "http://127.0.0.1:5000"
const response = await fetch(TRANSLATOR_API+'/?content='+encodeURIComponent(postData.content));
const data = await response.json();
return [data.is_english, data.translated_content];
 
};