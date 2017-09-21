import { Injectable } from '@angular/core';
import { Http, ResponseContentType } from '@angular/http';
import { ReplaySubject, Observable } from 'rxjs';

import { Index } from 'mehfeh-model';

@Injectable()
export class ModelService {

    private _model = new ReplaySubject<Index>(1);
    get model(): Observable<Index> {
        return this._model;
    }

    constructor(private http: Http) {
        this.fetchModel();
    }

    private fetchModel() {
        this.http.get('api/model').subscribe(rsp => {
            this._model.next(rsp.json() as Index);
        });
    }



}