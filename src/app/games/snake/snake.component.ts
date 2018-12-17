import { Component, OnInit, HostListener } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-snake',
  templateUrl: './snake.component.html',
  styleUrls: ['./snake.component.css']
})
export class SnakeComponent implements OnInit {
  state
  canvas 
  ctx
 
  constructor() { }

  ngOnInit() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')
    this.state = this.initialState()
    this.draw();  
    window.requestAnimationFrame(this.step(0))
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    switch (event.key) {
      case 'w': case 'h': case 'ArrowUp':    this.state = this.enqueue(this.state, NORTH); break
      case 'a': case 'j': case 'ArrowLeft':  this.state = this.enqueue(this.state, WEST);  break
      case 's': case 'k': case 'ArrowDown':  this.state = this.enqueue(this.state, SOUTH); break
      case 'd': case 'l': case 'ArrowRight': this.state = this.enqueue(this.state, EAST);  break
    }
  }
 // Position helpers
 x = c => Math.round(c * this.canvas.width / this.state.cols)
 y = r => Math.round(r * this.canvas.height / this.state.rows)

  // Game loop draw
draw() {
  // clear
  this.ctx.fillStyle = '#232323'
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

  // draw snake
  this.ctx.fillStyle = 'rgb(0,200,50)'
  this.state.snake.map(p => this.ctx.fillRect(this.x(p.x), this.y(p.y), this.x(1), this.y(1)))

  // draw apples
  this.ctx.fillStyle = 'rgb(255,50,0)'
  this.ctx.fillRect(this.x(this.state.apple.x), this.y(this.state.apple.y), this.x(1), this.y(1))

  // add crash
  if (this.state.snake.length == 0) {
    this.ctx.fillStyle = 'rgb(255,0,0)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }
}

step = t1 => t2 => {
  if (t2 - t1 > 100) {
    this.state = this.next(this.state)
    this.draw()
    window.requestAnimationFrame(this.step(t2))
  } else {
    window.requestAnimationFrame(this.step(t1))
  }
}

enqueue (state, move){
 return this.validMove(move)(state)
 ? merge(state)({ moves: state.moves.concat([move]) })
 : state
} 

// Point operations
/**currying */
// pointEq = p1 => p2 => p1.x == p2.x && p1.y == p2.y
/** not currying */
pointEq (p1){
  return (p2) => {
    return p1.x == p2.x && p1.y == p2.y
  }
} 

willEat(state)  {
 return this.pointEq(this.nextHead(state))(state.apple)

}
willCrash(state){
  return state.snake.find(this.pointEq(this.nextHead(state)))
}

validMove = move => state =>
  state.moves[0].x + move.x != 0 || state.moves[0].y + move.y != 0

// Next values based on state
 nextMoves = state => state.moves.length > 1 ? dropFirst(state.moves) : state.moves
 nextApple = state => this.willEat(state) ? this.rndPos(state) : state.apple
 nextHead  = state => state.snake.length == 0
  ? { x: 2, y: 2 }
  : {
    x: mod(state.cols)(state.snake[0].x + state.moves[0].x),
    y: mod(state.rows)(state.snake[0].y + state.moves[0].y)
  }
 nextSnake = state => this.willCrash(state)
  ? []
  : (this.willEat(state)
    ? [this.nextHead(state)].concat(state.snake)
    : [this.nextHead(state)].concat(dropLast(state.snake)))


  rndPos = table => ({
    x: rnd(0)(table.cols - 1),
    y: rnd(0)(table.rows - 1)
  })
    
  // Initial state
    initialState = () => ({
    cols:  20,
    rows:  14,
    moves: [EAST],
    snake: [],
    apple: { x: 16, y: 2 },
  })
  
    next = spec({
    rows:  prop('rows'),
    cols:  prop('cols'),
    moves: this.nextMoves,
    snake: this.nextSnake,
    apple: this.nextApple
  })

}

const adjust    = n => f => xs => mapi(x => i => i == n ? f(x) : x)(xs)
const dropFirst = xs => xs.slice(1)
const dropLast  = xs => xs.slice(0, xs.length - 1)
const id        = x => x
const k         = x => y => x
const map       = f => xs => xs.map(f)
const mapi      = f => xs => xs.map((x, i) => f(x)(i))
const merge     = o1 => o2 => Object.assign({}, o1, o2)
const mod       = x => y => ((y % x) + x) % x // http://bit.ly/2oF4mQ7
const objOf     = k => v => { var o = {}; o[k] = v; return o }
const pipe      = (...fns) => x => [...fns].reduce((acc, f) => f(acc), x)
const prop      = k => o => o[k]
const range     = n => m => Array.apply(null, Array(m - n)).map((_, i) => n + i)
const rep       = c => n => map(k(c))(range(0)(n))
const rnd       = min => max => Math.floor(Math.random() * max) + min
const spec      = o => x => Object.keys(o)
  .map(k => objOf(k)(o[k](x)))
  .reduce((acc, o) => Object.assign(acc, o))

const NORTH = { x: 0, y:-1 }
const SOUTH = { x: 0, y: 1 }
const EAST  = { x: 1, y: 0 }
const WEST  = { x:-1, y: 0 }