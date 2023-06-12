import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import {APOLLO_OPTIONS, ApolloModule} from "apollo-angular";
import {HttpLink} from "apollo-angular/http";
import {InMemoryCache} from "@apollo/client/core";
import {environment} from "../environments/environment";
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {RouteInterceptorService} from "./services/route-interceptor.service";
import {SharedModule} from "./shared/shared.module";
import { IonicStorageModule } from '@ionic/storage-angular';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    ApolloModule,
    HttpClientModule,
    SharedModule,
    IonicStorageModule.forRoot(),
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: APOLLO_OPTIONS,
      useFactory(httpLink: HttpLink) {
        return {
          cache: new InMemoryCache(),
          link: httpLink.create({
            uri: environment.graphQlEndpointUrl,
          }),
        };
      },
      deps: [HttpLink],
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RouteInterceptorService,
      multi: true
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
