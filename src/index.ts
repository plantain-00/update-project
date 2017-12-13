import * as minimist from "minimist";
import * as glob from "glob";
import * as fs from "fs";
import * as childProcess from "child_process";
import * as rimraf from "rimraf";
import * as core from "./core";
import * as util from "util";
import chalk from "chalk";

import * as packageJson from "../package.json";

let suppressError = false;

function showToolVersion() {
    console.log(`Version: ${packageJson.version}`);
}

const rimrafAsync = util.promisify(rimraf);

function globAsync(pattern: string, ignore?: string | string[]) {
    return new Promise<string[]>((resolve, reject) => {
        glob(pattern, { ignore }, (error, matches) => {
            if (error) {
                reject(error);
            } else {
                resolve(matches);
            }
        });
    });
}

function execAsync(script: string) {
    console.log(`${script}...`);
    return new Promise<string>((resolve, reject) => {
        const subProcess = childProcess.exec(script, (error, stdout) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
        subProcess.stdout.pipe(process.stdout);
        subProcess.stderr.pipe(process.stderr);
    });
}

const latestVersions: { [name: string]: string } = {};
type Library = { name: string, version: string };

function getLibraries(dependencyArray: string[], argv: minimist.ParsedArgs) {
    if (argv.lib) {
        const libraries = Array.isArray(argv.lib) ? argv.lib : [argv.lib];
        return dependencyArray.filter(d => libraries.includes(d));
    } else if (argv["exclude-lib"]) {
        const excludedLibraries = Array.isArray(argv["exclude-lib"]) ? argv["exclude-lib"] : [argv["exclude-lib"]];
        return dependencyArray.filter(d => !excludedLibraries.includes(d));
    } else {
        return dependencyArray;
    }
}

async function updateDependencies(getDependencies: (packageJsonContent: PackageJson) => { [name: string]: string }, parameter: string, project: string, projectPath: string, argv: minimist.ParsedArgs): Promise<Library[]> {
    const packageJsonContent: PackageJson = JSON.parse(fs.readFileSync(`${projectPath}/package.json`).toString());
    const dependencyObject = getDependencies(packageJsonContent);
    const libraries: Library[] = [];
    if (dependencyObject) {
        const dependencyArray = Object.keys(dependencyObject);
        if (dependencyArray.length > 0) {
            const allLibraries = getLibraries(dependencyArray, argv);
            for (const lib of allLibraries) {
                if (lib === project) {
                    continue;
                }
                if (!latestVersions[lib]) {
                    latestVersions[lib] = (await execAsync(`npm view ${lib} dist-tags.latest --registry=https://registry.npm.taobao.org`)).trim();
                }
                const dependencyPackageJsonContent: PackageJson = JSON.parse(fs.readFileSync(`${projectPath}/node_modules/${lib}/package.json`).toString());
                if (latestVersions[lib] !== dependencyPackageJsonContent.version) {
                    libraries.push({
                        name: lib,
                        version: core.getUpdatedVersion(dependencyObject[lib], latestVersions[lib]),
                    });
                }
            }
            if (libraries.length > 0 && !argv.check) {
                await execAsync(`cd ${projectPath} && yarn add ${libraries.map(d => d.name + "@" + d.version).join(" ")} -E ${parameter}`);
            }
        }
    }
    return libraries;
}

async function updateChildDependencies(project: string, argv: minimist.ParsedArgs): Promise<Library[]> {
    const libraries: Library[] = [];
    if (fs.existsSync(`./${project}/packages/`)) {
        const files = fs.readdirSync(`./${project}/packages/`);
        for (const subProject of files) {
            const newPath = `./${project}/packages/${subProject}`;
            if (fs.statSync(newPath).isDirectory() && fs.statSync(`${newPath}/package.json`).isFile()) {
                const dependencies = await updateDependencies(p => p.dependencies, "", project, newPath, argv);
                libraries.push(...dependencies);

                const devDependencies = await updateDependencies(p => p.devDependencies, "-D", project, newPath, argv);
                libraries.push(...devDependencies);

                if (!argv.check) {
                    await rimrafAsync(`${newPath}/node_modules`);
                    await rimrafAsync(`${newPath}/yarn.lock`);
                }
            }
        }

        await execAsync(`cd ${project} && lerna bootstrap`);
    }
    return libraries;
}

async function executeCommandLine() {
    const argv = minimist(process.argv.slice(2), { "--": true });

    const showVersion = argv.v || argv.version;
    if (showVersion) {
        showToolVersion();
        return;
    }

    suppressError = argv.suppressError;

    if (!argv._ || argv._.length === 0) {
        throw new Error("Error: no input.");
    }

    const paths = await globAsync(argv._.length === 1 ? argv._[0] : `{${argv._.join(",")}}`, argv.exclude);
    const projects = paths.filter(p => fs.statSync(p).isDirectory());

    if (projects.length === 0) {
        throw new Error("Error: no input directories.");
    }

    const erroredProjects: string[] = [];
    const allLibraries: Library[] = [];
    for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        console.log(chalk.bold(`${i + 1} / ${projects.length} ${project}...`));
        try {
            const dependencies = await updateDependencies(p => p.dependencies, "", project, project, argv);
            const devDependencies = await updateDependencies(p => p.devDependencies, "-D", project, project, argv);
            const childDependencies = await updateChildDependencies(project, argv);

            if (!argv.check) {
                await rimrafAsync(`./${project}/node_modules`);
                await rimrafAsync(`./${project}/yarn.lock`);
                await execAsync(`cd ${project} && yarn`);

                if (argv.commit && dependencies.length + devDependencies.length + childDependencies.length > 0) {
                    await execAsync(`cd ${project} && npm run build &&  npm run lint && git add -A && git commit -m "feat: update dependencies" && git push`);
                }
            } else {
                for (const dependency of dependencies) {
                    if (allLibraries.every(a => a.name !== dependency.name)) {
                        allLibraries.push(dependency);
                    }
                }
                for (const dependency of devDependencies) {
                    if (allLibraries.every(a => a.name !== dependency.name)) {
                        allLibraries.push(dependency);
                    }
                }
                for (const dependency of childDependencies) {
                    if (allLibraries.every(a => a.name !== dependency.name)) {
                        allLibraries.push(dependency);
                    }
                }
            }
        } catch (error) {
            console.log(error);
            if (error.code !== 0) {
                erroredProjects.push(project);
            }
        }
    }
    console.log(chalk.bold(`Errored ${erroredProjects.length} Projects:`));
    for (const project of erroredProjects) {
        console.log(chalk.red(project));
    }
    console.log(chalk.bold(`Outdated ${allLibraries.length} Libraries:`));
    for (const library of allLibraries) {
        console.log(`${library.name}@${library.version}`);
    }
}

executeCommandLine().then(() => {
    console.log(chalk.green("update-project success."));
}, error => {
    if (error instanceof Error) {
        console.log(error.message);
    } else {
        console.log(error);
    }
    if (!suppressError) {
        process.exit(1);
    }
});

type PackageJson = {
    dependencies: { [name: string]: string };
    devDependencies: { [name: string]: string };
    version: string;
};
