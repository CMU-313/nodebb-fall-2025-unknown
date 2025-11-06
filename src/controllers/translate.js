"use strict";

module.exports = {
	post: async function (req, res) {
		// accept either JSON body or form-encoded body
		const postId = req.body && (req.body.post_id || req.body.postId) ? (req.body.post_id || req.body.postId) : null;
		
		const targetLang = req.body && (req.body.lang || req.body.targetLang) ? (req.body.lang || req.body.targetLang) : 'en';
		const sourceText = req.body && req.body.text ? req.body.text : 'Esta es un mensaje en español';

		const translations = {
			'Esta es un mensaje en español': 'This is a message in Spanish',
			'Hola mundo': 'Hello world',
			'¿Cómo estás?': 'How are you?',
			'Buenos días': 'Good morning',
			'Gracias por tu ayuda': 'Thank you for your help'
		};

	
		const translatedText = translations[sourceText] || 'This is a message in Spanish';

		const response = {
			success: true,
			post_id: postId,
			translation: {
				text: String(translatedText),
				detected_source: 'es',
				target_language: targetLang,
				provider: 'hardcoded-mock',
			},
		};

		res.status(200).json(response);
	},
};
