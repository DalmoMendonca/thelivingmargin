export const logStep = (message: string) => {
  console.log(`[machine] ${message}`);
};

export const logWarn = (message: string) => {
  console.warn(`[machine:warn] ${message}`);
};

export const logError = (message: string) => {
  console.error(`[machine:error] ${message}`);
};
