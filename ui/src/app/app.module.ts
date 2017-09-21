import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';

import { IconsService } from './icons.service';
import { ModelService } from './model.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpModule
  ],
  providers: [IconsService, ModelService],
  bootstrap: [AppComponent]
})
export class AppModule { }
