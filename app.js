// Sample starter vocabulary deck
const initialDeck = [
    { id: 1, hanzi: "你好", pinyin: "nǐ hǎo", meaning: "Hello", interval: 1, repetition: 0, efactor: 2.5, dueDate: Date.now() },
    { id: 2, hanzi: "谢谢", pinyin: "xièxie", meaning: "Thank you", interval: 1, repetition: 0, efactor: 2.5, dueDate: Date.now() },
    { id: 3, hanzi: "再见", pinyin: "zàijiàn", meaning: "Goodbye", interval: 1, repetition: 0, efactor: 2.5, dueDate: Date.now() }
];

// Load from localStorage or set defaults
let deck = JSON.parse(localStorage.getItem('chinese_anki_deck')) || initialDeck;
let dueCards = [];
let currentCard = null;

// DOM Elements
const cardFront = document.getElementById('card-front');
const cardBack = document.getElementById('card-back');
const cardPinyin = document.getElementById('card-pinyin');
const cardMeaning = document.getElementById('card-meaning');
const btnShow = document.getElementById('btn-show');
const sm2Buttons = document.getElementById('sm2-buttons');
const cardCountSpan = document.getElementById('card-count');
const flashcardDiv = document.getElementById('flashcard');
const emptyStateDiv = document.getElementById('empty-state');

function saveDeck() {
    localStorage.setItem('chinese_anki_deck', JSON.stringify(deck));
}

function filterDueCards() {
    const now = Date.now();
    dueCards = deck.filter(card => card.dueDate <= now);
    cardCountSpan.innerText = `${dueCards.length} Due`;
}

function nextCard() {
    filterDueCards();
    if (dueCards.length === 0) {
        flashcardDiv.classList.add('hidden');
        emptyStateDiv.classList.remove('hidden');
        return;
    }
    
    emptyStateDiv.classList.add('hidden');
    flashcardDiv.classList.remove('hidden');
    
    // Pick the first due card
    currentCard = dueCards[0];
    cardFront.innerText = currentCard.hanzi;
    cardPinyin.innerText = currentCard.pinyin;
    cardMeaning.innerText = currentCard.meaning;
    
    // Reset view visibility
    cardBack.classList.add('hidden');
    sm2Buttons.classList.add('hidden');
    btnShow.classList.remove('hidden');
}

// SM-2 Algorithm adaptation
function handleReview(quality) {
    let { interval, repetition, efactor } = currentCard;

    if (quality >= 3) {
        if (repetition === 0) {
            interval = 1;
        } else if (repetition === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * efactor);
        }
        repetition++;
    } else {
        repetition = 0;
        interval = 1;
    }

    // Update E-Factor
    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) efactor = 1.3;

    // Set new due date (Interval represents number of days)
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + interval);
    
    // Save state back to card
    currentCard.interval = interval;
    currentCard.repetition = repetition;
    currentCard.efactor = efactor;
    currentCard.dueDate = newDueDate.getTime();

    saveDeck();
    nextCard();
}

// Event Listeners
btnShow.addEventListener('click', () => {
    cardBack.classList.remove('hidden');
    btnShow.classList.add('hidden');
    sm2Buttons.classList.remove('hidden');
    sm2Buttons.classList.add('grid');
});

document.querySelectorAll('#sm2-buttons button').forEach(button => {
    button.addEventListener('click', (e) => {
        const q = parseInt(e.target.getAttribute('data-q'));
        handleReview(q);
    });
});

nextCard();
