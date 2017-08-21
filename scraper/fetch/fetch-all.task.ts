const scrapeIt = require("scrape-it");
import { Index } from 'mehfeh-model';

import { Task, TaskEngineControl } from '../tasks';
import { FetchHeroesTask } from './fetch-heroes.task';
import { FetchHeroTask } from './fetch-hero.task';
import { FetchBuildsTask } from './fetch-builds.task';

export class FetchAllTask implements Task<Index> {
    
    name = 'Fetch all data';

    run(model: Index, taskEngine: TaskEngineControl) {
        taskEngine.addTask(new FetchHeroesTask(), model);
        taskEngine.addTask(new SpawnHeroTasks(), model);
        return Promise.resolve();
    }

}

class SpawnHeroTasks implements Task<Index> {

    name = 'Spawn hero fetch tasks';

    run(model: Index, taskEngine: TaskEngineControl) {
        model.heroes = {};
        model.heroBuilds = {};
        for(let hero of model.heroList) {
            taskEngine.addTask(new FetchHeroTask(hero.name, hero.url), model);
            taskEngine.addTask(new FetchBuildsTask(hero.name, hero.url), model);
        }
        return Promise.resolve();
    }

}