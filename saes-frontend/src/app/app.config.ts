import { DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { authInterceptor } from './core/auth.interceptor';
import { routes } from './app.routes';

// Dates et nombres au format francais (ex. 4 000 FCFA, 04/11/2026).
registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideRouter(routes, withComponentInputBinding()),
    // Dates et nombres a la francaise : « 20 000 », « 03/11/2026 ».
    { provide: LOCALE_ID, useValue: 'fr' },
    // Format du pipe date sans argument : « 03/11/2026 à 13 h 53 ».
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { dateFormat: "dd/MM/y 'à' H 'h' mm" } },
  ],
};
