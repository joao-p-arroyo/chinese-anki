// fetch-hsk.js
const fs = require('fs');

async function getHSK1() {
  console.log("📥 Fetching a clean HSK dataset...");
  try {
    // Using a rock-solid, structured complete-hsk vocabulary repository
    const response = await fetch('https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/master/wordlists/exclusive/old/1.json');
    
    // Read response as text first to avoid parser failures if headers contain unexpected data
    const rawText = await response.text();
    const cleanText = rawText.trim();
    const data = JSON.parse(cleanText);
    
    // Map data to match your application's explicit schema
    const formatted = data.map((item, index) => {
      // Extract definitions cleanly, cleaning up long texts or arrays if necessary
      let meaning = "";
      if (Array.isArray(item.definitions)) {
        meaning = item.definitions.slice(0, 2).join(', ');
      } else {
        meaning = item.definition || "Vocabulary Word";
      }

      return {
        id: `1_${index + 1}`,
        char: item.simplified || item.word,
        pinyin: item.pinyin || "",
        meaning: meaning,
        level: 1
      };
    });

    // Write file locally
    fs.writeFileSync('../characters/hsk1.json', JSON.stringify(formatted, null, 2));
    console.log(`\n✅ Success! Created hsk1.json containing ${formatted.length} words.`);
  } catch (error) {
    console.error("❌ Extraction failed:", error);
  }
}

getHSK1();
