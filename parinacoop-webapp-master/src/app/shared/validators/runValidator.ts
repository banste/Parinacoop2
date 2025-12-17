import { ValidatorFn, AbstractControl } from '@angular/forms';
import { validateRut } from '@fdograph/rut-utilities';

export const runValidator: ValidatorFn = (control: AbstractControl) => {
  const value = control.value;

  return validateRut(value) ? null : { runValidator: true };
};
