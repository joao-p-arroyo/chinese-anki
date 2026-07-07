// fetch-hsk.js
const fs = require('fs');

async function getHSK1() {
  console.log("📥 Fetching and blocking HSK dataset...");
  try {
    const response = await fetch('https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/master/wordlists/exclusive/old/1.json');
    const rawText = await response.text();
    const data = JSON.parse(rawText.trim());
    
    const formatted = data.map((item, index) => {
      let pinyin = "";
      let meaning = "Vocabulary Word";
      
      if (item.forms && item.forms.length > 0) {
        const primaryForm = item.forms[0];
        if (primaryForm.transcriptions && primaryForm.transcriptions.pinyin) {
          pinyin = primaryForm.transcriptions.pinyin;
        }
        if (primaryForm.meanings && primaryForm.meanings.length > 0) {
          meaning = primaryForm.meanings.slice(0, 2).join(', ');
        }
      }

      // NEW: Calculate block group assignment (30 words per block)
      // Words 1-30 -> Block 1, Words 31-60 -> Block 2, etc.
      const blockNumber = Math.floor(index / 30) + 1;

      return {
        id: `1_${index + 1}`,
        char: item.simplified || item.word,
        pinyin: pinyin,
        meaning: meaning,
        level: 1,
        block: blockNumber // Embedded block identifier
      };
    });

    fs.writeFileSync('../characters/hsk1.json', JSON.stringify(formatted, null, 2));
    console.log(`\n✅ Success! Created hsk1.json with ${formatted.length} words divided into blocks.`);
  } catch (error) {
    console.error("❌ Extraction failed:", error);
  }
}

getHSK1();
