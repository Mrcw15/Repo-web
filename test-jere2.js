fetch("https://api.jerexd.my.id/api/whatsapp/reactch", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ apikey: "jere_yixlYyX0LUHB", url: "https://whatsapp.com/channel/0029Vak8y20JuyAB39N1N10t/123", reaction: "🔥,👍" })
}).then(async r => {
  console.log("HTTP:", r.status);
  console.log("Body:", await r.text());
}).catch(console.error);
