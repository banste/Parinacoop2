import { validateRut } from '@fdograph/rut-utilities';
import { registerDecorator } from 'class-validator';

export const IsValidRun = () => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidRun ',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'El run dado no es válido',
      },
      validator: {
        validate: (value: string) => {
          return validateRut(value);
        },
      },
    });
  };
};
