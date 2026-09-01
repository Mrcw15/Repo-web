const chars = ['©', '®', '™', '‼', '↔', '🔥', '🚀', '👨‍👩‍👧‍👦', '2️⃣', 'a', '1', '❤', '❤️', '⌚', '☀️', '☕'];

const isEmoji = (str) => {
  const baseStr = str.replace(/[\uFE0F\uFE0E]/g, '');
  if (baseStr.length === 1 && baseStr.charCodeAt(0) <= 0x21AA) return false;
  if (/^[\u0023-\u0039]\ufe0f?\u20e3$/.test(str)) return true;
  return /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(str);
};

for (const c of chars) {
  console.log(c, isEmoji(c));
}
