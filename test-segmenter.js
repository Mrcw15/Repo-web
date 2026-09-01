const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
const text = '🔥🚀👨‍👩‍👧‍👦2️⃣';
console.log(Array.from(segmenter.segment(text)).map(s => s.segment));
