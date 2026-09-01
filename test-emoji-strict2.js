const chars = ['©', '®', '™', '🔥', '🚀', '👨‍👩‍👧‍👦', '2️⃣', 'a', '1', '❤', '❤️'];
const strictEmoji = (str) => {
  // Check if it's a number keycap (e.g., 2️⃣)
  if (/^[\u0023-\u0039]\ufe0f?\u20e3$/.test(str)) return true;
  
  // Reject basic text symbols like copyright, trademark, registered
  if (/^[\u00A9\u00AE\u2122]$/.test(str.replace(/\ufe0f/g, ''))) return false;

  // General emoji check
  return /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(str);
};

for (const c of chars) {
  console.log(c, strictEmoji(c));
}
