/// <reference path="../../global.d.ts" />

import { toast } from "react-toastify";
import { GoogleGenerativeAI } from '@google/generative-ai';


const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY || ""
);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const detectionPrompt =`
Your are an expert language translator...please dectect language in 
the given text and only return the language code E.g return en if its english

NOTE ONLY RETURN THE LANGUAGE CODE

Here is the text to dectect:
`

const translationPrompt =`
Your are an expert language translator...please translate 
the given text from the detectedlangauage to the target language.

Expected input => {text: <the_text>, from: en, to: es}

ie  if the text is hello your output should be holla.

NOTE ONLY RETURN THE TRANSLATED TEXT

Here is the input to translate:
`


export const detectLanguage = async (
  text: string,
  setDetectedLanguage: (language: string) => void
): Promise<string | undefined> => {
  try {
    const prompt =  detectionPrompt + text;
    const result = await model.generateContent(prompt);
    const detectedCode = result.response.text().toLowerCase().trim();
    console.log('Detected language code:', detectedCode);
    // gets original name of language code
    const languageName =
      new Intl.DisplayNames(["en"], { type: "language" }).of(detectedCode) ||
      "Unknown Language";

    console.log(languageName, 'language name');
    setDetectedLanguage(detectedCode);
    return languageName;
  } catch (error) {
    // console.error("Language detection error:", error);
    toast.error("Error detecting language!");
    
  }
};

export const translateText = async (
  text: string,
  detectedLanguage: string,
  targetLanguage: string
): Promise<string | undefined> => {
  console.log(detectedLanguage, targetLanguage);
  if (detectedLanguage === targetLanguage) {
    console.log("Can't translate to the same language");
    toast.error("Can't translate to the same language");
    return;
  }

  try {
    const prompt =  translationPrompt + `text: ${text}, from: ${detectedLanguage}, to: ${targetLanguage}`;
    const result = await model.generateContent(prompt);

    const translatedResult = result.response.text()
    return translatedResult;
  } catch (error: any) {
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
  }
};

export const summarizeText = async (text: string) => {
  try {
    const prompt = "Summarize the following text: " + text;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Summarization error:", error);
    toast.error("Error occured while summarizing text.");
    return "";
  } finally {
  }
};
