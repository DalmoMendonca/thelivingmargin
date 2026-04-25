export const getFlag = (name: string) => {
  const target = `--${name}`;
  const index = process.argv.indexOf(target);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
};

export const hasFlag = (name: string) => process.argv.includes(`--${name}`);
