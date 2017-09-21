import * as debugFactory from 'debug';

const debug = debugFactory('task-engine');

export interface Task<M> {
    name: string;
    run: (model: M, taskEngine: TaskEngineControl) => Promise<void>;
}

export interface TaskEngineControl {
    addTask<T>(task: Task<T>, model: T): void;
}

interface ScheduledTask<M> {
    model: M;
    task: Task<M>;
    monitor: TaskMonitor;
}

export class TaskMonitor implements TaskEngineControl {

    private tasksInFlight = 0;

    constructor(private resolve: () => void, private reject: (err: any) => void, private taskEngine: TaskEngine) {

    }

    addTask<T>(task: Task<T>, model: T): void {
        this.tasksInFlight++;
        console.log('add tif=' + this.tasksInFlight);
        let wrapper = {
            name: task.name,          
            run: (model: T) => {
                return task.run(model, this).then(() => {
                    this.decrementRunningTasks();
                })
                .catch(err => {
                    this.decrementRunningTasks();
                    console.log('Error running task: ' + err);
                });
            }
        };
        this.taskEngine.addTask(wrapper, model, this);
    }

    decrementRunningTasks() {
        this.tasksInFlight--;
        console.log('fin tif=' + this.tasksInFlight);
        if(this.tasksInFlight === 0) {
            this.resolve();
        }
    }

    reportError(err: any) {
        this.reject(err);
    }

}

export class TaskEngine {

    private running: boolean = false;
    private currentTasks: ScheduledTask<any>[] = [];

    constructor(private delayBetweenTasks: number) {

    }

    start() {
        if(!this.running) {
            this.running = true;
            this.go();
        }
    }

    stop() {
        this.running = false;
    }

    private go() {
        if(this.running) {
            setTimeout(() => {
                this.doNextTask().then(() => {
                    this.go();  
                })
                .catch((err: any) => {
                    debug('Error running tasks: ' + err);
                });
            }, this.delayBetweenTasks);
        }
    }

    addTask<T>(task: Task<T>, model: T, monitor: TaskMonitor) {
        this.currentTasks.push({model: model, task: task, monitor: monitor});
    }

    runTask<T>(initialTask: Task<T>, initialModel: T) {
        return new Promise((resolve, reject) => {
            let taskMonitor = new TaskMonitor(resolve, reject, this);
            taskMonitor.addTask(initialTask, initialModel);
        });
    }

    private printStatus(task: Task<any>) {
        debug('Currently running task: ' + task.name + ' and there are ' + this.currentTasks.length + ' other tasks in the queue');
    }

    private executeTask(task: Task<any>, model: any, monitor: TaskEngineControl, attempt: number) {
        return new Promise((resolve, reject) => {
            if(attempt == 10) {
                reject('Too many attempts');
            }
            try {
                task.run(model, monitor).then(() => {
                    resolve();
                }).catch(err => {
                    console.log('Task error<' + task.name + '>: ' + err);
                    resolve(this.executeTask(task, model, monitor, attempt + 1));
                });
            } catch (err) {
                console.log('Task threw<' + task.name + '>: ' + err);
                resolve(this.executeTask(task, model, monitor, attempt + 1));
            }
        });
    }

    private doNextTask(): Promise<any> {
        if(this.currentTasks.length === 0) {
            return Promise.resolve();
        }
        let nextTask = this.currentTasks[0];
        this.currentTasks.splice(0, 1);
        this.printStatus(nextTask.task);
        return this.executeTask(nextTask.task, nextTask.model, nextTask.monitor, 0);
    }

}