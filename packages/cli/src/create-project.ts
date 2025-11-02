import fse from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import ora from "ora";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createProject(targetDir: string) {
  const cwd = process.cwd();
  const root = path.join(cwd, targetDir);

  if (await fse.pathExists(root)) {
    throw new Error(`Directory ${targetDir} already exists`);
  }

  console.log(`\nCreating project in ${chalk.green(root)}...\n`);

  const templateDir = path.resolve(__dirname, "../../template");

  if (!(await fse.pathExists(templateDir))) {
    throw new Error(`Template directory not found at ${templateDir}`);
  }

  const spinner = ora("Copying template files...").start();

  try {
    await fse.ensureDir(root);
    await copyDir(templateDir, root);
    spinner.succeed(chalk.green("Template files copied"));
  } catch (error) {
    spinner.fail(chalk.red("Failed to copy template files"));
    throw error;
  }
}

async function copyDir(srcDir: string, destDir: string) {
  await fse.ensureDir(destDir);

  const files = await fse.readdir(srcDir);

  for (const file of files) {
    if (file === "node_modules" || file === "dist" || file === ".DS_Store") {
      continue;
    }

    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);

    const stat = await fse.stat(srcFile);
    if (stat.isDirectory()) {
      await copyDir(srcFile, destFile);
    } else {
      await fse.copy(srcFile, destFile);
    }
  }
}
