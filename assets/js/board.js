const COLS = 10;
const ROWS = 30;

class Board {
    constructor(ctx) {
        this.ctx = ctx;
        this.grid = this.getEmptyBoard();
    }

    getEmptyBoard() {
        return Array.from(
            {length: ROWS}, function() { Array(COLS).fill(0) }
        );
    }
}