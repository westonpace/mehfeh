import * as d3 from 'd3';
import * as groupBy from 'group-by';

import { Component, ElementRef, AfterViewInit } from '@angular/core';

import { Index } from 'mehfeh-model';

import { IconsService } from './icons.service';
import { ModelService } from './model.service';

const X = 'defense';
const Y = 'resistance';
const ICON = 'movementType';

interface DupelessStats {
  name: string;
  x: number;
  y: number;
}

interface Stats extends DupelessStats{
  dupeNumber: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {

  constructor(private hostRef: ElementRef, private iconsService: IconsService, private modelService: ModelService) {

  }

  ngAfterViewInit() {
    this.iconsService.loaded.subscribe(loaded => {
      if(loaded) {
        this.modelService.model.subscribe(model => {
          this.render(model);
        });
      }
    });
  }

  private reportIncorrectlyConfiguredHeroes(model: Index) {
    Object.keys(model.heroes).filter(heroName => !model.heroes[heroName].levelFortyStats[5]).forEach((heroName) => {
      console.log('Ignoring ' + heroName);
    });
  }

  private reportRanges(model: Index) {
    for(let key of ['attack', 'defense', 'hp', 'speed', 'resistance']) {
      let values = Object.keys(model.heroes).map(heroName => model.heroes[heroName].levelFortyStats[5][key]);
      let min = Math.min(...values);
      let max = Math.max(...values);
      console.log(key + ': ' + min + ' - ' + max + ' (' + (max - min) + ')');
    }
  }

  private calculateSize(stats: Stats[]): { width: number, height: number } {
    let xExtent = d3.extent(stats.map(stat => stat.x));
    let yExtent = d3.extent(stats.map(stat => stat.y));
    let xRange = xExtent[1] - xExtent[0];
    let yRange = yExtent[1] - yExtent[0];
    return {
      width: (xRange + 1) * 80 + 150,
      height: (yRange + 1) * 80 + 100
    };
  }

  private calculateDupeNumber(stats: DupelessStats[]) {
    let statsCast = stats as Stats[];
    let dupeNumbers = {};
    for(let stat of statsCast) {
      let key = stat.x + '-' + stat.y;
      let dupeCount = dupeNumbers[key];
      if(dupeCount !== undefined) {
        stat.dupeNumber = dupeCount + 1;
      } else {
        stat.dupeNumber = 0;
      }
      if(stat.dupeNumber === 4) {
        console.log('ERR: Cannot fit: ' + stat.name);
      }
      dupeNumbers[key] = stat.dupeNumber;
    }
    return statsCast;
  }

  private getXRoot(stat: Stats, xScale: d3.ScaleLinear<number, number>) {
    if(stat.dupeNumber === 0 || stat.dupeNumber === 2) {
      return xScale(stat.x - 0.5);
    } else {
      return xScale(stat.x);
    }
  }

  private getYRoot(stat: Stats, yScale: d3.ScaleLinear<number, number>) {
    if(stat.dupeNumber === 0 || stat.dupeNumber === 1) {
      return yScale(stat.y + 0.5);
    } else {
      return yScale(stat.y);
    }
  }

  private render(model: Index) {
    this.reportIncorrectlyConfiguredHeroes(model);
    this.reportRanges(model);
    let rawStats = Object.keys(model.heroes).filter(heroName => model.heroes[heroName].levelFortyStats[5]).map(heroName => {
      return {
        name: heroName,
        stats: model.heroes[heroName].levelFortyStats[5]
      };
    }).map(stat => ({name: stat.name, x: stat.stats[X], y: stat.stats[Y]}));

    let stats = this.calculateDupeNumber(rawStats);

    let size = this.calculateSize(stats);

    let root = d3.select(this.hostRef.nativeElement).append('svg').attr('width', size.width).attr('height', size.height);

    let graph = root.append('g').attr('transform', 'translate(100, 0)');

    let xExtent = d3.extent(stats, stat => stat.x);
    let yExtent = d3.extent(stats, stat => stat.y);
    let xScale = d3.scaleLinear().domain([xExtent[0], xExtent[1] + 1]).range([0, size.width - 150]);
    let yScale = d3.scaleLinear().domain([yExtent[0], yExtent[1] + 1]).range([size.height - 100, 0]);
    let xUnit = xScale(1) - xScale(0);
    let yUnit = yScale(1) - yScale(0);
    
    let circles = graph.selectAll('image').data(stats);
    let circlesEnter = circles.enter();

    circlesEnter
      .append('image')
      .merge(circles)
      .attr('x', d => this.getXRoot(d, xScale))
      .attr('y', d => this.getYRoot(d, yScale) + 20)
      .attr('width', 20)
      .attr('height', 20)
      .attr('title', d => d.name)
      .attr('xlink:href', d => this.iconsService.getIcon(model.heroes[d.name].weaponType));
    
    circlesEnter
      .append('image')
      .merge(circles)
      .attr('x', d => this.getXRoot(d, xScale) + 20)
      .attr('y', d => this.getYRoot(d, yScale) + 20)
      .attr('width', 20)
      .attr('height', 20)
      .attr('xlink:href', d => this.iconsService.getIcon(model.heroes[d.name].movementType));

    circlesEnter
      .append('image')
      .merge(circles)
      .attr('x', d => this.getXRoot(d, xScale))
      .attr('y', d => this.getYRoot(d, yScale))
      .attr('width', 40)
      .attr('height', 20)
      .attr('preserveAspectRatio', 'xMinYMid slice')
      .attr('xlink:href', d => this.iconsService.getFace(d.name));

    let xRange = xExtent[1] - xExtent[0];
    let yRange = yExtent[1] - yExtent[0];
    let xValues = Array.from(Array(xRange + 2).keys()).map(x => x + xExtent[0]);
    let yValues = Array.from(Array(yRange + 2).keys()).map(y => y + yExtent[0]);
    
    let gridlines = graph.append('g')
      .attr('class', 'gridlines');

    gridlines
      .selectAll('line.xgrid')
      .data(xValues)
      .enter()
      .append('line')
      .attr('class', 'xgrid')
      .attr('x1', d => xScale(d - .5))
      .attr('y1', yScale(yExtent[0] - .5))
      .attr('x2', d => xScale(d - .5))
      .attr('y2', yScale(yExtent[1] + .5))
      .style('stroke', 'black')
      .style('opacity', 0.25);

    gridlines
      .selectAll('line.ygrid')
      .data(yValues)
      .enter()
      .append('line')
      .attr('class', 'ygrid')
      .attr('x1', xScale(xExtent[0] - .5))
      .attr('y1', d => yScale(d - .5))
      .attr('x2', xScale(xExtent[1] + .5))
      .attr('y2', d => yScale(d - .5))
      .style('stroke', 'black')
      .style('opacity', 0.25);

    root.append("g")
      .attr("transform", "translate(" + 100 + "," + (size.height - 60) + ")")
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('fill', '#000')
      .attr('transform', 'translate(' + (50 + ((size.width - 100) / 2)) + ', 40)')
      .text(X);

    root.append("g")
      .attr('transform', 'translate(60, 0)')
      .call(d3.axisLeft(yScale))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "translate(-60, " + (50 + ((size.height - 100) / 2)) + ") rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text(Y);
  }

}
