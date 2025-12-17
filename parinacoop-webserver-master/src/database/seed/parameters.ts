export const parameters: {
  minimum_days: number;
  maximum_days: number;
  interest_rate_base: number;
}[] = [
  {
    minimum_days: 30,
    maximum_days: 90,
    interest_rate_base: 0.4,
  },
  {
    minimum_days: 91,
    maximum_days: 180,
    interest_rate_base: 0.39,
  },
  {
    minimum_days: 181,
    maximum_days: 365,
    interest_rate_base: 0.39,
  },
  {
    minimum_days: 365,
    maximum_days: 9999,
    interest_rate_base: 5,
  },
];
