const scrapeIt = require("scrape-it");
import { Index, HeroItem } from 'mehfeh-model';

import { Task, TaskEngineControl } from '../tasks';

interface Table {
    rows: {
        columns: string[];
    }[],
    wildHeaders: string[];
}

interface Fetch {
    tables: Table[]
}

export class FetchHeroTask implements Task<Index> {
    
    name: string;

    constructor(private heroName: string, private heroUrl: string) {
        this.name = 'Fetch hero: ' + heroName;
    }

    parseSkillNumber(val: string) {
        if(!val) {
            return 0;
        } else if (val === '-') {
            return 0;
        } else {
            let num = parseInt(val, 10);
            if(isNaN(num)) {
                return 0;
            }
            return num;
        }
    }

    parseAttacks(table: Table, hero: HeroItem) {
        let dataRows = table.wildHeaders.length > 0 ? table.rows : table.rows.slice(1);
        for(let row of dataRows) {
            hero.weaponSkills.push({
                name: row.columns[0],
                startsWith: this.parseSkillNumber(row.columns[5]),
                unlocked: this.parseSkillNumber(row.columns[6])
            });
        }
    }

    parseSpecials(table: Table, hero: HeroItem) {
        let dataRows = table.wildHeaders.length > 0 ? table.rows : table.rows.slice(1);
        for(let row of dataRows) {
            hero.specialSkills.push({
                name: row.columns[0],
                startsWith: this.parseSkillNumber(row.columns[4]),
                unlocked: this.parseSkillNumber(row.columns[5])
            });
        }
    }

    parseAssists(table: Table, hero: HeroItem) {
        let dataRows = table.wildHeaders.length > 0 ? table.rows : table.rows.slice(1);
        for(let row of dataRows) {
            hero.assistSkills.push({
                name: row.columns[0],
                startsWith: this.parseSkillNumber(row.columns[4]),
                unlocked: this.parseSkillNumber(row.columns[5])
            });
        }
    }

    parsePassives(table: Table, hero: HeroItem) {
        let dataRows = table.wildHeaders.length > 0 ? table.rows : table.rows.slice(1);
        for(let row of dataRows) {
            hero.passiveSkills.push({
                name: row.columns[0],
                unlocked: this.parseSkillNumber(row.columns[3]),
                startsWith: 0
            });
        }
    }

    parseStat(stat: string) {
        let values = stat.split('/');
        if(values.length !== 3) {
            return null;
        }
        return parseInt(values[1], 10);
    }

    parseStatsTable(table: Table, hero: HeroItem) {
        let dataRows = table.wildHeaders.length > 0 ? table.rows : table.rows.slice(1);
        for(let row of dataRows) {
            let rank = parseInt(row.columns[0], 10);
            if(isNaN(rank)) {
                continue;
            }
            let hp = this.parseStat(row.columns[1]);
            let atk = this.parseStat(row.columns[1]);
            let spd = this.parseStat(row.columns[1]);
            let def = this.parseStat(row.columns[1]);
            let res = this.parseStat(row.columns[1]);
            if(hp === null || atk === null || spd === null || def === null || res === null) {
                continue;
            }
            hero.levelFortyStats[rank] = {
                attack: atk,
                hp: hp,
                speed: spd,
                defense: def,
                resistance: res
            };
        }
    }

    parseTable(table: Table, hero: HeroItem) {
        let headers = (table.wildHeaders.length === 0) ? table.rows[0].columns : table.wildHeaders;
        if(headers.length > 1 && headers[1].toUpperCase() === 'MIGHT') {
            this.parseAttacks(table, hero);
        } else if (headers.length > 1 && headers[1].toUpperCase() === 'COOLDOWN') {
            this.parseSpecials(table, hero);
        } else if (headers.length > 1 && headers[1].toUpperCase() === 'RANGE') {
            this.parseAssists(table, hero);
        } else if (headers.length > 1 && headers[1].toUpperCase() === 'EFFECT') {
            this.parsePassives(table, hero);
        }
    }

    tablesToHeroItem(tables: Table[]): HeroItem {
        let result: HeroItem = {
            weaponSkills: [],
            assistSkills: [],
            specialSkills: [],
            passiveSkills: [],
            levelFortyStats: {}
        }

        this.parseStatsTable(tables[1], result);

        for(let table of tables.slice(2)) {
            this.parseTable(table, result);
        }

        return result;
    }

    fetchData(): Promise<Fetch> {
        return scrapeIt('https://feheroes.gamepedia.com' + this.heroUrl, {
            tables: {
                listItem: '.mw-content-ltr > table.wikitable',
                data: {
                    rows: {
                        listItem: 'tr',
                        data: {
                            columns: {
                                listItem: 'td, th'
                            }
                        }
                    },
                    wildHeaders: {
                        listItem: 'th'
                    }
                }
            }
        });
    }

    run(model: Index, taskEngine: TaskEngineControl) {
        return this.fetchData().then(fetched => {
            model.heroes[this.heroName] = this.tablesToHeroItem(fetched.tables);
        });
    }

}