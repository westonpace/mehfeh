import * as lockFile from 'lockfile';
import * as fs from 'mz/fs';
const deepcopy = require('deepcopy');

import { Index } from 'mehfeh-model';

export class ModelDb {

    private model: Index;

    init() {
        return fs.exists('model.json.lock')
        .then(exists => {
            if(exists) {
                return fs.unlink('model.json.lock');
            }
        })
        .then(() => fs.exists('model.json'))
        .then(exists => {
            if(!exists) {
                return fs.writeFile('model.json', '{}');
            }
        })
        .then(() => fs.readFile('model.json'))
        .then(modelStr => {
            this.model = JSON.parse(modelStr.toString('utf8'));

            Object.keys(this.model.heroes).map(heroName =>
                ({heroName: heroName, hero: this.model.heroes[heroName]})
            ).filter(hero => hero.hero.weaponType === 'Blue Lance')
            .map(hero => 
                ({heroName: hero.heroName, defres: hero.hero.levelFortyStats[5].defense + hero.hero.levelFortyStats[5].resistance})
            ).sort((a, b) => Math.sign(a.defres - b.defres))
            .forEach(hero => {
                console.log(hero.heroName + ': ' + hero.defres);
            });
        });
    }

    save(newValue: Index) {
        this.model = newValue;
        return new Promise((resolve, reject) => {
            lockFile.lock('model.json.lock', (err) => {
                if (err) {
                    reject(err);
                }
                this.doSave(newValue, resolve, reject);
            });
        });
    }

    get value() {
        return deepcopy(this.model);
    }

    private doSave(newValue: Index, resolve: () => void, reject: (err: any) => void) {
        let jsonStr = JSON.stringify(newValue, null, 2);
        fs.writeFile('model.json', jsonStr).then(() => resolve()).catch(err => reject(err));
    }

}