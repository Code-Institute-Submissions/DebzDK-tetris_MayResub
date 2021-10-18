//#region Global variables
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
let statPlaceholder = '.........';

let isPlaying = false;
let isPaused = false;
let isFalling = false;
let isGameOver = false;
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
            case 'ArrowDown':
                if (gameSpeed !== 100) {
                    setGameSpeed(100);
                }
        }
    } else {
        if (e.key === 'ArrowDown') {
            cycleThroughMenu();
        } else if (e.key === 'ArrowUp') {
            cycleThroughMenu(true);
        } else if (e.key === 'Enter') {
            processMenuOption(e.target.id);
        }
    }
});

// Arrow key released
document.addEventListener('keyup', function(e) {
    if (isPlaying) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') setGameSpeed(1000)
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
 * Initialises the game stats
 * @param {boolean} withPlaceholder - if stats should be initialised with placeholder value
 */
function initialiseStats(withPlaceholder) {
    if (withPlaceholder) {
        document.getElementById('score').textContent = statPlaceholder;
        document.getElementById('level').textContent = statPlaceholder;
    } else {
        document.getElementById('score').textContent = 0;
        document.getElementById('level').textContent = 1;
    }
}

/**
 * Starts the game
 */
function startGame() {
    isPlaying = true;
    isGameOver = false;

    hideMenuAreas();
    hideSecondaryMenu();
    showGameControls();

    initialiseBoard();
    initialiseStats();

    setCurrentBlock();
    
    setBlockStartPosition();

    setCurrentBlockColour();
    drawBlock();

    timer = setInterval(progressGame, gameSpeed);
}

/**
 * Ends the game
 */
function endGame() {
    // set game flags
    isPaused = false;
    isGameOver = true;

    // clear tetris grid
    TET_GRID.clearRect(0, 0, canvasWidth, canvasWidth);

    // hides settings screen and shows game over message
    showMenuArea();
    setSecondaryMenuTitle('');
    showSecondaryMenuContent('status');
    hideSecondaryMenuContent('settings');
    setGameStatus('over');
    showSecondaryMenu();
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
    moveDn();
}

/**
 * Updates pause game control and menu display
 */
function showPausedGameScreen() {
    removeClassFromElementClassList('resume-game', 'hidden');
    addClassToElementClassList('pause-game', 'hidden');
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
    addClassToElementClassList('resume-game', 'hidden');
    removeClassFromElementClassList('pause-game', 'hidden');
    removeClassFromElementClassList('exit-btn', 'hidden');
}

/**
 * Pauses game 
 */
function pauseGame() {
    clearInterval(timer);
    isPaused = true;
}

/**
 * Resumes game
 */
function resumeGame() {
    timer = setInterval(progressGame, gameSpeed);
    isPaused = false;
}

/**
 * Displays settings menu
 */
function displaySettings() {
    hideMainMenu();
    showMenuArea();
    setSecondaryMenuTitle('Settings');
    showSecondaryMenuContent('settings');

    if (isPlaying) {
        removeClassFromElementClassList('quit-game', 'hidden');
    } else {
        addClassToElementClassList('quit-game', 'hidden');
    }

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
/**
 * Adds listeners to all of the menu buttons, executing as appropriate for each button
 */
function setupListeners() {
    let menuButtons = document.getElementsByClassName('menu-item');

    for (let i = 0; i < menuButtons.length; i++) {
        menuButtons[i].addEventListener('click', function() {
            processMenuOption(this.id);
        });
        menuButtons[i].addEventListener('mouseover', function() {
            removeClassFromAllElementsWithClass('active', 'active');
            addClassToElementClassList(this.id, 'active');
            this.focus();
        });
        menuButtons[i].addEventListener('mouseout', function() {
            removeClassFromElementClassList(this.id, 'active');
            this.blur();
        });
    }

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
                case 'settings':
                    pauseGame();
                    displaySettings();
                    break;
                default:
                    return;
            }
        });
    }

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
            removeClassToElementClassList('exit-btn-blackout', 'hidden');
            showSecondaryMenu();
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
    let elementsWithClass = document.getElementsByClassName(elementClass);

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
    addClassToElementClassList('exit-btn-blackout', 'hidden');
    setSecondaryMenuTitle('');

    if (isPaused && isPlaying) {
        resumeGame();
    } else if (isGameOver) {
        hideSecondaryMenuContent('status');
        showMainMenu();
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

function cycleThroughMenu(reverseOrder) {
    let activeMenuItem = document.getElementsByClassName('active')[0];
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
        let nextMenuButtonID = reverseOrder ? 'game-credits' : 'game-play';
        let nextMenuButton = document.getElementById(nextMenuButtonID);
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
//#endregion