import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { environment } from '../../../environments/environment';

/** The Aura theme with teal as the main colour. */
const SafariFlowPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{teal.50}',
      100: '{teal.100}',
      200: '{teal.200}',
      300: '{teal.300}',
      400: '{teal.400}',
      500: '{teal.500}',
      600: '{teal.600}',
      700: '{teal.700}',
      800: '{teal.800}',
      900: '{teal.900}',
      950: '{teal.950}',
    },
  },
});

export const primeNgProviders = [
  providePrimeNG({
    license: environment.primeLicense,
    theme: {
      preset: SafariFlowPreset,
      // dark mode is switched off: the class below is never added to the page
      options: { darkModeSelector: '.app-dark' },
    },
  }),
  // the delete pop-ups on the admin screens use this service
  ConfirmationService,
  // the "registration submitted" notice on the driver page uses this service
  MessageService,
];
