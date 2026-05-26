export const localizedTitles:
	Record<string, string> = {

	eng:
		"A Verse Created for You ✨",

	en:
		"A Verse Created for You ✨",

	es:
		"Un versículo para ti ✨",

	pt:
		"Um versículo para você ✨",

	fr:
		"Un verset pour vous ✨",

	de:
		"Ein Vers für dich ✨",

	ru:
		"Стих для вас ✨",

	hi:
		"आपके लिए एक पद ✨",

	te:
		"మీ కోసం ఒక వాక్యం ✨",

	ta:
		"உங்களுக்கான வசனம் ✨",

	ko:
		"당신을 위한 말씀 ✨",

	ar:
		"آية من أجلك ✨"
};

export function getLocalizedTitle(
	language: string
) {

	return (
		localizedTitles[language] ||
		localizedTitles["eng"]
	);
}