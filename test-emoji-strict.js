const chars = ['©', '®', '™', '🔥', '🚀', '👨‍👩‍👧‍👦', '2️⃣', 'a', '1'];
const isEmoji1 = (str) => /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(str) || /^[\u0023-\u0039]\ufe0f?\u20e3$/.test(str);
console.log("Current Regex:");
for (const c of chars) {
  console.log(c, isEmoji1(c));
}
