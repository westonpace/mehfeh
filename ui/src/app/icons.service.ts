import { Injectable } from '@angular/core';
import { Http, ResponseContentType } from '@angular/http';
import { BehaviorSubject, Observable } from 'rxjs';

import { HeroListItem } from 'mehfeh-model';

import { ModelService } from './model.service';

@Injectable()
export class IconsService {

    private _loaded = new BehaviorSubject<boolean>(false);
    get loaded(): Observable<boolean> {
        return this._loaded;
    }

    private iconFileMap = {
        'Green Axe': 'green-axe-20.png',
        'Blue Lance': 'blue-lance-20.png',
        'Red Sword': 'red-sword-20.png',
        'Red Tome': 'red-tome-20.png',
        'Blue Tome': 'blue-tome-20.png',
        'Green Tome': 'green-tome-20.png',
        'Red Breath': 'red-dragon-20.png',
        'Blue Breath': 'blue-dragon-20.png',
        'Green Breath': 'green-dragon-20.png',
        'Neutral Staff': 'staff-20.png',
        'Neutral Bow': 'archer-20.png',
        'Neutral Dagger': 'dagger-20.png',
        'Cavalry': 'cavalry-20.png',
        'Armored': 'armored-20.png',
        'Flying': 'flying-20.png',
        'Infantry': 'infantry-20.png'
    }

    private iconDataMap = {

    }

    private faceDataMap = {

    }

    constructor(private http: Http, private modelService: ModelService) {
        this.fetchIcons().flatMap(() => {
            console.log('Icons loaded');
            return modelService.model;
        }).flatMap((model) => {
            return this.fetchFaces(model.heroList);
        }).subscribe(() => {
            console.log('Faces loaded');
            this._loaded.next(true);
        });
    }

    getFace(name: string) {
        if(!this._loaded.value) {
            throw Error('Icons service must be loaded first');
        }
        return this.faceDataMap[name];
    }

    getIcon(name: string) {
        if(!this._loaded.value) {
            throw Error('Icons service must be loaded first');
        }
        if(!(name in this.iconDataMap)) {
            console.log('Could not find icon: ' + name);
        }
        return this.iconDataMap[name];
    }

    private fetchIcons() {
        let fetches = [];
        for(let key of Object.keys(this.iconFileMap)) {
            let file = 'assets/images/' + this.iconFileMap[key];
            fetches.push(this.http.get(file, { responseType: ResponseContentType.Blob }).do(rsp => {
                this.iconDataMap[key] = window.URL.createObjectURL(rsp.blob());
            }));
        }
        return Observable.forkJoin(fetches);
    }

    private getFaceName(heroName: string) {
        return heroName.replace(/ /g, '-').replace(/\(/g, '').replace(/\)/g,'');
    }

    private fetchFaces(heroList: HeroListItem[]) {
        let fetches = [];
        for(let hero of heroList) {
            let file = 'assets/images/faces/' + this.getFaceName(hero.name) + '.png';
            fetches.push(this.http.get(file, { responseType: ResponseContentType.Blob }).do(rsp => {
                this.faceDataMap[hero.name] = window.URL.createObjectURL(rsp.blob());
            }));
        }
        return Observable.forkJoin(fetches);
    }



}