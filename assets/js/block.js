// Tetris blocks represented in 3x3 matrixes
const BLOCK_TYPES = {
    L: {
        shape: [[1, 0, 0],
                [1, 0, 0],
                [1, 1, 0]],
        height: 3,
        width: 2,
        xOffset: 0,
        yOffset: 0
    },
    J: {
        shape: [[0, 1, 1],
                [0, 0, 1],
                [0, 0, 1]],
        height: 3,
        width: 2,
        xOffset: 1,
        yOffset: 0
    },
    Z: {
        shape: [[0, 0, 0],
                [1, 1, 1],
                [0, 1, 1]],
        height: 3,
        width: 2,
        xOffset: 0,
        yOffset: 1
    },
    S: {
        shape: [[0, 0, 0],
                [0, 1, 1],
                [1, 1, 0]],
        height: 3,
        width: 3,
        xOffset: 0,
        yOffset: 1
    },
    SQ: {
        shape: [[0, 0, 0],
                [0, 1, 1],
                [0, 1, 1]],
        height: 2,
        width: 2,
        xOffset: 1,
        yOffset: 1
    },
    I: {
        shape: [[1, 0, 0],
                [1, 0, 0],
                [1, 0, 0]],
        height: 3,
        width: 1,
        xOffset: 0,
        yOffset: 0
    },
    T: {
        shape: [[0, 0, 0],
                [1, 1, 1],
                [0, 1, 0]],
        height: 2,
        width: 3,
        xOffset: 0,
        yOffset: 1
    }
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
        this.currentColour = COLOURS[this.getRandNumber(5)];
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