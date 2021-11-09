/* jshint esversion: 8 */

const COLS = 30;
const ROWS = 60;

class Board {
    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    constructor(ctx) {
        this.ctx = ctx;
        this.grid = this.getEmptyBoard();
    }

    /**
     * Gets an empty board represented as a zero-filled array
     * @returns an array
     */
    getEmptyBoard() {
        return Array.from(
            {length: ROWS}, function() { return Array(COLS).fill(0); }
        );
    }
}