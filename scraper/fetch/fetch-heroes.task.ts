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
                listItem: 'tr.hero-filter-element',
                data: {
                    imageUrl: {
                        selector: 'td:nth-child(1) a img',
                        attr: 'src'
                    },
                    url: {
                        selector: 'td:nth-child(2) a',
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