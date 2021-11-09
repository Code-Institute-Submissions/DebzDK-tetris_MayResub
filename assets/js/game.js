/* jshint esversion: 8 */

//#region Global variables
const CANVAS = document.getElementById('tetris');
const PREVIEW_CANVAS = document.getElementById('preview-block');
const TET_GRID = CANVAS.getContext('2d');
const PRE_TET_GRID = PREVIEW_CANVAS.getContext('2d');

let board;
let nextBlockPreview;
let block;
let nextBlock;

let canvasWidth;
let canvasHeight;
let blockX;
let blockY;

let timer;
let gameSpeed = 1000;
let statPlaceholder = '.........';

let musicPlayer;
let soundFolderPath = 'assets/sounds/';
let tetrisTrackPath = soundFolderPath + 'tetris-gameboy-02.mp3';
let gameOverTrackPath = soundFolderPath + 'game-over.mp3';

let currentScore = 0;
let baseScorePerLinesCleared = [40, 100, 300, 1200];
let level = 0;
let scoreKey = 'port-2-tet-highScores';

let isPlaying = false;
let isPaused = false;
let isFalling = false;
let isGameOver = false;
let isSoundOn = false;
//#endregion

//#region Game event listeners
// Arrow key pressed
document.addEventListener('keydown', function(e) {
    if (isPlaying) {
        switch (e.key) {
            case 'ArrowLeft':
                if (blockX + block.currentBlock.xOffset > 0) {
                    moveLf();
                }
                break;
            case 'ArrowRight':
                if (blockX + block.currentBlock.xOffset + block.currentBlock.width < canvasWidth) {
                    moveRg();
                }
                break;
            case 'ArrowUp':
                drawBlock(true);
                block.rotateBlockClockwise();
                drawBlock();
                break;
            case 'ArrowDown':
                if (gameSpeed !== 100) {
                    setGameSpeed(100);
                }
        }
    } else {
        if (e.key === 'ArrowDown') {
            cycleThroughMenu('#main-menu-options', 'game-play');
        } else if (e.key === 'ArrowUp') {
            cycleThroughMenu('#main-menu-options', 'game-credits', true);
        } else if (e.key === 'Enter') {
            processMenuOption(e.target.id);
        }
    }
});

// Arrow key released
document.addEventListener('keyup', function(e) {
    if (isPlaying) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') setGameSpeed(1000);
    }
});
//#endregion

//#region Game functions
/**
 * Initialises the game board
 */
function initialiseBoard() {
    board = new Board(TET_GRID);

    // Board dimensions setup
    TET_GRID.canvas.width = COLS * BLOCK_SIZE;
    TET_GRID.canvas.height = ROWS * BLOCK_SIZE;
    TET_GRID.scale(BLOCK_SIZE, BLOCK_SIZE);

    // Tetris block border setup
    TET_GRID.strokeStyle = 'white';
    TET_GRID.lineWidth = 0.2;

    canvasWidth = TET_GRID.canvas.width;
    canvasHeight = TET_GRID.canvas.height;
}

/**
 * Initialises the next block preview canvas
 */
function initialiseNextBlockPreview() {
    nextBlockPreview = new Board(PRE_TET_GRID);

    // Board dimensions setup
    PRE_TET_GRID.canvas.width = COLS * 5;
    PRE_TET_GRID.canvas.height = COLS * 5;
    PRE_TET_GRID.scale(30, 30);

    // Tetris block border setup
    PRE_TET_GRID.strokeStyle = 'white';
    PRE_TET_GRID.lineWidth = 0.2;
}

/**
 * Initialises the game stats
 * @param {boolean} withPlaceholder - if stats should be initialised with placeholder value
 */
function initialiseStats(withPlaceholder) {
    if (withPlaceholder) {
        updateScore(statPlaceholder);
        document.getElementById('score').textContent = statPlaceholder;
        document.getElementById('level').textContent = statPlaceholder;
    } else {
        updateScore();
        document.getElementById('level').textContent = level;
    }
}

/**
 * Updates score value in stats box with current score
 */
function updateScore() {
    document.getElementById('score').textContent = currentScore;
}

/**
 * Increments score variable
 */
function incrementScore(numOfLinesCleared) {
    let baseScore = baseScorePerLinesCleared[numOfLinesCleared - 1] || baseScorePerLinesCleared[4];

    currentScore += baseScore * (level + 1);
}

/**
 * Stores score as highscore in local storage to persist value
 */
function storeHighScore() {
    if (currentScore > 0) {
        let leaderBoard = getHighScores();
        let playerName = document.getElementById('player').value;
        let playerEntryIndex = getIndexOfHighScoreForPlayer(playerName);

        if (playerEntryIndex > -1) {
            let playerEntry = leaderBoard[playerEntryIndex];
            if (playerEntry.score < currentScore) {
                leaderBoard[playerEntryIndex].score = currentScore;
            }

            let indexToInsertInto = playerEntryIndex;
            while (indexToInsertInto - 1 > -1) {
                indexToInsertInto--;
                let entryAbovePlayer = leaderBoard[indexToInsertInto];

                if (entryAbovePlayer.score > currentScore) {
                    break;
                }
            }

            if (indexToInsertInto !== playerEntryIndex) {
                leaderBoard.splice(indexToInsertInto, 0, leaderBoard[playerEntryIndex]);
                leaderBoard.splice(playerEntryIndex + 1, 1);
            }
        } else {
            let currentNumOfLeaderBoardEntries = leaderBoard.length;
            for (let i = 0; i < currentNumOfLeaderBoardEntries; i++) {
                let entry = leaderBoard[i];

                if (entry.score < currentScore ||
                    (entry.score === currentScore && entry.player.toLowerCase() > playerName.toLowerCase())) {
                    leaderBoard.splice(i, 0, { player: playerName, score: currentScore });
                } else {
                    leaderBoard.push({ player: playerName, score: currentScore });
                }
            }
        }

        localStorage.setItem(scoreKey, JSON.stringify(leaderBoard));
    }
    hideSecondaryMenu();

    return false;
}

/**
 * Retrieves highscores from local storage
 * @returns array - array of objects containing high score information
 */
function getHighScores() {
    let highScores = localStorage.getItem(scoreKey);
    if (highScores) {
        highScores = JSON.parse(highScores);
    } else {
        highScores = [];
    }

    return highScores;
}

/**
 * Retrieves the index of a given player's highscore entry
 * @param {string} playerName - Name of player
 * @returns int - index of a given player's highscore entry or -1 if it doesn't exist
 */
function getIndexOfHighScoreForPlayer(playerName) {
    let highScores = getHighScores();

    for (let i = 0; i < highScores.length; i++) {
        let userScorePair = highScores[i];
        if (userScorePair.player === playerName) {
            return i;
        }
    }

    return -1;
}

/**
 * Clears game canvas
 */
function clearGameCanvas() {
    TET_GRID.clearRect(0, 0, canvasWidth, canvasWidth);
}

/**
 * Clears canvas
 */
function clearPreviewCanvas() {
    PRE_TET_GRID.clearRect(0, 0, COLS * 5, COLS * 5);
}

/**
 * Starts the game
 */
function startGame() {
    isPlaying = true;
    isGameOver = false;

    hideMenuAreas();
    hideMainMenu();
    hideSecondaryMenu();
    showGameControls();

    initialiseBoard();
    initialiseNextBlockPreview();
    initialiseStats();

    placeNewBlockOnBoard();

    resetAudio();
    playAudio();

    timer = setInterval(progressGame, gameSpeed);
}

/**
 * Ends the game
 */
function endGame() {
    clearInterval(timer);
    clearGameCanvas();
    clearPreviewCanvas();

    // set game flags
    isPaused = false;
    isGameOver = true;
    isPlaying = false;

    setAudio(gameOverTrackPath);
    playAudio();

    // hides settings screen and shows game over message
    showMenuArea();
    setSecondaryMenuTitle('');
    showSecondaryMenuContent('status');
    hideSecondaryMenuContent('settings');
    setGameStatus('over');
    showHighScoreEntryForm();
    showSecondaryMenu();
}

/**
 * Checks if the game should be over based on the state of the Tetris board
 * @returns true if there's a block in the center of the board or if the current block couldn't be moved if placed
 */
function checkGameOver() {
    let lastRowToCheck = block.currentBlock.height + block.currentBlock.yOffset;
    for (let x = 0; x < block.currentBlock.shape.length; x++) {
        for (let y = 0; y < lastRowToCheck; y++) {
            if (block.currentBlock.shape[x][y] && board.grid[y][blockX + x]) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Sets speed of movement of tetris block
 * @param {int} amountInMs - time in ms
 */
 function setGameSpeed(amountInMs) {
    clearInterval(timer);
    gameSpeed = amountInMs;
    timer = setInterval(progressGame, amountInMs);
}

/**
 * Draws new block at the top of the board if placing it won't result in 'Game Over'
 */
function placeNewBlockOnBoard() {
    if (nextBlock) {
        block = nextBlock;
        drawPreview(true);
        setNextBlock();
    } else {
        setCurrentBlock();
        setNextBlock();
    }
    setCurrentBlockColour();
    setNextBlockColour();
    setBlockStartPosition();
    isGameOver = checkGameOver();
    if (!isGameOver) {
        drawBlock();
        drawPreview();
    }
}

/**
 * Assigns new block object to global variable
 */
function setCurrentBlock() {
    block = new Block();
}

/**
 * Assigns new next block object to global variable
 */
function setNextBlock() {
    nextBlock = new Block();
}

/**
 * Assigns canvas fill colour for current block
 */
function setCurrentBlockColour() {
    // Tetris block colour
    TET_GRID.fillStyle = block.currentColour;
    PRE_TET_GRID.fillStyle = nextBlock.currentColour;
}

/**
 * Assigns canvas fill colour for next block
 */
function setNextBlockColour() {
    // Tetris block colour
    PRE_TET_GRID.fillStyle = nextBlock.currentColour;
}

/**
 * Assigns values to the variables for the current block's (X,Y) pos
 */
function setBlockStartPosition() {
    blockX = (canvasWidth / (2 * BLOCK_SIZE)) - block.currentBlock.xOffset;
    blockY = 0;
}

/**
 * Draws shape with given properties on canvas
 * @param {CanvasRenderingContext2D} ctx - canvas context
 * @param {int} x - x coord
 * @param {int} y - y coord
 * @param {int} width - width of rectangle
 * @param {int} height - height of rectangle
 */
function drawRect(ctx, x, y, width, height) {
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
}

/**
 * Draws current block object on canvas
 * @param {boolean} clear - if block should be cleared/removed from board
 */
function drawBlock(clear) {
    for (let y = 0; y < block.currentBlock.shape.length; y++) {
        let blockRow = block.currentBlock.shape[y];
        for (let x = 0; x < blockRow.length; x++) {
            let bitInBlock = blockRow[x];
            if (bitInBlock) {
                if (clear) {
                    board.grid[blockY + y][blockX + x] = 0;
                    TET_GRID.clearRect(blockX + x - 0.1, blockY + y - 0.1, 1.2, 1.2);
                    setCurrentBlockColour();
                } else {
                    board.grid[blockY + y][blockX + x] = COLOURS.indexOf(block.currentColour) + 1;
                    drawRect(TET_GRID, blockX + x, blockY + y, 1, 1);
                }
            }
        }
    }
}

/**
 * Draws next block object on preview canvas
 * @param {boolean} clear - if block should be cleared/removed from preview
 */
function drawPreview(clear) {
    if (clear) {
        PRE_TET_GRID.clearRect(0, 0, COLS * 5, COLS * 5);
    } else {
        for (let y = 0; y < nextBlock.currentBlock.shape.length; y++) {
            let blockRow = nextBlock.currentBlock.shape[y];
            for (let x = 0; x < blockRow.length; x++) {
                let bitInBlock = blockRow[x];
                if (bitInBlock) {
                    drawRect(PRE_TET_GRID, x + 1, y + 0.5, 1, 1);
                }
            }
        }
    }
}

/**
 * Clears and redraws canvas
 */
function redrawBoard() {
    clearGameCanvas();

    for (let y = 0; y < board.grid.length; y++) {
        let row = board.grid[y];
        for (let x = 0; x < row.length; x++) {
            let bitInRow = row[x];

            if (bitInRow) {
                TET_GRID.fillStyle = COLOURS[bitInRow - 1];
                drawRect(TET_GRID, x, y, 1, 1);
                drawRect(TET_GRID, x, y, 1, 1);
            }
        }
    }
}

/**
 * Checks for full row in board, increments score and updates board if found
 */
function checkForFullRow() {
    let numOfLinesCleared = 0;

    for (let row = 0; row < ROWS; row++){
        let bitCount = 0;
        for (let col = 0; col < COLS; col++){
            if (board.grid[row][col]){
                bitCount++;
            }
        }

        if (bitCount == COLS) {
            numOfLinesCleared++;
            shiftRowsDown(row);
            redrawBoard();
        }
    }
    if (numOfLinesCleared > 0) {
        incrementScore(numOfLinesCleared);
        updateScore();
    }
}

/**
 * Clears specified row from board
 * @param {int} rowIndex 
 */
function clearRowFromBoard(rowIndex) {
    for (let y = 0; y < COLS; y++){
        board.grid[rowIndex][y] = 0;
    }
}

/**
 * Shifts rows down from specified start point
 * @param {int} rowIndex 
 */
function shiftRowsDown(rowIndex) {
    clearRowFromBoard(rowIndex);
    for (let y = rowIndex; y > 0; y--){
        for (let x = 0; x < COLS; x++){
            board.grid[y][x] = board.grid[y-1][x];
        }
    }
}

/**
 * Moves the current block down if no existing block is below the current block
 * or the bottom of the grid has been reached
 */ 
function moveDn() {
    // Holds the height of the current block
    let height = block.currentBlock.height;

    // Holds the width of the current block
    let width = block.currentBlock.width;

    // Used to indicate whether a block is below the current block
    let isShapeBelow = false;

    /**
     * Loops through the width of the bottom row of the current block and determines if there's a block sitting below the current block
     * or checks if an empty cell of a the bottom row of a block corresponds to an occupied block of the board
     */
    for (let x = block.currentBlock.xOffset; x <= width; x++) {
        if (!isShapeBelow) {
            let rowOfBlockBits = block.currentBlock.shape[height - 1 + block.currentBlock.yOffset];
            let bitInBlockRow = rowOfBlockBits[x];
            let rowOfBoardBitsBelowBlock = board.grid[blockY + height + block.currentBlock.yOffset];
            let bitInBoardRowBelowBlock;

            if (rowOfBoardBitsBelowBlock) {
                bitInBoardRowBelowBlock = rowOfBoardBitsBelowBlock[blockX + x];
            }
            
            if ((bitInBlockRow && (rowOfBoardBitsBelowBlock === undefined || bitInBoardRowBelowBlock)) ||
                    !bitInBlockRow && board.grid[blockY + block.currentBlock.yOffset + 1][blockX + x]) {
                isShapeBelow = true;
                break;
            }
        }
    }

    if (!isShapeBelow) {
        drawBlock(true);
        
        blockY += 1;

        drawBlock();
    } else {
        checkForFullRow();
        placeNewBlockOnBoard();
    }
}

/**
 * Moves the current block left if no existing block is on the left the current block
 * or the left side of the grid has been reached
 */ 
function moveLf() {
    // Holds the height of the current block
    let height = block.currentBlock.height;

    // Used to indicate whether a block is on the left side of the current block
    let isShapeLeft = false;

    /**
     * Loops through the first bit of the each row of the current block and determines if there's a block sitting on the left side
     * or checks if an empty first cell of a row of a block corresponds to an occupied block of the board
     */
     for (let y = block.currentBlock.yOffset; y <= height - 1 + block.currentBlock.yOffset; y++) {
        if (!isShapeLeft) {
            let rowOfBlockBits = block.currentBlock.shape[y];
            let firstBitInBlockRow = rowOfBlockBits[0 + block.currentBlock.xOffset];
            let rowOfBoardBitsLeftOfBlock = board.grid[blockY + y];
            let bitInBoardRowLeftOfBlock;

            if (rowOfBoardBitsLeftOfBlock) {
                bitInBoardRowLeftOfBlock = rowOfBoardBitsLeftOfBlock[blockX + block.currentBlock.xOffset - 1];
            }
            
            if (bitInBoardRowLeftOfBlock === undefined || (firstBitInBlockRow && bitInBoardRowLeftOfBlock) ||
                    !firstBitInBlockRow && board.grid[blockY + block.currentBlock.yOffset + y][blockX + block.currentBlock.xOffset - 1]) {
                isShapeLeft = true;
                break;
            }
        }
    }

    if (!isShapeLeft) {
        drawBlock(true);

        blockX -= 1;

        drawBlock();
    }
}

/**
 * Moves the current block right if no existing block is on the right the current block
 * or the right side of the grid has been reached
 */ 
 function moveRg() {
    // Holds the height of the current block
    let height = block.currentBlock.height;

    // Used to indicate whether a block is on the right side of the current block
    let isShapeRight = false;

    /**
     * Loops through the last bit of the each row of the current block and determines if there's a block sitting on the right side
     * or checks if an empty last cell of a row of a block corresponds to an occupied block of the board
     */
     for (let y = block.currentBlock.yOffset; y <= height - 1 + block.currentBlock.yOffset; y++) {
        if (!isShapeRight) {
            let rowOfBlockBits = block.currentBlock.shape[y];
            let firstBitInBlockRow = rowOfBlockBits[2];
            let rowOfBoardBitsRightOfBlock = board.grid[blockY + y];
            let bitInBoardRowRightOfBlock;

            if (rowOfBoardBitsRightOfBlock) {
                bitInBoardRowRightOfBlock = rowOfBoardBitsRightOfBlock[blockX + block.currentBlock.xOffset + block.currentBlock.width];
            }
            
            if (bitInBoardRowRightOfBlock === undefined || (firstBitInBlockRow && bitInBoardRowRightOfBlock) ||
                    !firstBitInBlockRow && board.grid[blockY + block.currentBlock.yOffset + y][blockX + block.currentBlock.xOffset + block.currentBlock.width]) {
                isShapeRight = true;
                break;
            }
        }
    }

    if (!isShapeRight) {
        drawBlock(true);

        blockX += 1;

        drawBlock();
    }
}

/**
 * Timer function for progressing or ending a game
 */
function progressGame() {
    if (isGameOver && isPlaying) {
        endGame();
    } else if (isPlaying && !isPaused) {
        moveDn();
    }
}

/**
 * Updates pause game control and menu display
 */
function showPausedGameScreen() {
    removeClassFromElementClassList('resume-game', 'hidden');
    addClassToElementClassList('pause-game', 'hidden');
    addClassToElementClassList('game-sounds', 'hidden');
    addClassToElementClassList('exit-btn', 'hidden');
    addClassToElementClassList('exit-btn-blackout', 'hidden');
    removeClassFromElementClassList('menu', 'hidden');
    
    showSecondaryMenu();
    showSecondaryMenuContent('status');
    setGameStatus('paused');
}

/**
 * Updates resume game control and menu display
 */
function hidePausedGameScreen() {
    hideSecondaryMenu();
    hideSecondaryMenuContent('status');
    addClassToElementClassList('resume-game', 'hidden');
    removeClassFromElementClassList('pause-game', 'hidden');
    removeClassFromElementClassList('game-sounds', 'hidden');
    removeClassFromElementClassList('exit-btn', 'hidden');
}

/**
 * Pauses game 
 */
function pauseGame() {
    pauseAudio();
    toggleMenuButtonVisibility('quit-game');
    clearInterval(timer);
    isPaused = true;
}

/**
 * Resumes game
 */
function resumeGame() {
    playAudio();
    timer = setInterval(progressGame, gameSpeed);
    isPaused = false;
}

/**
 * Toggle element visibility
 */
function toggleMenuButtonVisibility(elementID) {
    if (isPlaying) {
        removeClassFromElementClassList(elementID, 'hidden');
    } else {
        addClassToElementClassList(elementID, 'hidden');
    }
}

/**
 * Displays settings menu
 */
function displaySettings() {
    hideMainMenu();
    showMenuArea();
    
    setSecondaryMenuTitle('Settings');
    showSecondaryMenuContent('settings');
    toggleMenuButtonVisibility('quit-game');

    showSecondaryMenu();
}

/**
 * Sets the game status in caps
 * @param {string} status - the current status of the game
 */
function setGameStatus(status) {
    document.getElementById('game-status').textContent = status.toUpperCase();
}
//#endregion

//#region Menu functions
document.body.onload = setupListeners;

/**
 * Handles a menu button click event
 */
function menuButtonClickEventHandler() {
    processMenuOption(this.id);
}

/**
 * Handles a menu button mouse over event
 */
function menuButtonMouseOverHandler() {
    removeClassFromAllElementsWithClass('#main-menu-options .active', 'active');
    addClassToElementClassList(this.id, 'active');
    this.focus();
}

/**
 * Handles a menu button mouse out event
 */
function menuButtonMouseOutHandler() {
    removeClassFromElementClassList(this.id, 'active');
    this.blur();
}

/**
 * Sets button click, mouseover and mouseout event listeners
 */
function setupMenuButtonListeners() {
    let menuButtons = document.getElementsByClassName('menu-item');

    for (let i = 0; i < menuButtons.length; i++) {
        menuButtons[i].addEventListener('click', menuButtonClickEventHandler);
        menuButtons[i].addEventListener('mouseover', menuButtonMouseOverHandler);
        menuButtons[i].addEventListener('mouseout', menuButtonMouseOutHandler);
    }
}

/**
 * Adds listeners to all of the menu buttons, executing as appropriate for each button
 */
function setupListeners() {
    setupMenuButtonListeners();

    let gameControlButtons = document.getElementsByClassName('control-btn');
    
    for (let i = 0; i < gameControlButtons.length; i++) {
        gameControlButtons[i].addEventListener('click', function() {
            switch (this.id) {
                case 'pause-game':
                    pauseGame();
                    showPausedGameScreen();
                    break;
                case 'resume-game':
                    resumeGame();
                    hidePausedGameScreen();
                    break;
                case 'restart-game':
                    clearGameCanvas();
                    startGame();
                    break;
                case 'settings':
                    pauseGame();
                    displaySettings();
                    break;
                case 'exit-btn':
                    hideSecondaryMenu();
                    break;
                default:
                    return;
            }
        });
    }

    let highScoreEntryForm = document.getElementById('score-submission');

    highScoreEntryForm.addEventListener('submit', function() {
        return storeHighScore();
    });

    menuButtons[0].focus();
}

/**
 * Carries out the tasks associated with the selected menu option
 * @param {string} id - id of element
 * @returns nothing - used to stop further
 */
function processMenuOption(id) {
    switch (id) {
        case 'game-play':
            startGame();
            break;
        case 'game-controls':
            setSecondaryMenuTitle('Controls');
            showSecondaryMenuContent('controls');
            showSecondaryMenu();
            break;
        case 'game-credits':
            setSecondaryMenuTitle('Credits');
            showSecondaryMenuContent('credits');
            removeClassFromElementClassList('exit-btn-blackout', 'hidden');
            showSecondaryMenu();
            break;
        case 'game-leaderboard':
            setSecondaryMenuTitle('Leaderboard');
            showSecondaryMenuContent('leaderboard');
            setLeaderBoardHTML();
            showSecondaryMenu();
            break;
        case 'game-sounds':
            toggleSoundSetting();
            break;
        case 'quit-game':
            endGame();
            break;
        default:
            return;
    }    
}

/**
 * Sets an element's class
 * @param {string} id - id of element to access
 * @param {string} classNames - class(es) to set as an existing element's class
 */
function setClassesOnElement(id, classNames) {
    document.getElementById(id).className = classNames;
}

/**
 * Adds a class to a given element's class list
 * @param {string} id - id of element to access
 * @param {string} className - class to append to existing element classes
 */
 function addClassToElementClassList(id, className) {
    document.getElementById(id).classList.add(className);
}

/**
 * Removes a class from a given element's class list
 * @param {string} id - id of element to access
 * @param {string} className - class to append to existing element classes
 */
function removeClassFromElementClassList(id, className) {
    document.getElementById(id).classList.remove(className);
}

/**
 * Removes class from elements with a specific class
 * @param {string} elementClass - name of class to search for elements
 * @param {string} classToRemove - name of class to remove from elements
 */
function removeClassFromAllElementsWithClass(elementClass, classToRemove) {
    let elementsWithClass = document.querySelectorAll(elementClass);

    for (let i = 0; i < elementsWithClass.length; i++) {
        elementsWithClass[i].classList.remove(classToRemove);
    }
}

/**
 * Assigns style rule to element
 * @param {string} id - id of desired element to style
 * @param {string} prop - name of style property to modify
 * @param {string} value - value of style property to set
 */
function setStyleOnElement(id, prop, value) {
    document.getElementById(id).style[prop] = value;
}

/**
 * Displays main menu
 */
function showMainMenu() {
    setStyleOnElement('main-menu', 'visibility', 'visible');
}

/**
 * Hides main menu
 */
function hideMainMenu() {
    setStyleOnElement('main-menu', 'visibility', 'hidden');
}

/**
 * Displays main and secondary menus
 */
function showMenuArea() {
    removeClassFromElementClassList('menu', 'hidden');
}

/**
 * Hides the main and secondary menus
 */
 function hideMenuAreas() {
    addClassToElementClassList('menu', 'hidden');
}

/**
 * Displays the secondary menu
 */
function showSecondaryMenu() {
    removeClassFromElementClassList('secondary-menu-title', 'hidden');
    setClassesOnElement('secondary-menu', 'bordered-box');
}

/**
 * Hides the secondary menu and the potential contents being displayed
 */
function hideSecondaryMenu() {
    addClassToElementClassList('secondary-menu', 'hidden');
    addClassToElementClassList('secondary-menu-title', 'hidden');
    hideSecondaryMenuContent('controls');
    hideSecondaryMenuContent('credits');
    hideSecondaryMenuContent('leaderboard');
    addClassToElementClassList('exit-btn-blackout', 'hidden');
    setSecondaryMenuTitle('');

    if (isPaused && isPlaying) {
        resumeGame();
    } else if (isGameOver) {
        hideSecondaryMenuContent('status');
        showMainMenu();
        cycleThroughMenu('#main-menu-options', 'game-play');
        initialiseStats(true);
    } else if (!isPlaying) {
        showMainMenu();
    }
}

/**
 * Sets the secondary menu title
 * @param {string} title - The title of the clicked menu item to display in the secondary menu
 */
function setSecondaryMenuTitle(title) {
    document.getElementById('secondary-menu-title').textContent = title;
}

/**
 * Sets the class string for a given element
 * @param {string} contentName - The name of the content to be displayed
 * @param {string} className - The name of the class to set on the element
 */
function setSecondaryMenuContentClass(contentName, className) {
    setClassesOnElement('secondary-menu-' + contentName + '-content', className);
}

/**
 * Displays the appropriate secondary menu content
 * @param {string} contentName - The name of the content to be displayed
 */
function showSecondaryMenuContent(contentName) {
    setSecondaryMenuContentClass(contentName, '');
}

/**
 * Hides the given secondary menu content
 * @param {string} contentName - The name of the content to be displayed
 */
function hideSecondaryMenuContent(contentName) {
    setSecondaryMenuContentClass(contentName, 'hidden');
}

/**
 * Manipulates DOM to give appearance of cycling through menu options
 * @param {string} menuOptionsContainerID - id of element containing menu options
 * @param {*} defaultButtonID - id of button to default to if none are active or end of menu is reached
 * @param {*} reverseOrder - if menu should be traversed in reverse order
 */
function cycleThroughMenu(menuOptionsContainerID, defaultButtonID, reverseOrder) {
    let activeMenuItem = document.querySelectorAll(menuOptionsContainerID + ' .active')[0];
    let siblingPropertyName = reverseOrder ? 'previousElementSibling' : 'nextElementSibling';
    let hasSibling = false;

    if (activeMenuItem) {
        removeClassFromElementClassList(activeMenuItem.id, 'active');
        let menuItemToMakeActive = activeMenuItem[siblingPropertyName];
        if (menuItemToMakeActive && menuItemToMakeActive.className === 'menu-item') {
            addClassToElementClassList(activeMenuItem[siblingPropertyName].id, 'active');
            activeMenuItem[siblingPropertyName].focus();
            hasSibling = true;
        }
    }
    if ((!activeMenuItem && !isPaused) || (activeMenuItem && !hasSibling)) {
        let nextMenuButton = document.getElementById(defaultButtonID);
        addClassToElementClassList(nextMenuButton.id, 'active');
        nextMenuButton.focus();
    }
}

/**
 * Displays game controls
 */
function showGameControls() {
    removeClassFromElementClassList('pause-game', 'hidden');
    removeClassFromElementClassList('restart-game', 'hidden');
}

/**
 * Toggles sound setting between 'ON' and 'OFF'
 */
function toggleSoundSetting() {
    if (isSoundOn) {
        isSoundOn = false;
        if (isPlaying) {
            pauseAudio();
        }
    } else {
        isSoundOn = true;
        setAudio(tetrisTrackPath, audioTimeUpdateCallback);
    }
    
    document.getElementById('sound-setting').textContent = isSoundOn ? 'ON' : 'OFF';
}

/**
 * Forces audio loop from desired point
 */
function audioTimeUpdateCallback() {
    if (this.currentTime >= 77) {
        this.currentTime = 0;
        this.play();
    }
}

/**
 * Loads the audio player
 */
function setAudio(trackPath, callback) {
    if (!musicPlayer || musicPlayer.outerHTML.indexOf(trackPath) === -1) {
        musicPlayer = new Audio(trackPath);
        musicPlayer.removeEventListener("timeupdate", audioTimeUpdateCallback);
        if (callback) {
            musicPlayer.addEventListener("timeupdate", callback);
        }
    }
}

/**
 * Starts the audio player
 */
function playAudio() {
    if (isSoundOn && (musicPlayer.currentTime === 0 || musicPlayer.paused)) {
        musicPlayer.play();
    }
}

/**
 * Pauses the audio player
 */
function pauseAudio() {
    if (isSoundOn) {
        musicPlayer.pause();
    }
}

/**
 * Resets music player by loading it with tetris track if not already set
 */
function resetAudio() {
    if (isSoundOn && musicPlayer.outerHTML.indexOf(tetrisTrackPath) === -1) {
        setAudio(tetrisTrackPath, audioTimeUpdateCallback);
    }
}

/**
 * Displays form for highscore entry
 */
function showHighScoreEntryForm() {
    removeClassFromElementClassList('score-submission', 'hidden');
    addClassToElementClassList('exit-btn', 'hidden');
}

/**
 * Generates and sets HTML for stored leaderboard values
 */
function setLeaderBoardHTML() {
    let leaderBoardHTML = '<ol>';
    let leaderBoard = getHighScores();

    for (let i = 0; i < leaderBoard.length; i++) {
        let entry = leaderBoard[i];
        leaderBoardHTML += '<li>' + entry.player + ' ........ ' + entry.score + '</li>';
    }

    leaderBoardHTML += "</ol>";
    document.getElementById('scores').innerHTML = leaderBoardHTML;
}
//#endregion