export interface UpdateProfileDto {
  run: number;
  documentNumber: string; // ahora string (acepta letras y números)
  names: string;
  firstLastName: string;
  secondLastName: string;
  email: string;
  cellphone: string;
  street: string;
  number: number;
  detail: string;
  regionId: number;
  communeId: number;
}