/* jshint esversion: 8 */

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
                [1, 1, 0],
                [0, 1, 1]],
        height: 2,
        width: 3,
        xOffset: 0,
        yOffset: 1
    },
    S: {
        shape: [[0, 0, 0],
                [0, 1, 1],
                [1, 1, 0]],
        height: 2,
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
                [1, 0, 0],
                [1, 0, 0]],
        height: 4,
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
const BLOCK_SIZE = 20;

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

    /**
     * Calculates the offset (how far from the left (x) or top (y) before reaching bits of a block)
     * @param {string} axis - 'x' or 'y' value representing the current offset to calculate
     * @returns int - offset value
     */
    calculateOffset(axis) {
        let offset = 0;
        let numOfEmptyBits = 0;
        let numOfDefinedBits = 0;

        for (let col = 0; col < 3; col++) {
            for (let row = 0; row < 3; row++) {
                let bit = axis === 'x' ? this.currentBlock.shape[row][col] : this.currentBlock.shape[col][row];

                if (!bit) {
                    numOfEmptyBits++;
                } else {
                    numOfDefinedBits++;
                }

                if (numOfEmptyBits === 3) {
                    offset++;
                }
            }

            if (numOfDefinedBits > 0) {
                break;
            }

            numOfEmptyBits = 0;
            numOfDefinedBits = 0;
        }

        return offset;
    }
    
    //#region Rotation logic
    // sourced from https://www.youtube.com/watch?v=iAGokSQQxI8&t=1590s
    composeRotatedShape(fn1, fn2) {
        return function(arr) {
            return fn1(fn2(arr));
        };
    }

    /**
     * Creates a copy of and reverses a given array
     * @param {int[][]} arr - 2D array (the current tetris block object representation)
     * @returns int[][] - array of reversed values
     */
    reverse(arr) {
        return [...arr].reverse();
    }

    /**
     * Creates an array filled with the indexes of the current values within a given array
     * @param {int[][]} arr - 2D array (the current tetris block object representation)
     * @returns int[] - an array filled with indexes
     */
    getIndexesFromRange(arr) {
        return [...arr.keys()];
    }

    /**
     * Retrieves the value at a given index of an array
     * @param {int} index - The index/key of the desired value to get from a given array
     * @returns int - value at given index
     */
    getValueAtIndex(index) {
        return function(arr) {
            return arr[index];
        };
    }

    /**
     * Plucks out part of array based on index in data (concept from Ruby-on-rails)
     * @param {int} index - index/key of desired value
     * @param {int[][]} arr - 2D array
     * @returns 
     */
    pluck(index, arr) {
        return arr.map(this.getValueAtIndex(index));
    }

    /**
     * Flips the reversed array of the current tetris block and sets the result as the current block
     * @param {int[][]} arr - 2D array (the tetris block representation)
     */
    flip(arr) {
        return this.getIndexesFromRange(arr).map((function(value) {
            return this.pluck(value, arr);
        }).bind(this));
    }

    /**
     * Rotates the current tetris block clockwise and updates width, height, and offset properties
     */
    rotateBlockClockwise() {
        this.currentBlock.shape = this.composeRotatedShape(this.flip.bind(this), this.reverse.bind(this))(this.currentBlock.shape);
        this.currentBlock.xOffset = this.calculateOffset('x');
        this.currentBlock.yOffset = this.calculateOffset('y');

        let tempHeight = this.currentBlock.height;
        this.currentBlock.height = this.currentBlock.width;
        this.currentBlock.width = tempHeight;
    }
    //#endregion
}