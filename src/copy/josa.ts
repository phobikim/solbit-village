// 한글 조사 고르기 (받침 유무). 한글이 아닌 글자로 끝나면 받침 없음으로 친다.

function hasFinalConsonant(word: string): boolean {
  const ch = word.trim().slice(-1);
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return false;
  return code % 28 !== 0;
}

/** 을/를 */
export const eul = (w: string) => `${w}${hasFinalConsonant(w) ? '을' : '를'}`;
/** 이/가 */
export const iga = (w: string) => `${w}${hasFinalConsonant(w) ? '이' : '가'}`;
