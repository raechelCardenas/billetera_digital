import { randomInt } from "crypto";

export const generateNumericToken = (length = 6) => {
  const max = 10 ** length;
  const value = randomInt(0, max);
  return value.toString().padStart(length, "0");
};
