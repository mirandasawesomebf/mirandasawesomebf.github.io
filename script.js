// Game state
let currentQuestion = 0;
let revealedAnswers = [];
let teamScores = [0, 0]; // Team A and Team B scores
let currentTeam = 0; // 0 for Team A, 1 for Team B

// Game state
let MAX_STRIKES = 3; // configurable via Settings panel
let strikes = [0, 0]; // Strikes for Team A and Team B (per question)
let eliminatedThisQuestion = [false, false]; // Track which teams are eliminated for current question
let gameOver = false;

// Normalize a list of raw weights to integer points summing to `total` (default 50)
function normalizePoints(weights, total = 50) {
    const sum = weights.reduce((a, b) => a + (Number(b) || 0), 0) || 1;
    // First pass: floor values
    const raw = weights.map(w => (Number(w) || 0) * total / sum);
    const base = raw.map(Math.floor);
    let rem = total - base.reduce((a, b) => a + b, 0);
    // Distribute remainders to largest fractional parts
    const fracIdx = raw
        .map((v, i) => ({ i, f: v - Math.floor(v) }))
        .sort((a, b) => b.f - a.f)
        .map(o => o.i);
    for (let k = 0; k < base.length && rem > 0; k++) {
        base[fracIdx[k]] += 1;
        rem--;
    }
    return base;
}

// Sample questions and answers with points (percentages)
const questions = [
    {
        question: "Name something Lynn can't live without",
        answers: [
            {number: 1, text: "Phone", points: 30, keywords: ["Phone"]},
            {number: 2, text: "Medicine", points: 24, keywords: ["Medicine", "Meds"]},
            {number: 3, text: "Roblox", points: 10, keywords: ["roblox"]},
            {number: 4, text: "water", points: 5, keywords: ["water"]},
            {number: 5, text: "food", points: 5, keywords: ["food"]},
            {number: 6, text: "Portable Charger", points: 3, keywords: ["Charger"]},
            {number: 7, text: "Ear Buds", points: 3, keywords: ["Ear Buds",]},
            {number: 8, text: "Louis/Family/Friends", points: 1, keywords: ["Louis","Family","Friends"]}
        ]
    },
    {
        question: "Fill in the blanks, name something that Lynn says all the time 'Im ___'",
        answers: [
            {number: 1, text: "Tired", points: 34, keywords: ["tired"]},
            {number: 2, text: "hungry", points: 27, keywords: ["hungry"]},
            {number: 3, text: "Bored", points: 15, keywords: ["bored"]},
            {number: 4, text: "Cold", points: 10, keywords: ["cold"]},
            {number: 5, text: "Sick", points: 5, keywords: ["sick"]},
            {number: 6, text: "Full", points: 3, keywords: ["full"]},
            {number: 7, text: "Excited", points: 3, keywords: ["excited"]},
            {number: 8, text: "Thirsty", points: 1, keywords: ["thirsty"]}
        ]
    },
    {
        question: "What's an emoji that Lynn, in particular, uses a lot?",
        answers: [
            {number: 1, text: "🥲", points: 32, keywords: ["🥲"]},
            {number: 2, text: "Chair", points: 28, keywords: ["chair"]},
            {number: 3, text: "🙂‍↕️", points: 22, keywords: ["🙂‍↕️"]},
            {number: 4, text: "😋", points: 20, keywords: ["😋"]},
            {number: 5, text: "☹️", points: 17, keywords: ["☹️"]},
            {number: 6, text: "🥹", points: 15, keywords: ["🥹"]},
            {number: 7, text: "💔", points: 11, keywords: ["💔"]},
            {number: 8, text: "🙃", points: 7, keywords: ["🙃"]}
        ]
    },
    {
        question: "What's something Lynn would do in her spare time",
        answers: [
            {number: 1, text: "Adopt Me/Roblox", points: 30, keywords: ["Adopt me", "Roblox"]},
            {number: 2, text: "Text/call Louis", points: 20, keywords: ["Louis"]},
            {number: 3, text: "Doom scroll", points: 10, keywords: ["tiktok", "reels", "doom scroll", "scroll"]},
            {number: 4, text: "Eat", points: 7, keywords: ["eat"]},
            {number: 5, text: "Listen to Music", points: 7, keywords: ["music"]},
            {number: 6, text: "Sleep", points: 5, keywords: ["sleep"]},
            {number: 7, text: "Bake or make something", points: 3, keywords: ["bake"]},
            {number: 8, text: "Go on a walk", points: 3, keywords: ["Walk"]}
        ]
    },
    {
        question: "Name something that Lynn snacks on a lot",
        answers: [
            {number: 1, text: "Konjac Shuang", points: 26, keywords: ["Konjac Shuang"]},
            {number: 2, text: "Chocolate", points: 23, keywords: ["Chocolate"]},
            {number: 3, text: "Proschuitto", points: 19, keywords: ["Proschuitto"]},
            {number: 4, text: "Ice Cream", points: 15, keywords: ["Ice Cream"]},
            {number: 5, text: "Kopiko", points: 12, keywords: ["Kopiko"]},
            {number: 6, text: "Jelly Sticks", points: 10, keywords: ["Jelly"]},
            {number: 7, text: "Wasabi Seaweed", points: 9, keywords: ["Seaweed"]},
            {number: 8, text: "Biscuits/crackers", points: 4, keywords: ["Biscuit", "Cracker"]}
        ]
    },
    {
        question: "A cop pulls you over for speeding. What's an excuse you can give to get out of a ticket",
        answers: [
            {number: 1, text: "Emergency/Hospital", weight: 40, keywords: ["emergency","hospital","er","medical"]},
            {number: 2, text: "Gotta potty", weight: 29, keywords: ["potty","bathroom","pee","restroom","toilet"]},
            {number: 3, text: "Didn't realize", weight: 15, keywords: ["didn't realize","did not realize","didn't know","did not know","didn't see","did not see"]},
            {number: 4, text: "Late for work", weight: 7, keywords: ["late","late for work","work"]},
            {number: 5, text: "Gas pedal stuck", weight: 2, keywords: ["gas pedal","stuck pedal","accelerator stuck","pedal"]},
            {number: 6, text: "Date night/Anniversary", weight: 2, keywords: ["date night","anniversary","date"]}
        ]
    },
    {
        question: "If a man plays this instrument, he's probably good at making love:",
        answers: [
            {number: 1, text: "Guitar", weight: 39, keywords: ["guitar"]},
            {number: 2, text: "Piano", weight: 19, keywords: ["piano","keyboard"]},
            {number: 3, text: "Drums", weight: 11, keywords: ["drums","drummer"]},
            {number: 4, text: "Sax", weight: 8, keywords: ["sax","saxophone"]},
            {number: 5, text: "Violin/Fiddle", weight: 8, keywords: ["violin","fiddle"]},
            {number: 6, text: "Flute", weight: 4, keywords: ["flute"]},
            {number: 7, text: "Harp", weight: 4, keywords: ["harp"]},
            {number: 8, text: "Trumpet", weight: 3, keywords: ["trumpet"]}
        ]
    },
    {
        question: "If you really want to see your man sweat, ask him for ___:",
        answers: [
            {number: 1, text: "Money", weight: 34, keywords: ["money","cash","bucks"]},
            {number: 2, text: "His phone", weight: 15, keywords: ["phone","cell","mobile","cellphone"]},
            {number: 3, text: "Engagement ring", weight: 10, keywords: ["engagement","ring","engagement ring"]},
            {number: 4, text: "Car/Rolls Royce", weight: 9, keywords: ["car","rolls","rolls royce","keys"]},
            {number: 5, text: "Divorce", weight: 7, keywords: ["divorce","papers"]},
            {number: 6, text: "Truth/Explanation", weight: 7, keywords: ["truth","explanation","honesty","why"]},
            {number: 7, text: "Sex/Threesome", weight: 5, keywords: ["sex","threesome"]},
            {number: 8, text: "A baby", weight: 3, keywords: ["baby","child","pregnancy","kid"]}
        ]
    },
    {
        question: "What's the most fun thing to do with another woman?",
        answers: [
            {number: 1, text: "Shop", weight: 46, keywords: ["shop","shopping","mall","retail therapy"]},
            {number: 2, text: "Yak/gossip", weight: 31, keywords: ["yak","gossip","talk","chat"]},
            {number: 3, text: "Dine out", weight: 6, keywords: ["dine","dining","eat out","restaurant"]},
            {number: 4, text: "Drink cocktails", weight: 5, keywords: ["drink","cocktails","booze","bar"]},
            {number: 5, text: "Laugh", weight: 4, keywords: ["laugh","laughter"]},
            {number: 6, text: "Make out", weight: 3, keywords: ["make out","kiss","smooch"]}
        ]
    },
    {
        question: "Having a bird poop on you is bad, but imagine how much worse it would be if ______ could fly.",
        answers: [
            {number: 1, text: "Elephants", weight: 29, keywords: ["elephant"]},
            {number: 2, text: "Cows", weight: 22, keywords: ["cow","cattle"]},
            {number: 3, text: "Pigs", weight: 21, keywords: ["pig","hog","swine"]},
            {number: 4, text: "Horses", weight: 12, keywords: ["horse"]},
            {number: 5, text: "Dogs", weight: 7, keywords: ["dog","dogs","puppy"]},
            {number: 6, text: "Humans", weight: 3, keywords: ["human","people","person"]},
            {number: 7, text: "Rats", weight: 2, keywords: ["rat","rats","rodent"]}
        ]
    },
    {
        question: "Name an animal that doesn't have a leg to stand on.",
        answers: [
            {number: 1, text: "Snake", weight: 59, keywords: ["snake","serpent"]},
            {number: 2, text: "Fish/shark/eel", weight: 23, keywords: ["fish","shark","eel"]},
            {number: 3, text: "Whale", weight: 5, keywords: ["whale"]},
            {number: 4, text: "Seal/sea lion", weight: 4, keywords: ["seal","sea lion"]},
            {number: 5, text: "Dolphin/porpoise", weight: 3, keywords: ["dolphin","porpoise"]},
            {number: 6, text: "Snail/slug", weight: 3, keywords: ["snail","slug"]},
            {number: 7, text: "Worm", weight: 2, keywords: ["worm","earthworm"]}
        ]
    },
    {
        question: "If Steve Harvey were your neighbor, name something of his you might ask to borrow.",
        answers: [
            {number: 1, text: "Car", weight: 24, keywords: ["car","ride","vehicle"]},
            {number: 2, text: "Suits/clothes", weight: 19, keywords: ["suit","suits","clothes","wardrobe"]},
            {number: 3, text: "$15 million/Money", weight: 17, keywords: ["money","cash","15 million","million"]},
            {number: 4, text: "Jokes/humour", weight: 7, keywords: ["jokes","humor","humour"]},
            {number: 5, text: "Mower/lawn service", weight: 5, keywords: ["mower","lawn","lawn service","lawnmower"]},
            {number: 6, text: "Sugar", weight: 5, keywords: ["sugar"]}
        ]
    },
    {
        question: "Name a place teens complain about going to:",
        answers: [
            {number: 1, text: "School/College", weight: 56, keywords: ["school","college","class"]},
            {number: 2, text: "Church", weight: 26, keywords: ["church","mass","service"]},
            {number: 3, text: "Family events", weight: 9, keywords: ["family","family events","relatives"]},
            {number: 4, text: "Doctor/Dentist", weight: 4, keywords: ["doctor","dentist","appointment","checkup"]},
            {number: 5, text: "Grocery store", weight: 2, keywords: ["grocery","store","shopping"]},
            {number: 6, text: "Work", weight: 2, keywords: ["work","job"]}
        ]
    },
    {
        question: "Name an animal that’s easy to act out in charades:",
        answers: [
            {number: 1, text: "Monkey/Ape", weight: 32, keywords: ["monkey","ape"]},
            {number: 2, text: "Dog", weight: 21, keywords: ["dog","puppy"]},
            {number: 3, text: "Cat", weight: 16, keywords: ["cat","kitty"]},
            {number: 4, text: "Bird", weight: 14, keywords: ["bird"]},
            {number: 5, text: "Elephant", weight: 4, keywords: ["elephant"]}
        ]
    },
    {
        question: "Name something you try to get rid of that always comes back.",
        answers: [
            {number: 1, text: "Weight", weight: 15, keywords: ["weight","fat","pounds"]},
            {number: 2, text: "Illness/Headache", weight: 11, keywords: ["illness","headache","cold"]},
            {number: 3, text: "Achne", weight: 8, keywords: ["acne","pimples","zits","ache"]},
            {number: 4, text: "Bugs/Ants", weight: 7, keywords: ["bugs","ants","insects","pest"]},
            {number: 5, text: "Loser Mate/Ex", weight: 7, keywords: ["ex","ex-boyfriend","ex-girlfriend","loser","mate"]},
            {number: 6, text: "Dust", weight: 6, keywords: ["dust","dusting"]},
            {number: 7, text: "Weeds", weight: 5, keywords: ["weed","weeds","dandelion"]},
            {number: 8, text: "Hair", weight: 5, keywords: ["hair","hair growth"]}
        ]
    }
];

// DOM Elements
const questionElement = document.getElementById('question');
const answersContainer = document.querySelector('.answers');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const revealBtn = document.getElementById('revealBtn');
const nextBtn = document.getElementById('nextBtn');
const team1Btn = document.getElementById('team1Btn');
const team2Btn = document.getElementById('team2Btn');
const feedbackElement = document.getElementById('feedback');
const correctSound = document.getElementById('correctSound');
const wrongSound = document.getElementById('wrongSound');
const teamNameInputs = [
    document.getElementById('team1Name'),
    document.getElementById('team2Name')
];
const teamNameDisplays = [
    document.querySelector('#team1 h3'),
    document.querySelector('#team2 h3')
];
const teamScoreElements = [
    document.querySelector('#team1 .score'),
    document.querySelector('#team2 .score')
];

// Track team names
let teamNames = ['TEAM A', 'TEAM B'];

// Settings elements
let settingsPanel, settingsOpenBtn, settingsCloseBtn, maxStrikesInput, resetStrikesBtn, pointsEditorEl;
let team1SettingsStrikeMinus, team1SettingsStrikePlus, team2SettingsStrikeMinus, team2SettingsStrikePlus;
let team1StrikeValueEl, team2StrikeValueEl, team1StrikeLabelEl, team2StrikeLabelEl;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Show the team naming modal
    document.getElementById('startGameBtn').addEventListener('click', () => {
        // Save team names
        teamNames = [
            teamNameInputs[0].value.trim() || 'TEAM A',
            teamNameInputs[1].value.trim() || 'TEAM B'
        ];
        
        // Update team name displays
        teamNameDisplays[0].textContent = teamNames[0];
        teamNameDisplays[1].textContent = teamNames[1];
        // Update team add-score button labels
        if (team1Btn) team1Btn.textContent = `${teamNames[0]} +`;
        if (team2Btn) team2Btn.textContent = `${teamNames[1]} +`;
        
        // Hide modal and show game
        document.getElementById('teamNamingModal').style.display = 'none';
        document.querySelector('.game-container').style.display = 'block';
        
        // Initialize the game
        initGame();
    });

    // Cache settings DOM elements after game container exists
    settingsPanel = document.getElementById('settingsPanel');
    settingsOpenBtn = document.getElementById('settingsToggle');
    settingsCloseBtn = document.getElementById('settingsClose');
    maxStrikesInput = document.getElementById('maxStrikesInput');
    resetStrikesBtn = document.getElementById('resetStrikesBtn');
    pointsEditorEl = document.getElementById('pointsEditor');
    team1SettingsStrikeMinus = document.getElementById('team1SettingsStrikeMinus');
    team1SettingsStrikePlus = document.getElementById('team1SettingsStrikePlus');
    team2SettingsStrikeMinus = document.getElementById('team2SettingsStrikeMinus');
    team2SettingsStrikePlus = document.getElementById('team2SettingsStrikePlus');
    team1StrikeValueEl = document.getElementById('team1StrikeValue');
    team2StrikeValueEl = document.getElementById('team2StrikeValue');
    team1StrikeLabelEl = document.getElementById('team1StrikeLabel');
    team2StrikeLabelEl = document.getElementById('team2StrikeLabel');

    if (settingsOpenBtn) settingsOpenBtn.addEventListener('click', openSettings);
    if (settingsCloseBtn) settingsCloseBtn.addEventListener('click', closeSettings);
    if (maxStrikesInput) maxStrikesInput.addEventListener('change', onMaxStrikesChange);
    if (resetStrikesBtn) resetStrikesBtn.addEventListener('click', () => {
        setTeamStrikes(0, 0);
        setTeamStrikes(1, 0);
    });
    if (team1SettingsStrikeMinus) team1SettingsStrikeMinus.addEventListener('click', () => { adjustStrikes(0, -1); updateSettingsStrikeUI(); if (!canTeamPlay(currentTeam)) switchToNextAvailableTeam(); });
    if (team1SettingsStrikePlus) team1SettingsStrikePlus.addEventListener('click', () => { adjustStrikes(0, 1); updateSettingsStrikeUI(); if (!canTeamPlay(currentTeam)) switchToNextAvailableTeam(); });
    if (team2SettingsStrikeMinus) team2SettingsStrikeMinus.addEventListener('click', () => { adjustStrikes(1, -1); updateSettingsStrikeUI(); if (!canTeamPlay(currentTeam)) switchToNextAvailableTeam(); });
    if (team2SettingsStrikePlus) team2SettingsStrikePlus.addEventListener('click', () => { adjustStrikes(1, 1); updateSettingsStrikeUI(); if (!canTeamPlay(currentTeam)) switchToNextAvailableTeam(); });

    // Fallback delegated handlers in case buttons are re-rendered
    document.addEventListener('click', (e) => {
        const t = e.target;
        if (!t) return;
        if (t.id === 'settingsToggle') { e.preventDefault(); openSettings(); }
        if (t.id === 'settingsClose') { e.preventDefault(); closeSettings(); }
    });
});

function openSettings() {
    if (!settingsPanel) return;
    // Sync inputs with current state
    if (maxStrikesInput) maxStrikesInput.value = String(MAX_STRIKES);
    renderPointsEditor();
    updateSettingsStrikeUI();
    settingsPanel.classList.add('open');
}

function closeSettings() {
    if (!settingsPanel) return;
    settingsPanel.classList.remove('open');
}

function onMaxStrikesChange() {
    if (!maxStrikesInput) return;
    let val = parseInt(maxStrikesInput.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 9) val = 9; // reasonable upper bound
    MAX_STRIKES = val;
    // Clamp existing strikes and elimination states, then redraw
    setTeamStrikes(0, strikes[0]);
    setTeamStrikes(1, strikes[1]);
    updateSettingsStrikeUI();
}

function renderPointsEditor() {
    if (!pointsEditorEl) return;
    const answers = questions[currentQuestion]?.answers || [];
    // Build editor rows
    const rows = answers.map((ans, i) => {
        return `
        <div class="points-row">
            <div class="points-label">#${ans.number}</div>
            <input type="number" class="points-input" data-index="${i}" value="${ans.points}" min="0" max="999">
        </div>`;
    }).join('');
    pointsEditorEl.innerHTML = rows || '<div class="muted">No answers loaded.</div>';
    // Attach listeners
    pointsEditorEl.querySelectorAll('.points-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'), 10);
            let val = parseInt(e.target.value, 10);
            if (isNaN(val) || val < 0) val = 0;
            if (val > 999) val = 999;
            // Update data model
            if (questions[currentQuestion] && questions[currentQuestion].answers[idx]) {
                questions[currentQuestion].answers[idx].points = val;
            }
            // Update board DOM: dataset and visible points
            const els = document.querySelectorAll('.answer');
            if (els[idx]) {
                els[idx].dataset.points = String(val);
                const ps = els[idx].querySelector('.answer-points');
                if (ps) ps.textContent = String(val);
            }
        });
    });
}

// Keep the Settings panel's strike section in sync with current values and names
function updateSettingsStrikeUI() {
    if (team1StrikeValueEl) team1StrikeValueEl.textContent = String(strikes[0] || 0);
    if (team2StrikeValueEl) team2StrikeValueEl.textContent = String(strikes[1] || 0);
    if (team1StrikeLabelEl) team1StrikeLabelEl.textContent = teamNames[0] || 'Team 1';
    if (team2StrikeLabelEl) team2StrikeLabelEl.textContent = teamNames[1] || 'Team 2';
}

// Make score editable
function makeScoreEditable(scoreElement, teamIndex) {
    scoreElement.addEventListener('click', () => {
        const currentScore = scoreElement.textContent;
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentScore;
        input.style.width = '80px';
        input.style.textAlign = 'center';
        input.style.fontSize = '24px';
        input.style.border = '2px solid #FFD700';
        input.style.borderRadius = '5px';
        
        // Replace score with input
        scoreElement.textContent = '';
        scoreElement.appendChild(input);
        input.select();
        
        function saveScore() {
            const newScore = parseInt(input.value) || 0;
            teamScores[teamIndex] = newScore;
            updateScores();
            input.removeEventListener('blur', saveScore);
        }
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveScore();
            } else if (e.key === 'Escape') {
                updateScores();
            }
        });
        
        input.addEventListener('blur', saveScore);
    });
}

// Initialize the game
function initGame() {
    currentQuestion = 0;
    revealedAnswers = [];
    loadQuestion(currentQuestion);
    updateScores();
    highlightTeam(currentTeam);
    
    // Make scores editable
    const team1Score = document.querySelector('.team:nth-child(1) .score');
    const team2Score = document.querySelector('.team:nth-child(3) .score');
    makeScoreEditable(team1Score, 0);
    makeScoreEditable(team2Score, 1);
    
    // Set focus to answer input
    answerInput.focus();
}

// Update team scores display
function updateScores() {
    teamScoreElements.forEach((el, index) => {
        el.textContent = teamScores[index];
    });
}

// Add points to a team's score
function addPointsToTeam(teamIndex, points) {
    teamScores[teamIndex] += points;
    updateScores();
    highlightTeam(teamIndex);
}

// Highlight the active team
function highlightTeam(teamIndex) {
    // Remove highlight from both teams first
    document.querySelectorAll('.team').forEach((team, index) => {
        team.classList.remove('active');
        // Update team name display
        if (teamNames[index]) {
            const nameElement = team.querySelector('h3');
            if (nameElement) {
                nameElement.textContent = teamNames[index];
            }
        }
    });
    
    // Add highlight to current team
    const teamElement = teamIndex === 0 ? document.querySelector('#team1') : document.querySelector('#team2');
    if (teamElement) {
        teamElement.classList.add('active');
    }

    // Update turn indicator text
    const turnEl = document.getElementById('turnIndicator');
    if (turnEl) {
        turnEl.textContent = `${teamNames[teamIndex]} turn`;
    }
}

// Load a new question
function loadQuestion(questionIndex) {
    if (questionIndex >= 0 && questionIndex < questions.length) {
        currentQuestion = questionIndex;
        const question = questions[questionIndex];
        questionElement.textContent = question.question;
        const qNumEl = document.getElementById('questionNumber');
        if (qNumEl) {
            qNumEl.textContent = `Question ${currentQuestion + 1} / ${questions.length}`;
        }
        
        // Ensure total points = 50 using weights if provided, else current points
        try {
            const weights = question.answers.map(a => typeof a.weight === 'number' ? a.weight : (typeof a.points === 'number' ? a.points : 0));
            const norm = normalizePoints(weights, 50);
            question.answers.forEach((a, i) => { a.points = norm[i]; });
        } catch (_) { /* ignore */ }
        
        // Clear previous answers and history
        answersContainer.innerHTML = '';
        revealedAnswers = [];
        answerHistory = [];
        
        // Reset strikes and elimination for new question
        strikes = [0, 0];
        eliminatedThisQuestion = [false, false];
        updateStrikes();
        // Keep settings panel (if open) in sync
        if (typeof updateSettingsStrikeUI === 'function') updateSettingsStrikeUI();
        
        // Reset to first team that can play
        currentTeam = 0;
        if (!canTeamPlay(0) && canTeamPlay(1)) {
            currentTeam = 1;
        }
        
        // Create answer elements in data order
        question.answers.forEach((answer, index) => {
            const answerElement = document.createElement('div');
            answerElement.className = 'answer hidden';
            answerElement.dataset.points = answer.points;
            
            const numberSpan = document.createElement('span');
            numberSpan.className = 'answer-number';
            numberSpan.textContent = answer.number;
            
            const textSpan = document.createElement('span');
            textSpan.className = 'answer-text';
            textSpan.textContent = answer.text;
            
            const pointsSpan = document.createElement('span');
            pointsSpan.className = 'answer-points';
            pointsSpan.textContent = answer.points;
            
            answerElement.appendChild(numberSpan);
            answerElement.appendChild(textSpan);
            answerElement.appendChild(pointsSpan);
            
            answersContainer.appendChild(answerElement);
        });
        
        // Clear feedback and reset team highlighting
        feedbackElement.textContent = '';
        feedbackElement.className = 'feedback';
        highlightTeam(currentTeam);
        
        // Set focus to answer input
        answerInput.value = '';
        answerInput.focus();
    }
}

// Check if the submitted answer is correct
function checkAnswer(userAnswer) {
    if (!userAnswer || gameOver) return -1;
    
    const answers = questions[currentQuestion].answers;
    const normalized = userAnswer.trim().toLowerCase();
    
    // Check each answer's keywords (case-insensitive) and the answer text itself
    for (let i = 0; i < answers.length; i++) {
        if (revealedAnswers.includes(i)) continue; // Skip already revealed answers
        
        const answer = answers[i];
        const keywords = Array.isArray(answer.keywords) ? answer.keywords : [];
        // Build a list of terms to match against: keywords + answer text
        const terms = [answer.text, ...keywords]
            .filter(Boolean)
            .map(term => String(term).trim().toLowerCase());
        
        // A match occurs if any term is contained in the input or vice-versa
        const isMatch = terms.some(term => term && (normalized.includes(term) || term.includes(normalized)));
        if (isMatch) {
            return i; // Return index of the correct answer
        }
    }
    
    // If no match found, it's a strike
    return -1;
}

// Hide the last revealed answer
function hideLastAnswer() {
    if (answerHistory.length === 0) return false;
    
    const lastAction = answerHistory.pop();
    const answerElements = document.querySelectorAll('.answer');
    const answerElement = answerElements[lastAction.index];
    
    // Remove the answer from revealed answers
    const answerIndex = revealedAnswers.indexOf(lastAction.index);
    if (answerIndex > -1) {
        revealedAnswers.splice(answerIndex, 1);
    }
    
    // Hide the answer
    answerElement.classList.add('hidden');
    answerElement.classList.remove('correct');
    
    // Deduct points from the team that got them
    addPointsToTeam(lastAction.team, -lastAction.points);
    
    // Update feedback
    showFeedback(`Undo: Removed ${lastAction.points} points from Team ${lastAction.team === 0 ? 'A' : 'B'}`, 'info');
    
    // Switch back to the team that was playing before this answer
    currentTeam = lastAction.team;
    highlightTeam(currentTeam);
    
    return true;
}

// Reveal an answer by index
function revealAnswer(index, awardPoints = true) {
    const answerElements = document.querySelectorAll('.answer');
    
    if (index >= 0 && index < answerElements.length && !revealedAnswers.includes(index)) {
        const answerElement = answerElements[index];
        const points = parseInt(answerElement.dataset.points);
        
        answerElement.classList.remove('hidden');
        answerElement.classList.add('correct');
        revealedAnswers.push(index);
        
        if (awardPoints) {
            // Save to history for undo
            answerHistory.push({
                index: index,
                points: points,
                team: currentTeam
            });
            
            // Add points to current team
            addPointsToTeam(currentTeam, points);
            
            // Play correct sound
            correctSound.currentTime = 0;
            correctSound.play();
            
            // Show feedback with points
            showFeedback(`+${points} points for ${teamNames[currentTeam]}! Next team's turn!`, 'correct');
            
            // Switch to the other team
            currentTeam = (currentTeam + 1) % 2;
            highlightTeam(currentTeam);
        }
        
        return true;
    }
    
    return false;
}

// Show feedback message
function showFeedback(message, type = 'info') {
    feedbackElement.textContent = message;
    feedbackElement.className = 'feedback';
    if (type) {
        feedbackElement.classList.add(type);
    }
    
    // Clear feedback after 2 seconds
    setTimeout(() => {
        if (feedbackElement.textContent === message) {  // Only clear if message hasn't changed
            feedbackElement.textContent = '';
            feedbackElement.className = 'feedback';
        }
    }, 2000);
}

// Show big X for wrong answer
function showStrike() {
    const wrongAnswerOverlay = document.createElement('div');
    wrongAnswerOverlay.className = 'wrong-answer-overlay';
    wrongAnswerOverlay.innerHTML = `
        <div style="font-size: 1em;">✕</div>
        <div class="wrong-answer-text">
            ${teamNames[currentTeam]}\nWRONG ANSWER!
        </div>
    `;
    document.body.appendChild(wrongAnswerOverlay);
    
    // Animate in
    setTimeout(() => {
        wrongAnswerOverlay.classList.add('show');
        
        // Remove after animation
        setTimeout(() => {
            wrongAnswerOverlay.classList.remove('show');
            setTimeout(() => {
                if (wrongAnswerOverlay.parentNode) {
                    document.body.removeChild(wrongAnswerOverlay);
                }
            }, 1000);
        }, 2000);
    }, 0);
}

// Update strike display
function updateStrikes() {
    const team1Strikes = document.getElementById('team1Strikes');
    const team2Strikes = document.getElementById('team2Strikes');
    
    team1Strikes.textContent = '❌'.repeat(strikes[0]) + '⚪'.repeat(MAX_STRIKES - strikes[0]);
    team2Strikes.textContent = '❌'.repeat(strikes[1]) + '⚪'.repeat(MAX_STRIKES - strikes[1]);
    
    // Update team display based on elimination status
    const team1El = document.getElementById('team1');
    const team2El = document.getElementById('team2');
    
    if (eliminatedThisQuestion[0]) {
        team1El.style.opacity = '0.5';
    } else {
        team1El.style.opacity = '1';
    }
    
    if (eliminatedThisQuestion[1]) {
        team2El.style.opacity = '0.5';
    } else {
        team2El.style.opacity = '1';
    }
}

// Manually adjust strikes without triggering overlays/messages
function setTeamStrikes(teamIndex, value) {
    const clamped = Math.max(0, Math.min(MAX_STRIKES, value | 0));
    strikes[teamIndex] = clamped;
    eliminatedThisQuestion[teamIndex] = clamped >= MAX_STRIKES;
    updateStrikes();
}

function adjustStrikes(teamIndex, delta) {
    setTeamStrikes(teamIndex, (strikes[teamIndex] || 0) + delta);
}

// Check if a team can still play the current question
function canTeamPlay(teamIndex) {
    return !eliminatedThisQuestion[teamIndex] && strikes[teamIndex] < MAX_STRIKES;
}

// Switch to the next available team that can still play
function switchToNextAvailableTeam() {
    const originalTeam = currentTeam;
    let nextTeam = (currentTeam + 1) % 2;
    
    // Find next team that can still play
    while (nextTeam !== originalTeam && !canTeamPlay(nextTeam)) {
        nextTeam = (nextTeam + 1) % 2;
    }
    
    // If we made a full loop and couldn't find a team that can play
    if (nextTeam === originalTeam && !canTeamPlay(nextTeam)) {
        showFeedback('No teams can answer this question!', 'error');
        return false;
    }
    
    currentTeam = nextTeam;
    highlightTeam(currentTeam);
    return true;
}

// Add a strike to the current team
function addStrike() {
    if (strikes[currentTeam] < MAX_STRIKES) {
        strikes[currentTeam]++;
        updateStrikes();
        
        // Show big X with team name
        showStrike();
        
        // Check if team is eliminated from this question
        if (strikes[currentTeam] >= MAX_STRIKES) {
            eliminatedThisQuestion[currentTeam] = true;
            showFeedback(`${teamNames[currentTeam]} is out of this question!`, 'error');
            
            // Check if all teams are eliminated
            if (eliminatedThisQuestion.every(eliminated => eliminated)) {
                showFeedback('All teams eliminated from this question!', 'error');
            }
        }
    }
}

// Show game over screen (when all questions are answered)
function showGameOver() {
    const ranking = [0,1]
        .map(idx => ({ idx, name: teamNames[idx], score: teamScores[idx] }))
        .sort((a,b) => b.score - a.score);
    answersContainer.innerHTML = `
        <div class="game-over">
            <h2>All Questions Complete!</h2>
            <h3>Final Ranking</h3>
            <ol class="final-ranking">
                ${ranking.map(r => `<li>${r.name}: ${r.score}</li>`).join('')}
            </ol>
            <button id="playAgainBtn">Play Again</button>
        </div>
    `;
    const playBtn = document.getElementById('playAgainBtn');
    if (playBtn) playBtn.addEventListener('click', initGame);
}

// Event Listeners
submitBtn.addEventListener('click', () => {
    if (gameOver || !canTeamPlay(currentTeam)) return;
    
    const userAnswer = answerInput.value.trim();
    if (!userAnswer) return;
    
    const answerIndex = checkAnswer(userAnswer);
    
    if (answerIndex !== -1) {
        // Correct answer
        revealAnswer(answerIndex);
        answerInput.value = '';
    } else {
        // Wrong answer
        wrongSound.currentTime = 0;
        wrongSound.play();
        showFeedback('Wrong answer!', 'error');
        
        // Add strike to current team
        addStrike();
        
        // Check if team is eliminated from this question
        if (strikes[currentTeam] >= MAX_STRIKES) {
            eliminatedThisQuestion[currentTeam] = true;
            const teamName = currentTeam === 0 ? 'A' : 'B';
            showFeedback(`Team ${teamName} is out of this question!`, 'error');
            
            // Check if all teams are eliminated
            if (eliminatedThisQuestion.every(eliminated => eliminated)) {
                showFeedback('All teams eliminated from this question!', 'error');
                return;
            }
        }
        
        // Switch to next available team
        switchToNextAvailableTeam();
    }
});


// Allow Enter key to submit answer
answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitBtn.click();
    }
});

// Reveal next answer button (reverse order: 8 -> 1)
revealBtn.addEventListener('click', () => {
    const answerElements = document.querySelectorAll('.answer');
    if (revealedAnswers.length >= answerElements.length) return;

    // Find next unrevealed index from the end (e.g., 7 down to 0)
    let nextAnswerIndex = -1;
    for (let i = answerElements.length - 1; i >= 0; i--) {
        if (!revealedAnswers.includes(i)) {
            nextAnswerIndex = i;
            break;
        }
    }

    if (nextAnswerIndex !== -1) {
        // Host-driven reveal: do not award points or switch turns
        revealAnswer(nextAnswerIndex, false);
    }
});

// Next Question button
nextBtn.addEventListener('click', () => {
    if (currentQuestion >= questions.length - 1) {
        gameOver = true;
        showGameOver();
        return;
    }
    currentQuestion = currentQuestion + 1;
    loadQuestion(currentQuestion);
});

// Team buttons
team1Btn.addEventListener('click', () => {
    currentTeam = 0;
    highlightTeam(currentTeam);
    showFeedback(`${teamNames[0]} selected`, 'correct');
});

team2Btn.addEventListener('click', () => {
    currentTeam = 1;
    highlightTeam(currentTeam);
    showFeedback(`${teamNames[1]} selected`, 'correct');
});

// Game starts from the modal's Start button; no auto-init here

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space to reveal next answer
    if (e.code === 'Space' && e.target !== answerInput) {
        e.preventDefault();
        revealBtn.click();
    }
    
    // N for next question
    if (e.code === 'KeyN' && e.ctrlKey) {
        nextBtn.click();
    }
    
    // 1 for Team A, 2 for Team B
    if (e.key === '1') {
        team1Btn.click();
    } else if (e.key === '2') {
        team2Btn.click();
    }
});
