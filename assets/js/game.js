/* jshint esversion: 8 */
/*globals BLOCK_SIZE, COLS, ROWS, Board, Block, COLOURS */

/* #region and #endregion have been used for the purpose of being able to group
    and collapse related rules when developing */

//#region Global variables
const CANVAS = document.getElementById('tetris');
const PREVIEW_CANVAS = document.getElementById('preview-block');
const TET_GRID = CANVAS.getContext('2d');
const PRE_TET_GRID = PREVIEW_CANVAS.getContext('2d');

let board;
let block;
let nextBlock;

let canvasWidth;
let canvasHeight;
let blockX;
let blockY;

let timer;
let holdTimer;
let baseGameSpeed = 1000;
let gameSpeed = 1000;
let statPlaceholder = '.........';

let musicPlayer;
let soundFolderPath = 'assets/sounds/';
let tetrisTrackPath = soundFolderPath + 'tetris-gameboy-02.mp3';
let gameOverTrackPath = soundFolderPath + 'game-over.mp3';

let currentScore = 0;
let baseScorePerLinesCleared = [40, 100, 300, 1200];
let level = 0;
let totalNumOfLinesCleared = 0;
let scoreKey = 'port-2-tet-highScores';
let scoreElement;

let currentMenu = '#main-menu-options';

let isPlaying = false;
let isPaused = false;
let isGameOver = false;
let isSoundOn = false;
//#endregion

//#region Game event listeners
// Arrow key pressed
document.addEventListener('keydown', function(e) {
    if (isPlaying && !isPaused) {
        switch (e.key) {
            case 'p':
                pauseGame();
                showPausedGameScreen();
                break;
            case 'r':
                hidePausedGameScreen();
                clearGameCanvas();
                startGame();
                break;
            case 's':
                pauseGame();
                removeClassFromElementClassList('resume-game', 'hidden');
                addClassToElementClassList('pause-game', 'hidden');
                displaySettings();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                moveLf();
                break;
            case 'ArrowRight':
                e.preventDefault();
                moveRg();
                break;
            case 'ArrowUp':
                e.preventDefault();
                drawBlock(true);
                block.rotateBlockClockwise();
                drawBlock();
                break;
            case 'ArrowDown':
                e.preventDefault();
                softDropBlock();
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        let defaultButtonID = currentMenu === '#main-menu-options' ? 'game-play' : 'game-sounds';
        cycleThroughMenu(currentMenu, defaultButtonID);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        let defaultSettingsButtonID = isPlaying ? 'quit-game' : 'game-sounds';
        let defaultButtonID = currentMenu === '#main-menu-options' ? 'game-credits' : defaultSettingsButtonID;
        cycleThroughMenu(currentMenu, defaultButtonID, true);
    } else if (e.key === 'Enter') {
        if (e.target.type !== 'submit' && e.target.id !== 'exit-btn' && e.target.parentElement.id !== 'controls') {
            e.preventDefault();
            processMenuOption(e.target.id);
        }
    } else if (!isGameOver) {
        if (e.key === 's') {
            hideSecondaryMenu();
            pauseGame();
            displaySettings();
        } else if (isPaused && e.key === 'p') {
            resumeGame();
            hidePausedGameScreen();
        }
    }
});

// Arrow key released
document.addEventListener('keyup', function(e) {
    if (isPlaying && !isPaused) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') setGameSpeed(getGameSpeedForCurrentLevel());
    }
});
//#endregion

//#region Game functions
/**
 * Initialises the game board
 */
function initialiseBoard() {
    board = new Board(TET_GRID);
}

/**
 * Sets the dimensions and scale of the game board
 */
function setGameBoardDimensions() {
    // Board dimensions setup
    let scale = window.innerWidth/window.innerHeight;
    let scaled_size = BLOCK_SIZE * window.devicePixelRatio * scale;
    TET_GRID.canvas.width = COLS * scaled_size;
    TET_GRID.canvas.height = ROWS * scaled_size;
    TET_GRID.scale(scaled_size, scaled_size);

    canvasWidth = TET_GRID.canvas.clientWidth;
    canvasHeight = TET_GRID.canvas.clientHeight;

    // Tetris block border setup
    TET_GRID.strokeStyle = 'white';
    TET_GRID.lineWidth = 0.2;
}

/**
 * Sets the dimensions and scale of the next block preview
 */
function setNextBlockPreviewDimensions() {
    // Board dimensions setup
    let scale = window.innerWidth/window.innerHeight;
    let scaled_size = BLOCK_SIZE * window.devicePixelRatio * 2 * (scale < 1 ? 1.5 : scale);
    PRE_TET_GRID.canvas.width = COLS * 20 * window.devicePixelRatio;
    PRE_TET_GRID.canvas.height = COLS * 15 * window.devicePixelRatio;
    PRE_TET_GRID.scale(scaled_size, scaled_size);

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
        scoreElement.textContent = statPlaceholder;
        updateStat('level', statPlaceholder);
        updateStat('lines', statPlaceholder);
    } else {
        resetStats();
        updateScore();
        updateStat('level', level);
        updateStat('lines', totalNumOfLinesCleared);
    }
}

/**
 * Returns true if criteria for next level has been met
 * @returns boolean - true if integer values are equal
 */
function meetsNextLevelCriteria() {
    return totalNumOfLinesCleared >= (level * 5 + 5);
}

/**
 * Sets game speed based on current level
 * (set to get fast fairly quickly so that all aspects of the game can be seen for assessment purposes)
 */
function setGameSpeedForCurrentLevel() {
    gameSpeed = getGameSpeedForCurrentLevel();
}

/**
 * Gets game speed for current level
 */
function getGameSpeedForCurrentLevel() {
    let newSpeed = baseGameSpeed - (level * 100);

    if (newSpeed < 0) {
        newSpeed = 0;
    }

    return newSpeed;
}

/**
 * Increases level
 */
function increaseLevel() {
    level += 1;
}

/**
 * Updates level indicator in 'Stats' area
 */
function updateLevel() {
    document.getElementById('level').textContent = level;
}

/**
 * Updates lines cleared indicator in 'Stats' area
 */
function updateLinesCleared() {
    document.getElementById('lines').textContent = totalNumOfLinesCleared;
}

/**
 * Updates value in stats box with given value
 * @param {string} statElementId - ID of element in the stat area
 * @param {string} value - value to update element's text content with
 */
function updateStat(statElementId, value) {
    document.getElementById(statElementId).textContent = value;
}

/**
 * Updates score in stats box
 */
function updateScore() {
    scoreElement.textContent = currentScore;
}

/**
 * Increments score variable
 */
function incrementScore(numOfLinesCleared) {
    let baseScore = baseScorePerLinesCleared[numOfLinesCleared - 1] || baseScorePerLinesCleared[4];

    currentScore += baseScore * (level + 1);
}

/**
 * Resets all variables used to determine score
 */
function resetStats() {
    currentScore = 0;
    level = 0;
    totalNumOfLinesCleared = 0;
}

/**
 * Updates the current player's score and position in the leaderboard
 * @param {int} currentPlayerPosition - index of current player's score in 'leadBoard' array
 * @param {array} leaderBoard - array of key-pair values
 */
function updatePlayerScoreInLeaderBoard(currentPlayerPosition, leaderBoard) {
    let entry = leaderBoard[currentPlayerPosition];

    if (currentScore > entry.score) {
        entry.score = currentScore;
    }

    let leaderBoardPositionToPlacePlayer = currentPlayerPosition - 1;
    // while an entry above the current position exists (i.e. the array isn't out of bounds)
    while (leaderBoardPositionToPlacePlayer > -1) {
        // look at the preceeding entry
        let otherPlayerEntry = leaderBoard[leaderBoardPositionToPlacePlayer];

        // if the current player's score is less than the score of a preceeding entry
        // or we've reached the top of the leaderboard
        if (currentScore < otherPlayerEntry.score || leaderBoardPositionToPlacePlayer === 0) {
            // break out of the loop, this is the index where the current player will be spliced
            break;
        }
        // look at the next preceeding entry
        leaderBoardPositionToPlacePlayer--;
    }

    // if the player deserves to be moved up the ranks
    if (leaderBoardPositionToPlacePlayer !== currentPlayerPosition) {
        // splice them into their new rank
        leaderBoard.splice(leaderBoardPositionToPlacePlayer, 0, leaderBoard[currentPlayerPosition]);
        // and remove their old one (which is +1 because we've just added an element)
        leaderBoard.splice(currentPlayerPosition + 1, 1);
    }
}

/**
 * Adds a player's score to its appropriate place in the leaderboard
 * @param {array} leaderBoard - an array of key-pair values
 * @param {string} playerName - a 3-4 character string representation of a player's name
 */
function addPlayerToLeaderBoard(leaderBoard, playerName) {
    let currentNumOfLeaderBoardEntries = leaderBoard.length;
    let hasPlayerEntryBeenAdded = false;

    for (let i = 0; i < currentNumOfLeaderBoardEntries; i++) {
        let entry = leaderBoard[i];

        // if the entry score is less than the current player's score
        // or another player entry has the same score and their name is alphabetically lower than the current player's name
        if (entry.score < currentScore ||
                (entry.score === currentScore && entry.player.toLowerCase() > playerName.toLowerCase())) {
            // the current player gets inserted into the leaderboard above the entry
            leaderBoard.splice(i, 0, { player: playerName, score: currentScore });
            hasPlayerEntryBeenAdded = true;
            break;
        }
    }

    if (currentNumOfLeaderBoardEntries === 0 || !hasPlayerEntryBeenAdded) {
        leaderBoard.push({ player: playerName, score: currentScore });
    }
}

/**
 * Stores score as highscore in local storage to persist value
 */
function storeHighScore() {
    if (currentScore > 0) { // only proceed if the player has a score
        let leaderBoard = getHighScores();
        let playerName = document.getElementById('player').value;
        let currentPlayerPosition = getLeaderBoardPositionForPlayer(playerName);

        // if player is already on the leaderboard
        if (currentPlayerPosition > -1) {
            let playersLeaderBoardScore = leaderBoard[currentPlayerPosition].score;
            //  and there current score is higher than their leaderboard score
            if (currentScore > playersLeaderBoardScore) {
                // update their score
                updatePlayerScoreInLeaderBoard(currentPlayerPosition, leaderBoard);
            }
        } else { // if player isn't on the leaderboard, add them
            addPlayerToLeaderBoard(leaderBoard, playerName);
        }

        // store modified value in local storage
        localStorage.setItem(scoreKey, JSON.stringify(leaderBoard));
    }

    hideSecondaryMenu();

    // to prevent form from submitting and refreshing the page
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
 * Retrieves the index of a given player's leaderboard entry
 * @param {string} playerName - Name of player
 * @returns int - index of a given player's leaderboard entry or -1 if it doesn't exist
 */
function getLeaderBoardPositionForPlayer(playerName) {
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
    TET_GRID.clearRect(0, 0, canvasWidth, canvasHeight);
}

/**
 * Clears canvas
 */
function clearPreviewCanvas() {
    PRE_TET_GRID.clearRect(0, 0, PRE_TET_GRID.canvas.width, PRE_TET_GRID.canvas.height);
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
    showGameState();
    showGameControls();

    initialiseBoard();
    setGameBoardDimensions();
    setNextBlockPreviewDimensions();
    initialiseStats();

    placeNewBlockOnBoard();

    resetAudio();
    playAudio();

    gameSpeed = baseGameSpeed;

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
    showGameState();
    showMenuArea();
    setSecondaryMenuTitle('');
    showSecondaryMenuContent('status');
    hideSecondaryMenuContent('settings');
    setGameStatus('over');

    if (currentScore > 0) {
        showHighScoreEntryForm();
    }
    
    showSecondaryMenu();
    hideGameControls();
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
    if (!isGameOver) {
        timer = setInterval(progressGame, amountInMs);
    }
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
}

/**
 * Assigns canvas fill colour for the next block
 */
function setCurrentNextBlockColour() {
    // TNext Tetris block colour
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
    blockX = Math.round((canvasWidth / (2 * BLOCK_SIZE)) - block.currentBlock.xOffset);
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
                    TET_GRID.clearRect(blockX + x - 0.15, blockY + y - 0.15, 1.3, 1.3);
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
                    drawRect(PRE_TET_GRID, x + 2, y, 1, 1);
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
 * Clears and redraws next block preview
 */
 function redrawNextPreviewBlock() {
    clearPreviewCanvas();
    setCurrentNextBlockColour();
    if (isPlaying && !isPaused) {
        drawPreview();
    }
}

/**
 * Resizes canvas
 */
function resizeBoard() {
    if (isPlaying) {
        setGameBoardDimensions();
        setNextBlockPreviewDimensions();
        
        redrawBoard();
        redrawNextPreviewBlock();
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
        totalNumOfLinesCleared += numOfLinesCleared;
        incrementScore(numOfLinesCleared);
        updateScore();
        updateLinesCleared();

        if (meetsNextLevelCriteria()) {
            increaseLevel();
            updateLevel();
            setGameSpeedForCurrentLevel();
        }
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
    // Holds the upper bound index of outer array
    let maxBlockArrayOuterIndex = block.currentBlock.shape.length - 1;
    // Holds the upper bound index of inner array
    let maxBlockArrayInnerIndex = block.currentBlock.shape[0].length - 1;

    // Used to indicate whether a block is below the current block
    let isShapeBelow = false;

    /**
     * Loops through each bit of the current block and determines if the bottom of the board has been reached
     * or checks if the current block has hit another block below it
     */
    for (let y = maxBlockArrayOuterIndex; y >= 0; y--) { // starts from the bottom row of the block
        for (let x = block.currentBlock.xOffset; x <= maxBlockArrayInnerIndex; x++) { // loops through each column
            if (!isShapeBelow) {
                // store the current row of block bits
                let rowOfBlockBits = block.currentBlock.shape[y];
                // get the value of the bit (if it exists, i.e. isn't 0, then we know it's a something we can collide with)
                let bitInBlockRow = rowOfBlockBits[x];

                // get the board representation of the row below the row of the current block we're looking at
                let rowOfBoardBitsBelowBlock = board.grid[blockY + y + 1];

                let bitInBoardRowBelowBlock;
                // if there is a board row (is undefined once the bottom of the board is reached) 
                if (rowOfBoardBitsBelowBlock) {
                    // then store the bit directly below the one we're currently looking at
                    bitInBoardRowBelowBlock = rowOfBoardBitsBelowBlock[blockX + x];
                }

                let isBoardBitAndCurrentBlockBitTheSame = false;
                if (y < maxBlockArrayOuterIndex) { // overlap can only over when we're not looking at the last row of the block representation
                    // basic check to see if the part of the board we're looking it is actually part of the current moving block
                    isBoardBitAndCurrentBlockBitTheSame = bitInBoardRowBelowBlock && block.currentBlock.shape[y + 1][x];
                }
                
                // if we're looking at a bit of the block (part of the shape) and we're not looking at the same block
                // and we've reached the bottom of the board or there's already something occupying the below space on the board
                if (bitInBlockRow && !isBoardBitAndCurrentBlockBitTheSame && 
                        ((rowOfBoardBitsBelowBlock === undefined || bitInBoardRowBelowBlock))) {
                    // no more wiggle room so act accordingly
                    isShapeBelow = true;
                    break;
                }
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
    if (blockX + block.currentBlock.xOffset > 0) {
        // Used to indicate whether a block is on the left side of the current block
        let isShapeLeft = false;

        /**
         * Loops through the first bit of the each row of the current block and determines if the block's hit the left side of the board
         * or checks if the current block has hit another block on the left side of it
         */
        for (let y = block.currentBlock.yOffset; y < block.currentBlock.shape.length - 1; y++) {
            if (!isShapeLeft) {
                // store the current row of block bits
                let rowOfBlockBits = block.currentBlock.shape[y];
                // get the value of the first bit in the row (if it exists, i.e. isn't 0, then we know it's a something we can collide with)
                let firstBitInBlockRow = rowOfBlockBits[block.currentBlock.xOffset];
                // get the board representation of the row matching with the row of the current block we're looking at
                let rowOfBoardBitsLeftOfBlock = board.grid[blockY + y];
                let bitInBoardRowLeftOfBlock;

                // if there is a board column (is undefined once the left side of the board is reached)
                if (rowOfBoardBitsLeftOfBlock) {
                    // then store the bit directly left of the one we're currently looking at
                    bitInBoardRowLeftOfBlock = rowOfBoardBitsLeftOfBlock[blockX + block.currentBlock.xOffset - 1];
                }

                // if there's no space to the left of the current block or collision detected
                if (bitInBoardRowLeftOfBlock === undefined || (firstBitInBlockRow && bitInBoardRowLeftOfBlock)) {
                    // no wiggle room so act accordingly
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
}

/**
 * Moves the current block right if no existing block is on the right the current block
 * or the right side of the grid has been reached
 */ 
 function moveRg() {
    if (blockX + block.currentBlock.xOffset + block.currentBlock.width < canvasWidth) {
        // Holds the number of rows/cols in a block's array
        let numOfRows = block.currentBlock.shape.length - 1;

        // Used to indicate whether a block is on the right side of the current block
        let isShapeRight = false;

        /**
         * Loops through the last bit of the each row of the current block and determines if the block's hit the right side of the board
         * or checks if the current block has hit another block on the right side of it
         */
        for (let y = block.currentBlock.yOffset; y <= numOfRows; y++) {
            if (!isShapeRight) {
                // store the current row of block bits
                let rowOfBlockBits = block.currentBlock.shape[y];
                // get the value of the last bit in the row (if it exists, i.e. isn't 0, then we know it's a something we can collide with)
                let lastBitInBlockRow = rowOfBlockBits[block.currentBlock.xOffset + block.currentBlock.width - 1];

                // get the board representation of the row matching the row of the current block we're looking at
                let rowOfBoardBitsRightOfBlock = board.grid[blockY + y];

                let bitInBoardRowRightOfBlock;

                // if there is a board column (is undefined once the right side of the board is reached)
                if (rowOfBoardBitsRightOfBlock) {
                    // then store the bit directly right of the one we're currently looking at
                    bitInBoardRowRightOfBlock = rowOfBoardBitsRightOfBlock[blockX + block.currentBlock.xOffset + block.currentBlock.width];
                }
                
                // if there's no space to the right of the current block or collision detected
                if (bitInBoardRowRightOfBlock === undefined || (lastBitInBlockRow && bitInBoardRowRightOfBlock)) {
                    // no wiggle room so act accorrdingly
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
}

/**
 * Moves the current block down at a faster pace
 */
function softDropBlock() {
    let newSoftDropSpeed = getGameSpeedForCurrentLevel() / 10;
    if (gameSpeed !== newSoftDropSpeed && gameSpeed >= 0) {
        setGameSpeed(newSoftDropSpeed);
    }
    currentScore += 1;
    updateScore();
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
 * Hides game state
 */
function hideGameState() {
    let curtain = document.getElementById('block-entrance');

    curtain.style.height = "101%";
    curtain.style.width = "100%";
    curtain.style.left = "0";
}

/**
 * Shows game state
 */
function showGameState() {
    let curtain = document.getElementById('block-entrance');

    curtain.style.height = "10px";
    curtain.style.width = "95%";
    curtain.style.left = "2.5%";
}

/**
 * Hides game board and preview area from user
 */
function hideGame() {
    hideGameState();
    clearPreviewCanvas();
}

/**
 * Shows game board and preview area
 */
 function showGame() {
    showGameState();
    drawPreview();
}

/**
 * Updates pause game control and menu display
 */
function showPausedGameScreen() {
    removeClassFromElementClassList('resume-game', 'hidden');
    addClassToElementClassList('pause-game', 'hidden');
    addClassToElementClassList('game-sounds', 'hidden');
    addClassToElementClassList('game-keys', 'hidden');
    addClassToElementClassList('exit-btn-blackout', 'hidden');
    removeClassFromElementClassList('menu', 'hidden');
    
    hideGame();
    showSecondaryMenu();
    showSecondaryMenuContent('status');
    setGameStatus('paused');
    addClassToElementClassList('exit-btn', 'hidden');
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
    removeClassFromElementClassList('game-keys', 'hidden');
    removeClassFromElementClassList('exit-btn', 'hidden');
    showGame();
}

/**
 * Pauses game 
 */
function pauseGame() {
    pauseAudio();
    toggleMenuButtonVisibility('quit-game');
    clearInterval(timer);
    isPaused = !!isPlaying;
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
    hideGame();
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
document.body.onload = function() {
    setupListeners();
    scoreElement = document.getElementById('score');
    hideGameState();
};

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
    removeClassFromAllElementsWithClass(currentMenu + ' .active', 'active');
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
    
    menuButtons[0].focus();
}

/**
 * Handles a game state button click event
 * @returns nothing - stops execution if none of the expected buttons are clicked
 */
function gameStateButtonClickEventHandler(e) {
    if (e.type === 'click' || e.key === 'Enter') {
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
                hidePausedGameScreen();
                clearGameCanvas();
                startGame();
                break;
            case 'settings':
                pauseGame();
                removeClassFromElementClassList('resume-game', 'hidden');
                addClassToElementClassList('pause-game', 'hidden');
                displaySettings();
                break;
            case 'exit-btn':
                if (isGameOver) {
                    hideHighScoreEntryForm();
                }
                hideSecondaryMenu();
                break;
        }
    }
}

/**
 * Handles a game control button mousedown and mouseup events
 * @returns nothing - stops execution if none of the expected buttons are clicked
 */
 function gameControlButtonClickEventHandler(e) {
    if (isPlaying && !isPaused && (e.type === 'mousedown' || e.type === 'touchstart')) {
        switch (this.id) {
            case 'up-arrow':
                holdTimer = setInterval(function() {
                    drawBlock(true);
                    block.rotateBlockClockwise();
                    drawBlock();
                }, 150);
                break;
            case 'left-arrow':
                holdTimer = setInterval(moveLf, 150);
                break;
            case 'right-arrow':
                holdTimer = setInterval(moveRg, 150);
                break;
            case 'down-arrow':
                holdTimer = setInterval(function() {
                    if (isPlaying && !isPaused) {
                        softDropBlock();
                    }
                }, 150);
                break;
            default:
                return;
        }
    } else {
        clearInterval(holdTimer);
        let expectedSpeed = getGameSpeedForCurrentLevel();
        if ((e.type === 'touchend' || e.type === 'mouseup') && gameSpeed < expectedSpeed) {
            setGameSpeed(expectedSpeed);
        }
    }
}

/**
 * Sets click event listener for game state buttons
 */
function setupStateControlButtonListeners() {
    let gameStateButtons = document.getElementsByClassName('state-control-btn');
    
    for (let i = 0; i < gameStateButtons.length; i++) {
        gameStateButtons[i].addEventListener('click', gameStateButtonClickEventHandler);
        gameStateButtons[i].addEventListener('keydown', gameStateButtonClickEventHandler);
    }
}

/**
 * Sets click event listener for gameplay control buttons
 */
function setupGameControlButtonListeners() {
    let gameControlButtons = document.getElementsByClassName('game-control-btn');
    
    for (let i = 0; i < gameControlButtons.length; i++) {
        gameControlButtons[i].addEventListener('mousedown', gameControlButtonClickEventHandler);
        gameControlButtons[i].addEventListener('touchstart', gameControlButtonClickEventHandler);
        gameControlButtons[i].addEventListener('mouseup', gameControlButtonClickEventHandler);
        gameControlButtons[i].addEventListener('touchend', gameControlButtonClickEventHandler);
    }
}

/**
 * Adds listeners to all of the menu buttons, executing as appropriate for each button
 */
function setupListeners() {
    setupMenuButtonListeners();
    setupStateControlButtonListeners();
    setupGameControlButtonListeners();

    let highScoreEntryForm = document.getElementById('score-submission');

    highScoreEntryForm.addEventListener('submit', function() {
        hideHighScoreEntryForm();
        resetStats();
        return storeHighScore();
    });

    window.addEventListener('resize', resizeBoard);
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
        case 'game-keys':
            toggleShowArrowKeysSetting();
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
    currentMenu = '#main-menu-options';
    setStyleOnElement('main-menu', 'visibility', 'visible');
}

/**
 * Hides main menu
 */
function hideMainMenu() {
    currentMenu = '';
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
    removeClassFromElementClassList('exit-btn', 'hidden');
    setClassesOnElement('secondary-menu', 'bordered-box');
}

/**
 * Hides the secondary menu and the potential contents being displayed
 */
function hideSecondaryMenu() {
    currentMenu = '';
    addClassToElementClassList('secondary-menu', 'hidden');
    addClassToElementClassList('secondary-menu-title', 'hidden');
    hideSecondaryMenuContent('controls');
    hideSecondaryMenuContent('credits');
    hideSecondaryMenuContent('leaderboard');
    hideSecondaryMenuContent('settings');
    addClassToElementClassList('exit-btn-blackout', 'hidden');
    setSecondaryMenuTitle('');

    if (isPaused && isPlaying) {
        showGame();
        resumeGame();
    } else if (isGameOver) {
        clearGameCanvas();
        hideSecondaryMenuContent('status');
        showMainMenu();
        removeClassFromAllElementsWithClass('main-menu-options', 'active');
        addClassToElementClassList('game-play', 'active');
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
    currentMenu = '#secondary-menu-' + contentName + '-content';
    setSecondaryMenuContentClass(contentName, '');
}

/**
 * Hides the given secondary menu content
 * @param {string} contentName - The name of the content to be displayed
 */
function hideSecondaryMenuContent(contentName) {
    setSecondaryMenuContentClass(contentName, 'hidden');
    removeClassFromElementClassList('exit-btn', 'active');
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
    let isInSecondaryMenu = menuOptionsContainerID.endsWith('content');
    let isInSettings = menuOptionsContainerID.indexOf('settings') > -1;
    let hasSibling = false;

    if (activeMenuItem) {
        removeClassFromElementClassList(activeMenuItem.id, 'active');
        let menuItemToMakeActive = activeMenuItem[siblingPropertyName];
        if (menuItemToMakeActive && menuItemToMakeActive.className === 'menu-item') {
            addClassToElementClassList(activeMenuItem[siblingPropertyName].id, 'active');
            activeMenuItem[siblingPropertyName].focus();
            hasSibling = true;
        } else if (isInSecondaryMenu) {
            defaultButtonID = reverseOrder ? null : 'exit-btn';
        }
    } else if (!(isInSecondaryMenu && isInSettings)) {
        defaultButtonID = reverseOrder ? null : 'exit-btn';
    } else {
        activeMenuItem = 'exit-btn';
        removeClassFromElementClassList('exit-btn', 'active');
    }

    let defaultControlButtonID = '';
    if ((!activeMenuItem && !isPaused) || (activeMenuItem && !hasSibling)) {
        if (isPlaying) {
            if (!isPaused) {
                defaultControlButtonID = 'pause-game';
            } else {
                defaultControlButtonID = defaultButtonID === 'exit-btn' ? null : 'resume-game';
            }
        } else if (activeMenuItem === 'exit-btn' ||
                        !(activeMenuItem && isInSecondaryMenu) || (activeMenuItem && !isInSecondaryMenu)) {
            defaultControlButtonID = 'settings';
        }
        cycleThroughSettings(defaultControlButtonID, defaultButtonID, reverseOrder);
    }
}

/**
 * Manipulates DOM to give appearance of cycling through menu options
 * @param {string} menuOptionsContainerID - id of element containing menu options
 * @param {*} defaultControlButtonID - id of control button to default to if none are active or end of menu is reached
 * @param {*} defaultButtonID - id of button to default to if none are active or end of menu is reached
 * @param {*} reverseOrder - if menu should be traversed in reverse order
 */
 function cycleThroughSettings(defaultControlButtonID, defaultButtonID, reverseOrder) {
    let activeMenuItem = '';
    let activeGameStateControlItem = document.querySelectorAll('#controls button.active')[0];
    let siblingPropertyName = reverseOrder ? 'previousElementSibling' : 'nextElementSibling';
    let isInSecondaryMenu = currentMenu.endsWith('content');
    let isInSettings = currentMenu.indexOf('settings') > -1;
    let exitButton = document.getElementById('exit-btn');
    let hasSibling = false;

    if (activeGameStateControlItem) {
        removeClassFromElementClassList(activeGameStateControlItem.id, 'active');
        let menuItemToMakeActive = activeGameStateControlItem[siblingPropertyName];
        let activeMenuItemClassName = "";

        if (menuItemToMakeActive) {
            activeMenuItemClassName = menuItemToMakeActive.className;
            let tempActiveMenuItem = activeGameStateControlItem;
            while (menuItemToMakeActive && activeMenuItemClassName.indexOf('hidden') !== -1) {
                menuItemToMakeActive = tempActiveMenuItem[siblingPropertyName];
                if (menuItemToMakeActive) {
                    activeMenuItemClassName = menuItemToMakeActive.className;
                    tempActiveMenuItem = menuItemToMakeActive;
                }
            }
        }

        if (menuItemToMakeActive && activeMenuItemClassName.indexOf('active') === -1) {
            addClassToElementClassList(activeGameStateControlItem[siblingPropertyName].id, 'active');
            activeGameStateControlItem[siblingPropertyName].focus();
            hasSibling = true;
        } else {
            activeMenuItem = 'settings';
            if (activeGameStateControlItem && isInSecondaryMenu && isInSettings) {
                defaultControlButtonID = reverseOrder ? 'exit-btn' : defaultButtonID;
            } else if (!isInSecondaryMenu) {
                let buttons = document.querySelectorAll(currentMenu + ' button');
                defaultControlButtonID = buttons[reverseOrder ? buttons.length - 1 : 0].id;
            } else {
                defaultControlButtonID = null;
                defaultButtonID = 'exit-btn';
            }
            removeClassFromElementClassList(activeMenuItem, 'active');
        }
    } else if (isInSecondaryMenu) {
        if (isInSettings && reverseOrder) {
            defaultControlButtonID = !defaultButtonID ? 'settings' : null;
            if (isInSettings) {
                if (!isPaused) {
                    defaultButtonID = 'game-keys';
                }
            } else {
                defaultButtonID = null;
            }
        } else {
            if (!isInSettings && exitButton.className.indexOf('active') === -1) {
                defaultControlButtonID = '';
            }
            activeMenuItem = 'exit-btn';
            removeClassFromElementClassList(activeMenuItem, 'active');
        }
    }

    if (!activeGameStateControlItem || (activeGameStateControlItem && !hasSibling)) {
        let nextMenuButton = document.getElementById(defaultControlButtonID || defaultButtonID);
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
 * Hides game controls
 */
function hideGameControls() {
    addClassToElementClassList('pause-game', 'hidden');
    addClassToElementClassList('resume-game', 'hidden');
    addClassToElementClassList('restart-game', 'hidden');
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
 * Toggles arrow key setting between 'ON' and 'OFF'
 */
 function toggleShowArrowKeysSetting() {
    let isShowingKeys = false;
    let keyControl = document.getElementById('non-keyboard-controls');

    if (keyControl.classList.contains('hidden')) {
        isShowingKeys = true;
        removeClassFromElementClassList('non-keyboard-controls', 'hidden');
    } else {
        addClassToElementClassList('non-keyboard-controls', 'hidden');
    }
    
    document.getElementById('key-setting').textContent = isShowingKeys ? 'ON' : 'OFF';
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
 * Hides form for highscore entry
 */
function hideHighScoreEntryForm() {
    addClassToElementClassList('score-submission', 'hidden');
    removeClassFromElementClassList('exit-btn', 'hidden');
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

    if (leaderBoardHTML === '<ol></ol>') {
        leaderBoardHTML = 'No winners yet...';
    }
    document.getElementById('scores').innerHTML = leaderBoardHTML;
}
//#endregion