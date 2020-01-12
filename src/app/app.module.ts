import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ServiceWorkerModule } from '@angular/service-worker';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { environment } from '@env/environment';
import { CoreModule } from '@app/core';
import { SharedModule } from '@app/shared';
import { HomeModule } from './home/home.module';
import { ShellModule } from './shell/shell.module';
import { LoginModule } from './login/login.module';
import { SettingsModule } from './settings/settings.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AbpModule } from '@abp/abp.module';
import { AbpHttpInterceptor } from '@abp/abpHttpInterceptor';
import { AppConsts } from './AppConsts';
import { AppPreBootstrap } from 'src/AppPreBootstrap';
import { PlatformLocation } from '@angular/common';
import { AppSessionService } from './session/app-session.service';

import * as _ from 'lodash';
import { API_BASE_URL } from './shared/service-proxies/service-proxies';

export function appInitializerFactory(injector: Injector, platformLocation: PlatformLocation) {
  return () => {
    abp.ui.setBusy();
    return new Promise<boolean>((resolve, reject) => {
      AppConsts.appBaseHref = getBaseHref(platformLocation);
      const appBaseUrl = getDocumentOrigin() + AppConsts.appBaseHref;

      AppPreBootstrap.run(appBaseUrl, () => {
        abp.event.trigger('abp.dynamicScriptsInitialized');
        const appSessionService: AppSessionService = injector.get(AppSessionService);
        appSessionService.init().then(
          result => {
            abp.ui.clearBusy();

            // if (shouldLoadLocale()) {
            //   const angularLocale = convertAbpLocaleToAngularLocale(abp.localization.currentLanguage.name);
            //   import(`@angular/common/locales/${angularLocale}.js`).then(module => {
            //     registerLocaleData(module.default);
            //     resolve(result);
            //   }, reject);
            // } else {
            //   resolve(result);
            // }
          },
          err => {
            abp.ui.clearBusy();
            reject(err);
          }
        );
      });
    });
  };
}

export function convertAbpLocaleToAngularLocale(locale: string): string {
  if (!AppConsts.localeMappings) {
    return locale;
  }

  const localeMapings = _.filter(AppConsts.localeMappings, { from: locale });
  if (localeMapings && localeMapings.length) {
    // tslint:disable-next-line: no-string-literal
    return localeMapings[0]['to'];
  }

  return locale;
}

export function shouldLoadLocale(): boolean {
  return abp.localization.currentLanguage.name && abp.localization.currentLanguage.name !== 'en-US';
}

export function getRemoteServiceBaseUrl(): string {
  return AppConsts.remoteServiceBaseUrl;
}

export function getCurrentLanguage(): string {
  if (abp.localization.currentLanguage.name) {
    return abp.localization.currentLanguage.name;
  }

  // todo: Waiting for https://github.com/angular/angular/issues/31465 to be fixed.
  return 'en';
}

@NgModule({
  imports: [
    AbpModule,
    BrowserModule,
    ServiceWorkerModule.register('./ngsw-worker.js', { enabled: environment.production }),
    FormsModule,
    HttpClientModule,
    TranslateModule.forRoot(),
    IonicModule.forRoot(),
    CoreModule,
    SharedModule,
    ShellModule,
    HomeModule,
    SettingsModule,
    LoginModule,
    AppRoutingModule // must be imported as the last module as it contains the fallback route
  ],
  declarations: [AppComponent],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AbpHttpInterceptor, multi: true },
    { provide: API_BASE_URL, useFactory: getRemoteServiceBaseUrl },
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      deps: [Injector, PlatformLocation],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
export function getBaseHref(platformLocation: PlatformLocation): string {
  const baseUrl = platformLocation.getBaseHrefFromDOM();
  if (baseUrl) {
    return baseUrl;
  }

  return '/';
}

function getDocumentOrigin() {
  if (!document.location.origin) {
    const port = document.location.port ? ':' + document.location.port : '';
    return document.location.protocol + '//' + document.location.hostname + port;
  }

  return document.location.origin;
}
