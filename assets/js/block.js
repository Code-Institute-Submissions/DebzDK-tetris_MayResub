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
const BLOCK_SIZE = 20; // Multiplier for calculating board size

const BLOCKS = [BLOCK_TYPES.L, BLOCK_TYPES.J,
                BLOCK_TYPES.Z, BLOCK_TYPES.S,
                BLOCK_TYPES.SQ,
                BLOCK_TYPES.I, BLOCK_TYPES.T];

// Stores the tetris block represented by the Block object
let currentBlock = [];

class Block {
    /**
     * Sets the block to be represented by the Block object
     */
    constructor() {
        currentBlock = BLOCKS[this.getRandNumber()];
    }

    /**
     * 
     * @returns a random number between 0 and 6;
     */
    getRandNumber(){
        return Math.floor(Math.random() * 7);
    }
}