let matches = [];
for (let i = 0; i < 0x3000; i++) {
  let char = String.fromCodePoint(i);
  if (/\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(char)) {
    matches.push(char + " U+" + i.toString(16).toUpperCase());
  }
}
console.log(matches.slice(0, 50));
