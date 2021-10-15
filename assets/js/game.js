// Global variables
const CANVAS = document.getElementById('tetris');
const TET_GRID = canvas.getContext('2d');
TET_GRID.canvas.width = COLS * BLOCK_SIZE;
TET_GRID.canvas.height = ROWS * BLOCK_SIZE;
TET_GRID.scale(BLOCK_SIZE, BLOCK_SIZE);

let isPlaying = false;
let isPaused = false;

//#region Game functions
function startGame() {
    let board = new Board(TET_GRID);
}

//#region Menu functions

/**
 * Adds listeners to all of the menu buttons, executing as appropriate for each button
 */
function setupListeners() {
    let menuButtons = document.getElementsByClassName('menu-item');

    for (let i = 0; i < menuButtons.length; i++) {
        menuButtons[i].addEventListener('click', function() {
            switch (this.id) {
                case 'game-controls':
                    setSecondaryMenuTitle('Controls');
                    showSecondaryMenuContent('controls');
                    break;
                case 'game-credits':
                    setSecondaryMenuTitle('Credits');
                    showSecondaryMenuContent('credits');
                    break;
                default:
                    return;
            }

            showSecondaryMenu();
        });
    }
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