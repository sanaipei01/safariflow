import { Confirmation } from 'primeng/api';

/** The pop-up shown before something is deleted. `onAccept` runs only if the user confirms. */
export function deleteConfirmation(
  header: string,
  message: string,
  onAccept: () => void,
): Confirmation {
  return {
    header,
    message,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptButtonProps: { severity: 'danger' },
    rejectButtonProps: { severity: 'secondary', outlined: true },
    accept: onAccept,
  };
}
