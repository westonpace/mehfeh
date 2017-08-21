const scrapeIt = require("scrape-it");
import { Index, HeroListItem } from 'mehfeh-model';

import { Task, TaskEngineControl } from '../tasks';

interface Fetch {
    data: HeroListItem[];
}

export class FetchHeroesTask implements Task<Index> {
    
    name = 'Fetch heroes from index';

    fetchData(): Promise<Fetch> {
        return scrapeIt('https://feheroes.gamepedia.com/Hero_List', {
            data: {
                listItem: 'tr.hero-filter-element td:nth-child(2)',
                data: {
                    url: {
                        selector: 'a',
                        attr: 'href'
                    },
                    name: 'a'
                }
            }
        });
    }

    run(model: Index, taskEngine: TaskEngineControl) {
        return this.fetchData().then(fetched => {
            model.heroList = fetched.data;
        });
    }

}