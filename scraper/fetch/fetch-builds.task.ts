const scrapeIt = require("scrape-it");
import { Index, HeroBuild } from 'mehfeh-model';

import { Task, TaskEngineControl } from '../tasks';

interface Fetch {
    builds: HeroBuild[];
}

export class FetchBuildsTask implements Task<Index> {
    
    name: string;

    constructor(private heroName: string, private heroUrl: string) {
        this.name = 'Fetch hero builds: ' + heroName;
    }

    private parseSkillsList(val: string) {
        return val.split('/').map(value => value.trim());
    }

    fetchData(): Promise<Fetch> {
        return scrapeIt('https://feheroes.gamepedia.com' + this.heroUrl + '/Builds', {
            builds: {
                listItem: 'table.wikitable',
                data: {
                    name: 'tr:first-child td:first-child div',
                    weaponSkills: {
                        selector: 'tr:first-child td:nth-child(2) tr:first-child td:nth-of-type(1)',
                        convert: (val: string) => this.parseSkillsList(val)
                    },
                    supportSkills: {
                        selector: 'tr:first-child td:nth-child(2) tr:nth-child(2) td:nth-of-type(1)',
                        convert: (val: string) => this.parseSkillsList(val)
                    },
                    specialSkills: {
                        selector: 'tr:first-child td:nth-child(2) tr:nth-child(3) td:nth-of-type(1)',
                        convert: (val: string) => this.parseSkillsList(val)
                    },
                    aSkills: {
                        selector: 'tr:first-child td:nth-child(3) tr:nth-child(1) td:nth-of-type(1)',
                        convert: (val: string) => this.parseSkillsList(val)
                    },
                    bSkills: {
                        selector: 'tr:first-child td:nth-child(3) tr:nth-child(2) td:nth-of-type(1)',
                        convert: (val: string) => this.parseSkillsList(val)
                    },
                    cSkills: {
                        selector: 'tr:first-child td:nth-child(3) tr:nth-child(3) td:nth-of-type(1)',
                        convert: (val: string) => this.parseSkillsList(val)
                    },
                    sSkills: {
                        selector: 'tr:first-child td:nth-child(3) tr:nth-child(4) td:nth-of-type(1)',
                        convert: (val: string) => this.parseSkillsList(val)
                    },
                    tags: {
                        listItem: 'tr:first-child td:first-child td'
                    }
                }
            }
        });
    }

    run(model: Index, taskEngine: TaskEngineControl) {
        return this.fetchData().then(fetched => {
            fetched.builds.forEach(build => {
                build.tags = build.tags.filter(tag => typeof tag === 'string' || tag instanceof String)
            })
            model.heroBuilds[this.heroName] = fetched.builds;
        });
    }

}