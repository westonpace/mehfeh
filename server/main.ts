import * as express from 'express';
const morgan = require('morgan')

import { ModelDb } from './db';
import { ScraperService } from './scraper.service';

let modelDb = new ModelDb();
let scraperService = new ScraperService(modelDb);

modelDb.init().then(() => {
    const app = express();
    
    app.use(morgan('combined'));

    app.get('/api/model', (req, res) => {
        res.json(modelDb.value);
    });

    app.delete('/api/model', (req, res, next) => {
        scraperService.fetchAll().then(() => {
            res.json(modelDb.value);
        }).catch(next);
    });
    
    app.listen(3000, () => {
      console.log('Example app listening on port 3000!')
    });
})
.catch(err => {
    console.log('Error on initialization: ' + err);
});
