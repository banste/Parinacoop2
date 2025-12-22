export class UpdateDapInstructionsHttpDto {
  bankName!: string;
  accountType!: string;
  accountNumber!: string;
  accountHolderName!: string;
  accountHolderRut!: string;
  email?: string | null;
  description!: string;
}

export type DapInstructionsHttpDto = {
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolderName: string;
  accountHolderRut: string;
  email?: string | null;
  description: string;
};
