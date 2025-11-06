import chalk from "chalk";

export function showHelp() {
  console.log(`
${chalk.blue("Usage:")}
  ${chalk.cyan("create-vite-mpa")} [project-name] [options]

${chalk.blue("Options:")}
  ${chalk.cyan("-h, --help")}     Show this help message

${chalk.blue("Examples:")}
  ${chalk.cyan("npx create-vite-mpa my-app")}
  ${chalk.cyan("npm create vite-mpa@latest my-app")}
  ${chalk.cyan("pnpm create vite-mpa my-app")}
`);
}
