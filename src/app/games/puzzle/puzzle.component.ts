import { Component, OnInit } from '@angular/core';
import { Observable, timer  } from 'rxjs';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {  GridsterConfig, GridsterItem, CompactType, DisplayGrid, GridsterComponentInterface, GridsterItemComponentInterface,
  GridType } from 'angular-gridster2';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MessageService } from '../services/messages/message.service';
import { HighScoreService } from '../services/highScore/high-score.service';
import { MatDialog } from '@angular/material/dialog';
import { AskForNameComponent } from '../services/highScore/ask-for-name/ask-for-name.component';
import { IsActiveService } from '../services/is-active.service';

@Component({
  selector: 'app-puzzle',
  templateUrl: './puzzle.component.html',
  styleUrls: ['./puzzle.component.css']
})
export class PuzzleComponent implements OnInit {

  constructor(
              private highScore: HighScoreService,
              public dialog: MatDialog,
              public ias: IsActiveService) { }

  options: GridsterConfig;
  dashboard: Array<GridsterItem>;
  resizeForm: FormGroup;
  startPos: Array<{y: number, x: number}>
  randomPos: Array<{y: number, x: number}>

  imageUrl: string = './assets/DSC_0627a.jpg';
  imageUrls: string[] = ['./assets/DSC_0627a.jpg', './assets/building-cloud.jpeg', './assets/water-sunlight.jpg']
  imageSize: number = 500;
  gridsize: number;
  boxSize: number = 100 / (this.gridsize - 1);
  index: number = 0;
  totalBoxes: number = this.gridsize * this.gridsize;
  Image: any[] = [];
  difficulty: number ;
  steps: number = 0;
  ticks: string = '0:00';
  timer: any = timer(0, 1000);
  timeVar: any;
  isActive;

  // panelOpenState = false;

  ngOnInit() {
    this.resizeForm = new FormGroup({
      'row': new FormControl(2, [Validators.min(2), Validators.max(10)]),
      // 'col': new FormControl()
    })
    this.setGridOptions();
    // this.startGame()
    this.ias.isAtiveChange.subscribe(value=>{
      if(this.options){
        if(this.options.api!=undefined){
          this.options.api.resize();
        }
      }
      return this.isActive=value
    })
  }

  private setGridOptions() {
    this.options = {
      gridType:'fit',
      // setGridSize:true,
      draggable: {ignoreContent:true},
      // ignoreContentClass?: string;
    // ignoreContent?: boolean;
    // dragHandleClass?: string;
    // dropOverItems?: boolean;
      mobileBreakpoint:100,
      disableScrollHorizontal:true,
      disableScrollVertical:true,
      itemChangeCallback: this.itemChange,
      Resizable: false,
      Draggable: true,
      displayGrid: 'none',
      margin: 2,
      disableWarnings: true,
    };
    this.options.itemChangeCallback = this.itemChange.bind(this);
  }

  buildGrid(){

    this.options.defaultItemCols=this.difficulty;
    this.options.defaultItemRows=this.difficulty;
    this.options.minCols=this.difficulty;
    this.options.maxCols=this.difficulty;
    this.options.minRows=this.difficulty;
    this.options.maxRows=this.difficulty;
    
    
    let numberOfRows=this.difficulty
    let numberOfCols=this.difficulty
    let pieceNo=0
    for(let i=0;i<numberOfRows; i++){
      for(let j=0;j<numberOfCols; j++){
        this.dashboard.push({cols: 1, rows: 1, y: i, x: j, dragEnabled: true, image: this.Image[pieceNo]})
        this.startPos.push({y: i, x: j,})
        pieceNo++
      }
      // console.log(this.Image[2])
    }
  }

  itemChange() {
    this.steps++
    for(let i=0; i<this.dashboard.length; i++){
      if(this.dashboard[i].x!==this.startPos[i].x||this.dashboard[i].y!==this.startPos[i].y){
        return false
      }
    }
    console.log("solved")
    this.highScore.addScore('Puzzle', this.getScore())
    // this.message.add(`Game Complete.		You completed the game in time = ${this.ticks} & ${this.steps/2 } steps.`)
    this.options.draggable.ignoreContent=true
    this.options.api.optionsChanged()
    console.log(this.options)
    if (this.timeVar) {
      this.timeVar.unsubscribe();
    }
    return true
  }

  // randomGrid(dashboard, numberOfRows){
  randomizeGrid(){
    this.randomPos=this.startPos.slice(0);
    console.log(this.randomPos)
    while(JSON.stringify(this.randomPos)==JSON.stringify(this.startPos)){
      this.shuffle(this.randomPos)
    }
    for(let i=0; i<this.dashboard.length; i++){
      this.dashboard[i].x= this.randomPos[i].x
      this.dashboard[i].y= this.randomPos[i].y
    }
    // console.log(this.dashboard)
    
    this.options.api.optionsChanged()
  }

  shuffle(array: Array<any>) {
    var currentIndex = array.length, temporaryValue:number, randomIndex: number;

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }

  startGame(): void {
    this.reset();
    this.initializeGame();
    this.breakImageParts();
    this.buildGrid()
    this.steps=0
    console.log(this.resizeForm)
    setTimeout(() => {   
      this.randomizeGrid();
      this.options.draggable.ignoreContent=false
      this.options.api.optionsChanged()
      if (this.timeVar) {
        this.timeVar.unsubscribe();
      }
      this.timeVar = this.timer.subscribe(t => {
        this.settime(t);
      });
    }, 1500);
  }

  initializeGame(): void {
    this.gridsize = Number(this.difficulty);
    this.boxSize = 100 / (this.gridsize - 1);
    this.index = 0;
    this.totalBoxes = this.gridsize * this.gridsize;
  }

  reset(): void {
    this.Image = [];
    this.dashboard = []
    this.startPos=[]
    this.step= 2;
    this.ticks='0:00';
    // this.gameComplete = false;
    this.difficulty=this.resizeForm.value.row
  }

  settime(t: number): void {
    this.ticks = Math.floor (t / 60).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })
                             + ':' +
                            (t % 60).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
  }

  breakImageParts(): void {
    for (this.index = 0; this.index < this.totalBoxes; this.index++) {
      const x: string = (this.boxSize * (this.index % this.gridsize)) + '%';
      const y: string = (this.boxSize * Math.floor(this.index / this.gridsize)) + '%';
      let img: ImageBox = new ImageBox();
      img.x_pos = x;
      img.y_pos = y;
      this.Image.push(img);
    }
    console.log(this.Image)
    this.boxSize = this.imageSize / this.gridsize;
  }

  getScore(): any {
    return {time:this.ticks, steps:this.steps/2, difficulty: this.difficulty}
  }
  setImage(imageUrl){
    this.imageUrl=imageUrl
    this.nextStep() 
    // this.step=1
    // this.startGame()
  }

  step = 0;
  closeOnStart=false

  setStep(index: number) {
    this.step = index;
  }

  nextStep() {
    this.step++;
  }
}

class ImageBox {
  x_pos: string;
  y_pos: string;
}
