const graphemes = ['❤️', '😂', '✅', '✨'];
const isEmoji = (str) => /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(str) || /^[\u0023-\u0039]\ufe0f?\u20e3$/.test(str);
for (const g of graphemes) {
  console.log(g, isEmoji(g));
}
