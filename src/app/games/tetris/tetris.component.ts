
import { Component, ViewChild, ElementRef, OnInit, HostListener } from '@angular/core';
import { COLS, BLOCK_SIZE, BLOCK_SIZE_MOBILE, ROWS, KEY, POINTS, COLORS, LEVEL, LINES_PER_LEVEL } from './constants';
import { Piece, IPiece } from './piece.component';
import { GameService } from './game.service';
import { HighScoreService } from '../services/highScore/high-score.service';

@Component({
  selector: 'app-tetris',
  templateUrl: './tetris.component.html',
  styleUrls: ['./tetris.component.css']
})
export class TetrisComponent implements OnInit {
  @ViewChild('board', { static: true }) canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('next', { static: true }) canvasNext: ElementRef<HTMLCanvasElement>;
  ctx: CanvasRenderingContext2D;
  ctxNext: CanvasRenderingContext2D;
  board: number[][];
  piece: Piece;
  next: Piece;
  requestId: number;
  paused: boolean;
  gameStarted: boolean;
  time: { start: number; elapsed: number; level: number };
  points: number;
  // highScore: number;
  lines: number;
  level: number;
  moves = {
    //... = shallow copy
    [KEY.LEFT]: (p: IPiece): IPiece => ({ ...p, x: p.x - 1 }),
    [KEY.RIGHT]: (p: IPiece): IPiece => ({ ...p, x: p.x + 1 }),
    [KEY.DOWN]: (p: IPiece): IPiece => ({ ...p, y: p.y + 1 }),
    [KEY.SPACE]: (p: IPiece): IPiece => ({ ...p, y: p.y + 1 }),
    [KEY.UP]: (p: IPiece): IPiece => this.service.rotate(p)
  };

  @HostListener('window:keydown', ['$event']) keyEvent(event: KeyboardEvent) {
    if (event.keyCode === KEY.ESC) {
      this.gameOver();
    } else if (this.moves[event.keyCode]) {
      // Get new state
      let p = this.moves[event.keyCode](this.piece);
      if (event.keyCode === KEY.SPACE) {
        // Hard drop
        while (this.service.valid(p, this.board)) {
          this.points += POINTS.HARD_DROP;
          this.piece.move(p);
          p = this.moves[KEY.DOWN](this.piece);
        }
      } else if (this.service.valid(p, this.board)) {
        this.piece.move(p);
        if (event.keyCode === KEY.DOWN) {
          this.points += POINTS.SOFT_DROP;
        }
      }
    }
  }
  swipeLeft(){
    let p = this.moves[KEY.LEFT](this.piece)
    if (this.service.valid(p, this.board)){
      this.piece.move(p);
    }
  }
  swipeRight(){
    let p = this.moves[KEY.RIGHT](this.piece)
    if (this.service.valid(p, this.board)){
      this.piece.move(p);
    }
  }
  swipeUp(){
    let p = this.moves[KEY.UP](this.piece)
    if (this.service.valid(p, this.board)){
      this.piece.move(p);
    }
  }
  swipeDown(){
    let p = this.moves[KEY.SPACE](this.piece)
    // Hard drop
    while (this.service.valid(p, this.board)) {
      console.log("space")
      this.points += POINTS.HARD_DROP;
      this.piece.move(p);
      p = this.moves[KEY.DOWN](this.piece);
    }
  }

  constructor(private service: GameService, private highScore: HighScoreService) {}

  ngOnInit() {
    // console.log(window.screen.width)
    if(window.screen.width<600){
      this.initBoard(BLOCK_SIZE_MOBILE);
      this.initNext(BLOCK_SIZE_MOBILE);
    }else{
      this.initBoard(BLOCK_SIZE);
      this.initNext(BLOCK_SIZE);
    }
    this.resetGame();
    // this.highScore = 0;
  }

  initBoard(blockSize) {
    this.ctx = this.canvas.nativeElement.getContext('2d');

    // Calculate size of canvas from constants.
    this.ctx.canvas.width = COLS * blockSize;
    this.ctx.canvas.height = ROWS * blockSize;

    // Scale so we don't need to give size on every draw. scale up from 1px to 1 block
    this.ctx.scale(blockSize, blockSize);
  }

  initNext(blockSize) {
    this.ctxNext = this.canvasNext.nativeElement.getContext('2d');

    // Calculate size of canvas from constants.
    //+2 for the ---- border
    this.ctxNext.canvas.width = 4 * blockSize +2;
    this.ctxNext.canvas.height = 4 * blockSize;

    this.ctxNext.scale(blockSize, blockSize);
  }

  play() {
    this.gameStarted = true;
    this.resetGame();
    this.next = new Piece(this.ctx);
    this.piece = new Piece(this.ctx);
    this.next.drawNext(this.ctxNext);
    this.time.start = performance.now();

    // If we have an old game running a game then cancel the old
    if (this.requestId) {
      cancelAnimationFrame(this.requestId);
    }

    this.animate();
  }

  resetGame() {
    this.points = 0;
    this.lines = 0;
    this.level = 0;
    this.board = this.getEmptyBoard();
    this.time = { start: 0, elapsed: 0, level: LEVEL[this.level] };
    this.paused = false;
    this.addGrid();
  }

  animate(now = 0) {
    this.time.elapsed = now - this.time.start;
    //check for the time in current level
    if (this.time.elapsed > this.time.level) {
      this.time.start = now;
      if (!this.drop()) {
        this.gameOver();
        return;
      }
    }
    this.draw();
    this.requestId = requestAnimationFrame(this.animate.bind(this));
  }

  draw() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.piece.draw();
    this.drawBoard();
  }

  drop(): boolean {
    let p = this.moves[KEY.DOWN](this.piece);
    if (this.service.valid(p, this.board)) {
      this.piece.move(p);
    } else {
      this.freeze();
      this.clearLines();
      //when a piece cant move down and its position is 0 its Game over
      if (this.piece.y === 0) {
        return false;
      }
      this.piece = this.next;
      this.next = new Piece(this.ctx);
      this.next.drawNext(this.ctxNext);
    }
    return true;
  }

  clearLines() {
    let lines = 0;
    //if any row has only non zero values remove it and and a new on top
    this.board.forEach((row, y) => {
      if (row.every(value => value !== 0)) {
        lines++;
        this.board.splice(y, 1);
        this.board.unshift(Array(COLS).fill(0));
      }
    });
    //calculate points according to removed lines and change level if needed
    if (lines > 0) {
      this.points += this.service.getLinesClearedPoints(lines, this.level);
      this.lines += lines;
      if (this.lines >= LINES_PER_LEVEL) {
        this.level++;
        this.lines -= LINES_PER_LEVEL;
        this.time.level = LEVEL[this.level];
      }
    }
  }

  //freeze the piece in place on bottom
  freeze() {
    this.piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.board[y + this.piece.y][x + this.piece.x] = value;
        }
      });
    });
  }
  //add the helping lines
  private addGrid() {
    for(let index = 1; index < COLS; index++) {
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(index, 0, .025, this.ctx.canvas.height);
    }

    for(let index = 1; index < ROWS; index++) {
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(0, index, this.ctx.canvas.width, .025);
    }
  }
  //paint the board on canvas
  drawBoard() {
    this.board.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.ctx.fillStyle = COLORS[value];
          this.ctx.fillRect(x, y, 1, 1);
        }
      });
    });
    this.addGrid();
  }

  pause() {
    if (this.gameStarted) {
      if (this.paused) {
        this.animate();
      } else {
        this.ctx.font = '1px Arial';
        this.ctx.fillStyle = 'black';
        this.ctx.fillText('GAME PAUSED', 1.4, 4);
        cancelAnimationFrame(this.requestId);
      }

      this.paused = !this.paused;
    }
  }

  gameOver() {
    this.gameStarted = false;
    cancelAnimationFrame(this.requestId);
    // this.highScore = this.points > this.highScore ? this.points : this.highScore;
    this.highScore.addScore('Tetris', this.getScore())
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(1, 3, 8, 1.2);
    this.ctx.font = '1px Arial';
    this.ctx.fillStyle = 'red';
    this.ctx.fillText('GAME OVER', 1.8, 4);
  }
  getScore(): any {
    return {score: this.points, level:this.level, lines:this.lines}
  }

  getEmptyBoard(): number[][] {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }
}