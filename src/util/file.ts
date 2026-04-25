import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

export const ensureDir = async (targetPath: string) => {
  await mkdir(targetPath, { recursive: true });
};

export const readYamlFile = async <T>(targetPath: string): Promise<T> => {
  const raw = await readFile(targetPath, "utf8");
  return YAML.parse(raw) as T;
};

export const writeYamlFile = async (targetPath: string, value: unknown) => {
  await ensureDir(path.dirname(targetPath));
  await writeFile(targetPath, YAML.stringify(value), "utf8");
};

export const readJsonFile = async <T>(targetPath: string): Promise<T> => {
  const raw = await readFile(targetPath, "utf8");
  return JSON.parse(raw) as T;
};

export const writeJsonFile = async (targetPath: string, value: unknown) => {
  await ensureDir(path.dirname(targetPath));
  await writeFile(targetPath, JSON.stringify(value, null, 2), "utf8");
};
