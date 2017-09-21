import { ModelDb } from './db';
import { Task, TaskEngine, TaskEngineControl, FetchAllTask, FetchHeroesTask, FetchHeroTask, FetchBuildsTask } from 'mehfeh-scraper';

export class ScraperService {

    private taskEngine: TaskEngine = new TaskEngine(1000);

    constructor(private modelDb: ModelDb) {
        this.taskEngine.start();
    }

    fetchAll() {
        let model = this.modelDb.value;
        return this.taskEngine.runTask(new FetchAllTask(), model)
        .then(() => {
          this.modelDb.save(model);
        });
    }

}