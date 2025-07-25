// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  graphQlEndpointUrl: 'https://vipn-guest.local.busites.com/api/guests/graph',
  // graphQlEndpointUrl: 'https://vipnation.7.dev.bubbleup.com/api/guests/graph',
  // graphQlEndpointUrl: 'https://vipnation.local.busites.com/api/guests/graph',
  // graphQlEndpointUrl: 'https://vipnation.7.prod.bubbleup.com/api/guests/graph',
  salesForceUrl: 'https://www.pages08.net/host_2/VIP_Nation/PreferenceCenter/',
  siteName: 'vipnation.com',
  storageName: 'vipnDataStore',
  updatePeriod: 30
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
