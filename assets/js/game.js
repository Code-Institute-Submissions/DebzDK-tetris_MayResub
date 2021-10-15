// Global variables
const CANVAS = document.getElementById('tetris');
const TET_GRID = CANVAS.getContext('2d');

let board;
let block;

let canvasWidth;
let canvasHeight;
let blockX;
let blockY;

let isPlaying = false;
let isPaused = false;
let isFalling = false;
let isGameOver = false;

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

    setCurrentBlockAndColour();
    drawBlock();
}

function setCurrentBlockAndColour() {
    block = new Block();

    // Tetris block colour
    TET_GRID.fillStyle = block.currentColour;
}

/**
 * Draws current block object on canvas
 */
function drawBlock() {
    blockX = canvasWidth / (2 * BLOCK_SIZE);
    blockY = 0;

    for (let y = 0; y < block.currentBlock.shape.length; y++) {
        let blockRow = block.currentBlock.shape[y];
        for (let x = 0; x < blockRow.length; x++) {
            let bitInBlock = blockRow[x];
            if (bitInBlock) {
                board.grid[blockY + y][blockX + x] = 1;
                TET_GRID.fillRect(blockX + x, blockY + y, 1, 1);
                TET_GRID.strokeRect(blockX + x, blockY + y, 1, 1);
            }
        }
    }
    console.table(board.grid);
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