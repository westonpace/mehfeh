var scrapeIt = require('scrape-it');
import * as fs from 'mz/fs';
import { Index } from 'mehfeh-model';

import { Task, TaskEngine, TaskEngineControl } from './tasks';

import { FetchAllTask } from './fetch/fetch-all.task';
import { FetchHeroTask } from './fetch/fetch-hero.task';
import { FetchBuildsTask } from './fetch/fetch-builds.task';

import { SkillCostBuilder, BuildEvaluator, BuildInvestmentIncorrectDetector } from './analysis';

interface Thing {
    values: number[];
}

// fs.readFile('model.json').then(fileData => {
//     return JSON.parse(fileData.toString('utf8'));
// }).then(model => {
//     return new TaskEngine(1000).go(new FetchAllTask(), model)
//     .then(() => {
//         return fs.writeFile('model.json', JSON.stringify(model, null, 2));
//     });
// }).catch(err => {
//     console.log(err);
// });

// let model: Index = {
//     heroBuilds: {},
//     heroes: {},
//     heroList: []
// }

// new FetchHeroTask('Lilina', '/Lilina').run(model, null as any).then(() => {
//     console.log(JSON.stringify(model.heroes['Lilina'], null, 2));
// }).catch(err => {
//     console.log(err);
// });

fs.readFile('model.json').then(fileData => {
    return JSON.parse(fileData.toString('utf8'));
}).then((model: Index) => {
    let problemDetector = new BuildInvestmentIncorrectDetector();
    let problems = problemDetector.analyze(model);
    let problemString = JSON.stringify(problems, null, 2);
    return fs.writeFile('errors.json', problemString);
}).catch(err => {
    console.log(err);
});