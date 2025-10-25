export const decimalToNumber = (value) => {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "object" && typeof value.toNumber === "function") {
    return Number(value.toNumber());
  }

  return Number(value);
};
