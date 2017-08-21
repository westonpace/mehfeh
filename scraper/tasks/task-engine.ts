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
}

export class TaskEngine implements TaskEngineControl {

    private currentTasks: ScheduledTask<any>[] = [];

    constructor(private delayBetweenTasks: number) {

    }

    addTask<T>(task: Task<T>, model: T) {
        this.currentTasks.push({model: model, task: task});
    }

    go<T>(initialTask: Task<T>, initialModel: T) {
        this.addTask(initialTask, initialModel);
        return this.run();
    }

    private printStatus(task: Task<any>) {
        console.log('Currently running task: ' + task.name + ' and there are ' + this.currentTasks.length + ' other tasks in the queue');
    }

    private doNextTask(resolve: () => void, reject: (err: any) => void) {
        if(this.currentTasks.length === 0) {
            resolve();
            return;
        }
        let nextTask = this.currentTasks[0];
        this.currentTasks.splice(0, 1);
        this.printStatus(nextTask.task);
        try {
            nextTask.task.run(nextTask.model, this).then(res => {
                setTimeout(() => this.doNextTask(resolve, reject), this.delayBetweenTasks);
            })
            .catch(err => {
                reject(err);
            });
        } catch (err) {
            reject(err);
        }
    }

    private run() {
        return new Promise((resolve, reject) => {
            this.doNextTask(resolve, reject);
        });
    }

}