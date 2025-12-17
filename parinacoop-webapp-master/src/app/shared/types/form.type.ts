import { FormGroup, ɵElement } from '@angular/forms';

export type FormGroupTypeBuilder<T extends {}> = FormGroup<{
  [K in keyof T]: ɵElement<T[K], null>;
}>;
