import { Injectable } from "@angular/core";
import { ActivatedRoute, NavigationExtras, Router } from "@angular/router";
import { HttpEvent, HttpHandler, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { GraphqlService } from "./graphql.service";

@Injectable({
  providedIn: "root"
})
export class RouteInterceptorService {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private graphQlService: GraphqlService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (request.url === environment.graphQlEndpointUrl) {
      if (environment.siteName !== null) {
        request = request.clone({
          setHeaders: {
            SiteName: environment.siteName,
            // site: "4"
          }
        });
      }

      if (this.graphQlService.userAuthToken !== null) {
        const isTokenQuery = (request.body['operationName'] && request.body['operationName']=='getUserTokenByToken');
        if (!isTokenQuery) {
          request = request.clone({
            setHeaders: {
              Authorization: "Bearer " + this.graphQlService.userAuthToken
            }
          });
        }
      }
    }

    return next.handle(request);
  }
}
