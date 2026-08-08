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

export function getLocalizedTitle(language: string): string {
	const title = localizedTitles[language];
	return title ?? "A Verse Created for You ✨";
}

// localizedPushBodies 
export const localizedPushBodies: Record<string, string> = {
	eng: "May God's Word bring you strength and peace today. 🙏",

	en: "May God's Word bring you strength and peace today. 🙏",

	es: "Que la Palabra de Dios te dé fuerza y paz hoy. 🙏",

	pt: "Que a Palavra de Deus lhe traga força e paz hoje. 🙏",

	fr: "Que la Parole de Dieu vous apporte force et paix aujourd'hui. 🙏",

	de: "Möge Gottes Wort dir heute Kraft und Frieden schenken. 🙏",

	ru: "Пусть Слово Божье принесёт вам сегодня силу и мир. 🙏",

	hi: "परमेश्वर का वचन आज आपको शक्ति और शांति दे। 🙏",

	te: "దేవుని వాక్యం ఈ రోజు మీకు బలం మరియు సమాధానాన్ని కలిగించుగాక. 🙏",

	ta: "தேவனுடைய வார்த்தை இன்று உங்களுக்கு வலிமையையும் சமாதானத்தையும் தருவதாக. 🙏",

	ko: "오늘 하나님의 말씀이 당신에게 힘과 평안을 주시길 바랍니다. 🙏",

	ar: "لتمنحك كلمة الله القوة والسلام اليوم. 🙏",
};

export function getLocalizedPushBody(language: string): string {
	const body = localizedPushBodies[language];
	return body ?? "May God's Word bring you strength and peace today. 🙏";
}