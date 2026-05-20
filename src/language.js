export const LANG = {
  en: {
    code: "English",
    menuEyebrow: "Rotten Arcade Presents",
    title: "Evil Banana Survival",
    objective: "Find the punchlines, keep moving, and do not let the glowing banana peel your confidence.",
    play: "Enter the Backrooms",
    start: "Click to Start",
    score: "Score",
    language: "Language",
    warningSafe: "Banana signal: distant",
    warningNear: "Banana signal: too close",
    warningDanger: "Banana signal: panic",
    stamina: "Stamina",
    mute: "Mute",
    unmute: "Unmute",
    prompt: "Press E to collect the joke",
    gameOver: "Game Over",
    slipped: "SLIPPED!",
    objectiveHud: "Collect jokes before the Evil Banana gets you.",
    items: {
      jokeNote: "Joke Note",
      peel: "Suspicious Peel"
    },
    jokes: [
      "Why did the banana stalk the hallway? It wanted a split-level home.",
      "This joke is ripe. Unlike your survival odds.",
      "Banana says: potassium is temporary, fear is forever."
    ]
  },
  hi: {
    code: "हिन्दी",
    menuEyebrow: "रॉटन आर्केड प्रस्तुत करता है",
    title: "ईविल बनाना सर्वाइवल",
    objective: "चुटकुले ढूंढो, चलते रहो, और चमकते केले को अपनी हिम्मत छीलने मत दो।",
    play: "बैक रूम्स में जाएं",
    start: "शुरू करने के लिए क्लिक करें",
    score: "स्कोर",
    language: "भाषा",
    warningSafe: "केला संकेत: दूर",
    warningNear: "केला संकेत: बहुत पास",
    warningDanger: "केला संकेत: घबराओ",
    stamina: "स्टैमिना",
    mute: "म्यूट",
    unmute: "आवाज चालू",
    prompt: "चुटकुला लेने के लिए E दबाएं",
    gameOver: "खेल खत्म",
    slipped: "फिसल गए!",
    objectiveHud: "ईविल बनाना से बचते हुए चुटकुले इकट्ठा करें।",
    items: {
      jokeNote: "चुटकुला नोट",
      peel: "शक वाला छिलका"
    },
    jokes: [
      "केला गलियारे में क्यों घूम रहा था? उसे स्प्लिट लेवल घर चाहिए था।",
      "यह चुटकुला पका हुआ है। आपकी बचने की उम्मीदें नहीं।",
      "केला कहता है: पोटैशियम थोड़ी देर का है, डर हमेशा का।"
    ]
  },
  es: {
    code: "Español",
    menuEyebrow: "Rotten Arcade presenta",
    title: "Supervivencia del Plátano Malvado",
    objective: "Encuentra los chistes, sigue moviéndote y no dejes que el plátano brillante pele tu confianza.",
    play: "Entrar en los pasillos",
    start: "Haz clic para comenzar",
    score: "Puntuación",
    language: "Idioma",
    warningSafe: "Señal del plátano: lejana",
    warningNear: "Señal del plátano: demasiado cerca",
    warningDanger: "Señal del plátano: pánico",
    stamina: "Resistencia",
    mute: "Silenciar",
    unmute: "Activar sonido",
    prompt: "Pulsa E para recoger el chiste",
    gameOver: "Fin del juego",
    slipped: "¡RESBALASTE!",
    objectiveHud: "Recoge chistes antes de que el Plátano Malvado te atrape.",
    items: {
      jokeNote: "Nota de chiste",
      peel: "Cáscara sospechosa"
    },
    jokes: [
      "¿Por qué el plátano acechaba el pasillo? Quería una casa partida.",
      "Este chiste está maduro. Tus probabilidades de sobrevivir no.",
      "Dice el plátano: el potasio pasa, el miedo permanece."
    ]
  }
};

let currentLanguage = "en";
const listeners = new Set();
window.selectedLanguage = currentLanguage;

export function t(key) {
  const parts = key.split(".");
  let value = LANG[currentLanguage];
  for (const part of parts) value = value?.[part];
  return value ?? key;
}

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(language) {
  if (!LANG[language]) return;
  currentLanguage = language;
  window.selectedLanguage = currentLanguage;
  listeners.forEach((listener) => listener(currentLanguage));
}

export function onLanguageChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
