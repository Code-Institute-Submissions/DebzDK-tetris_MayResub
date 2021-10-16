// Global variables
const CANVAS = document.getElementById('tetris');
const TET_GRID = CANVAS.getContext('2d');

let board;
let block;

let canvasWidth;
let canvasHeight;
let blockX;
let blockY;

let timer;
let gameSpeed = 1000;

let isPlaying = false;
let isPaused = false;
let isFalling = false;
let isGameOver = false;

//#region Game event listeners
/**
 * Sets speed of movement of tetris block
 * @param {int} amountInMs - time in ms
 */
function setGameSpeed(amountInMs) {
    clearInterval(timer);
    gameSpeed = amountInMs;
    timer = setInterval(progressGame, amountInMs);
}

// Down arrow key pressed
document.addEventListener('keydown', function(e) {
    switch (e.code) {
        case 'ArrowLeft':
            moveLf();
            break;
        case 'ArrowDown':
        default:
            if (gameSpeed !== 100) {
                setGameSpeed(100);
            }
    }
});

// Down arrow key released
document.addEventListener('keyup', function(e) {
    if (e.code === "ArrowDown" || e.code === "ArrowLeft") setGameSpeed(1000)
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
 * Initialises game stats
 */
function initialiseStats() {
    document.getElementById('score').textContent = 0;
    document.getElementById('level').textContent = 1;
}

/**
 * Starts the game
 */
function startGame() {
    hideMainMenu();

    initialiseBoard();
    initialiseStats();

    setCurrentBlock();
    
    setBlockStartPosition();

    setCurrentBlockColour();
    drawBlock();

    timer = setInterval(progressGame, gameSpeed);
}

/**
 * Assigns new block object to global variable
 */
function setCurrentBlock() {
    block = new Block();
}

/**
 * Assigns canvas fill colour for block
 */
function setCurrentBlockColour() {
    // Tetris block colour
    TET_GRID.fillStyle = block.currentColour;
}

/**
 * Assigns values to the variables for the current block's (X,Y) pos
 */
function setBlockStartPosition() {
    blockX = canvasWidth / (2 * BLOCK_SIZE);
    blockY = 0;
}

/**
 * Draws current block object on canvas
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
                    board.grid[blockY + y][blockX + x] = 1;
                    TET_GRID.fillRect(blockX + x, blockY + y, 1, 1);
                    TET_GRID.strokeRect(blockX + x, blockY + y, 1, 1);
                }
            }
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
        setBlockStartPosition();
        setCurrentBlock();
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
                    !firstBitInBlockRow && board.grid[blockY + block.currentBlock.yOffset + 1][blockX + block.currentBlock.xOffset - 1]) {
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
 * Timer function for progressing or ending a game
 */
function progressGame() {
    moveDn();
}
//#endregion

//#region Menu functions

/**
 * Adds listeners to all of the menu buttons, executing as appropriate for each button
 */
function setupListeners() {
    let menuButtons = document.getElementsByClassName('menu-item');

    for (let i = 0; i < menuButtons.length; i++) {
        menuButtons[i].addEventListener('click', function() {
            switch (this.id) {
                case 'game-play':
                    startGame();
                case 'game-controls':
                    setSecondaryMenuTitle('Controls');
                    showSecondaryMenuContent('controls');
                    showSecondaryMenu();
                    break;
                case 'game-credits':
                    setSecondaryMenuTitle('Credits');
                    showSecondaryMenuContent('credits');
                    showSecondaryMenu();
                    break;
                default:
                    return;
            }
        });
    }
}

/**
 * Hides the main menu
 */
 function hideMainMenu() {
    document.getElementById('menu').className = 'hidden';
}

/**
 * Displays the secondary menu
 */
function showSecondaryMenu() {
    document.getElementById('secondary-menu').className = 'bordered-box';
}

/**
 * Hides the secondary menu and the potential contents being displayed
 */
function hideSecondaryMenu() {
    document.getElementById('secondary-menu').className = 'bordered-box hidden';
    hideSecondaryMenuContent('controls');
    hideSecondaryMenuContent('credits');
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
    document.getElementById('secondary-menu-' + contentName + '-content').className = className;
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
//#endregion