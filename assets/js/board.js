const COLS = 20;
const ROWS = 40;

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