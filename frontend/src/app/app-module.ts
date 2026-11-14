import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { LayoutsModule } from './layouts/layouts-module';

@NgModule({
  declarations: [App],
  imports: [BrowserModule, AppRoutingModule, LayoutsModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
  bootstrap: [App],
})
export class AppModule {}
