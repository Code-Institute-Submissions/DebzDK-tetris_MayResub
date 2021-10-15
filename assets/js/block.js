// Tetris blocks represented in 3x3 matrixes
const BLOCK_TYPES = {
    L: [[1, 0, 0],
        [1, 0, 0],
        [1, 1, 0]],
    J: [[0, 1, 1],
        [0, 0, 1],
        [0, 0, 1]],
    Z: [[1, 1, 0],
        [0, 1, 0]
        [0, 1, 1]],
    S: [[0, 1, 1,
        [0, 1, 0],
        [1, 1, 0]]],
    SQ: [[0, 0, 0],
        [0, 1, 1],
        [0, 1, 1]],
    I: [[1, 0, 0],
        [1, 0, 0]
        [1, 0, 0]],
    T: [[1, 1, 1],
        [0, 1, 0],
        [0, 0, 0]]
};

// Multiplier for calculating board size
const BLOCK_SIZE = 10;

// All possible tetris block shapes
const BLOCKS = [BLOCK_TYPES.L, BLOCK_TYPES.J,
                BLOCK_TYPES.Z, BLOCK_TYPES.S,
                BLOCK_TYPES.SQ,
                BLOCK_TYPES.I, BLOCK_TYPES.T];

// Chosen colour scheme for the tetris blocks
const COLOURS = [
    '#0341AE', // denim blue,
    '#72CB3B', // lime green
    '#FFD500', // cyber yellow
    '#FF971C', // yellow orange colour wheel
    '#FF3213' // scarlet
];

class Block {
    // Stores the tetris block represented by the Block object
    static currentBlock = [];

    // Stores the tetris block colour
    static currentColour = '#000000';

    /**
     * Sets the block type and colour to be represent the Block object
     */
    constructor() {
        this.currentBlock = BLOCKS[this.getRandNumber(7)];
        this.currentColour = COLOURS[this.getRandNumber(6)];
    }

    /**
     * Returns a random number between 0 and x, not including x
     * @param {int} x - the upper limit of the desired number range
     * @returns a random number between 0 and x;
     */
    getRandNumber(x){
        return Math.floor(Math.random() * x);
    }
}