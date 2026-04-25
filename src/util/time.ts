export const nowIso = () => new Date().toISOString();

export const todayStamp = () => {
  const value = new Date();
  const yyyy = value.getUTCFullYear();
  const mm = `${value.getUTCMonth() + 1}`.padStart(2, "0");
  const dd = `${value.getUTCDate()}`.padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
