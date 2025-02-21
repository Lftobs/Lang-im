import { toast } from "react-toastify";
import { GoogleGenerativeAI } from '@google/generative-ai';

export const detectLanguage = async (text, setDetectedLanguage) => {
  try {
    const detector = await self.ai.languageDetector.create();
    const result = await detector.detect(text);
    const detectedCode = result[0].detectedLanguage;

    // gets original name of language code
    const languageName =
      new Intl.DisplayNames(["en"], { type: "language" }).of(detectedCode) ||
      "Unknown Language";

    console.log(languageName);
    setDetectedLanguage(detectedCode);
    return languageName;
  } catch (error) {
    // console.error("Language detection error:", error);
    toast.error("Error detecting language!");
  }
};

export const translateText = async (
  text,
  detectedLanguage,
  targetLanguage,
  setIsTranslating
) => {
  console.log(detectedLanguage, targetLanguage);
  if (detectedLanguage === targetLanguage) {
    console.log("Can't translate to the same language");
    toast.error("Can't translate to the same language");
    return;
  }

  setIsTranslating(true);

  try {
    const translator = await self.ai.translator.create({
      sourceLanguage: detectedLanguage,
      targetLanguage,
    });

    const translatedResult = await translator.translate(text);
    return translatedResult;
  } catch (error) {
    console.error("Translation error:", error);
    if (
      error.message ===
      "Unable to create translator for the given source and target language."
    ) {
      toast.error("Unsupported Languages Provided!");
    } else {
      toast.error("Error in translation.");
    }
  } finally {
    setIsTranslating(false);
  }
};

export const summarizeText = async (text, setIsProcessing) => {
  setIsProcessing(true);
  const genAI = new GoogleGenerativeAI(
    import.meta.env.VITE_GEMINI_API_KEY || ""
  );

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = "Summarize the following text: " + text;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Summarization error:", error);
    return "";
  } finally {
    setIsProcessing(false);
  }
};
