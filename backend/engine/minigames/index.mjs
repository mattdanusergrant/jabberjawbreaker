// Mini-game registry — v0.2 ships three; category_sweep/etc. slot in here later.  #LLM-generated
import { wordHunt } from "./wordHunt.mjs";
import { longestWord } from "./longestWord.mjs";
import { triviaSpell } from "./triviaSpell.mjs";

export const MINIGAMES = {
  word_hunt: wordHunt,
  longest_word: longestWord,
  trivia_spell: triviaSpell,
};
export const getMinigame = (id) => MINIGAMES[id];
