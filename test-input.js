let selected = ['🔥', '🚀'];
let val = selected.join(', '); // "🔥, 🚀"
// user types 😂
let raw = "🔥, 🚀😂";
let cleaned = raw.replace(/[\s,\[\]]/g, ''); // "🔥🚀😂"
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
const graphemes = Array.from(segmenter.segment(cleaned)).map(s => s.segment);
console.log("New selected:", graphemes);
console.log("New val:", graphemes.join(', '));
