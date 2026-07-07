// fetch-hsk.js
const fs = require('fs');

async function getHSK1() {
  console.log("📥 Fetching a clean HSK dataset...");
  try {
    const response = await fetch('https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/master/wordlists/exclusive/old/1.json');
    const rawText = await response.text();
    const data = JSON.parse(rawText.trim());
    
    const formatted = data.map((item, index) => {
      let pinyin = "";
      let meaning = "Vocabulary Word";
      
      // Navigate the deeply nested structure safely
      if (item.forms && item.forms.length > 0) {
        const primaryForm = item.forms[0];
        
        // 1. Extract Pinyin
        if (primaryForm.transcriptions && primaryForm.transcriptions.pinyin) {
          pinyin = primaryForm.transcriptions.pinyin;
        }
        
        // 2. Extract Meanings (Grab the first 2 definitions and combine them cleanly)
        if (primaryForm.meanings && primaryForm.meanings.length > 0) {
          meaning = primaryForm.meanings.slice(0, 2).join(', ');
        }
      }

      return {
        id: `1_${index + 1}`,
        char: item.simplified || item.word,
        pinyin: pinyin,
        meaning: meaning,
        level: 1
      };
    });

    // Save to your dedicated folder path
    fs.writeFileSync('../characters/hsk1.json', JSON.stringify(formatted, null, 2));
    console.log(`\n✅ Success! Recreated hsk1.json with ${formatted.length} fully-parsed words.`);
  } catch (error) {
    console.error("❌ Extraction failed:", error);
  }
}

getHSK1();
