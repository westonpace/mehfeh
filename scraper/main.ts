const scrapeIt = require('scrape-it');
const wget = require('node-wget-promise');
const rimrafPromise = require('rimraf-promise');
import * as fs from 'mz/fs';
import * as http from 'http';
import { Index, HeroListItem } from 'mehfeh-model';

import { Task, TaskEngine, TaskEngineControl } from './tasks';

import { FetchAllTask } from './fetch/fetch-all.task';
import { FetchHeroesTask } from './fetch';
import { FetchHeroTask } from './fetch/fetch-hero.task';
import { FetchBuildsTask } from './fetch/fetch-builds.task';

import { SkillCostBuilder, BuildEvaluator, BuildInvestmentIncorrectDetector } from './analysis';

// export class ChildClass implements Task<{}> {

//     constructor(public name: string) {

//     }

//     run(model: {}, control: TaskEngineControl) {
//         return new Promise((resolve, reject) => {
//             setTimeout(() => {
//                 if(this.name === 'a') {
//                     resolve();
//                 } else {
//                     reject('Foo');
//                 }
//             }, 4000);
//         }) as Promise<void>;
//     };

// }

// let masterTask: Task<{}> = {
//     name: 'Master',
//     run: (model: {}, control: TaskEngineControl) => {
//         control.addTask(new ChildClass('a'), model);
//         control.addTask(new ChildClass('b'), model);
//         return Promise.resolve();
//     }
// }

// let taskEngine = new TaskEngine(1000);
// taskEngine.start();
// taskEngine.runTask(masterTask, {})
// .then(() => {
//     console.log('DONE');
//     taskEngine.stop();
// })
// .catch((err: any) => console.log(err));

// fs.readFile('model.json').then(fileData => {
//     return JSON.parse(fileData.toString('utf8'));
// }).then(model => {
//     console.log('Starting tasks');
//     let taskEngine = new TaskEngine(1000);
//     taskEngine.start();
//     return taskEngine.runTask(new FetchAllTask(), model)
//     .then(() => {
//         console.log('Writing output');
//         taskEngine.stop();
//         return fs.writeFile('model.json', JSON.stringify(model, null, 2));
//     })
//     .catch((err: any) => {
//         return fs.writeFile('model.json', JSON.stringify(model, null, 2));
//     });

// }).catch(err => {
//     console.log(err);
// });

let model: Index = {
    heroBuilds: {},
    heroes: {},
    heroList: []
}

function getFaceName(heroName: string) {
    return heroName.replace(/ /g, '-').replace(/\(/g, '').replace(/\)/g,'');
}

function fetchHero(items: HeroListItem[], index: number) {
    if(index >= items.length) {
        return;
    }
    let hero = items[index];
    console.log('Fetching image for ' + hero.name);
    return wget(hero.imageUrl, {output: 'faces/' + getFaceName(hero.name) + '.png'}).then(() => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(fetchHero(items, index + 1));
            }, 1000);
        });
    });
}

new FetchHeroesTask().run(model, null as any).then(() => {
    return rimrafPromise('faces').then(() => fs.mkdir('faces').then(() => {
        fetchHero(model.heroList, 0);
    }));
}).catch(err => {
    console.log(err);
});

// fs.readFile('model.json').then(fileData => {
//     return JSON.parse(fileData.toString('utf8'));
// }).then((model: Index) => {
//     let problemDetector = new BuildInvestmentIncorrectDetector();
//     let problems = problemDetector.analyze(model);
//     let problemString = JSON.stringify(problems, null, 2);
//     return fs.writeFile('errors.json', problemString);
// }).catch(err => {
//     console.log(err);
// });