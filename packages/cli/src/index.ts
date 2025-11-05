#!/usr/bin/env node
import arg from "arg";
import prompts from "prompts";
import chalk from "chalk";
import { createProject } from "./create-project.js";
import { showHelp } from "./utils/help.js";

const argv = arg({
  "--help": Boolean,
  "-h": "--help",
});

async function init() {
  console.log(chalk.blue("\n🚀 Welcome to Vite MPA Generator\n"));

  if (argv["--help"]) {
    showHelp();
    return;
  }

  let targetDir = argv._[0] || "";

  if (!targetDir) {
    const result = await prompts({
      type: "text",
      name: "projectName",
      message: "Project name:",
      initial: "my-vite-mpa",
      validate: (value) => (value.trim() ? true : "Project name is required"),
    });

    if (!result.projectName) {
      console.log(chalk.red("✖ Project name is required"));
      process.exit(1);
    }

    targetDir = result.projectName;
  }

  try {
    await createProject(targetDir);
    console.log(chalk.green("\n✓ Project created successfully!\n"));
    console.log("Next steps:");
    console.log(chalk.cyan(`  cd ${targetDir}`));
    console.log(chalk.cyan(`  pnpm install`));
    console.log(chalk.cyan(`  pnpm dev\n`));
  } catch (error: any) {
    console.error(chalk.red(`✖ ${error.message}`));
    process.exit(1);
  }
}

init().catch((error) => {
  console.error(error);
  process.exit(1);
});
