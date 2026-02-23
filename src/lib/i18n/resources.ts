import en from "./messages/en";
import de from "./messages/de";
import pt from "./messages/pt";
import es from "./messages/es";
import ja from "./messages/ja";
import fr from "./messages/fr";
import ru from "./messages/ru";
import it from "./messages/it";

export const resources = {
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  ja: { translation: ja },
  fr: { translation: fr },
  pt: { translation: pt },
  ru: { translation: ru },
  it: { translation: it },
} as const;
