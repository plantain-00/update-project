import * as minimist from "minimist";
import * as glob from "glob";
import * as fs from "fs";
import * as childProcess from "child_process";
import * as rimraf from "rimraf";
import * as core from "./core";
import * as util from "util";

import * as packageJson from "../package.json";

let suppressError = false;

function printInConsole(message: any) {
    if (message instanceof Error) {
        message = message.message;
    }
    // tslint:disable-next-line:no-console
    console.log(message);
}

function showToolVersion() {
    printInConsole(`Version: ${packageJson.version}`);
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
    printInConsole(`${script}...`);
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

async function updateDependencies(getDependencies: (packageJsonContent: PackageJson) => { [name: string]: string }, parameter: string, project: string, getLibraries: (dependencyArray: string[]) => string[], check: boolean): Promise<Library[]> {
    const packageJsonPath = `./${project}/package.json`;
    const packageJsonContent: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
    const dependencyObject = getDependencies(packageJsonContent);
    if (dependencyObject) {
        const dependencyArray = Object.keys(dependencyObject);
        if (dependencyArray.length > 0) {
            const allLibraries = getLibraries(dependencyArray);
            const libraries: Library[] = [];
            for (const lib of allLibraries) {
                if (!latestVersions[lib]) {
                    latestVersions[lib] = (await execAsync(`npm view ${lib} dist-tags.latest --registry=https://registry.npm.taobao.org`)).trim();
                }
                const dependencyPackageJsonContent: PackageJson = JSON.parse(fs.readFileSync(`./${project}/node_modules/${lib}/package.json`).toString());
                if (latestVersions[lib] !== dependencyPackageJsonContent.version) {
                    libraries.push({
                        name: lib,
                        version: core.getUpdatedVersion(dependencyObject[lib], latestVersions[lib]),
                    });
                }
            }
            if (libraries.length > 0 && !check) {
                await execAsync(`cd ${project} && yarn add ${libraries.map(d => d.name + "@" + d.version).join(" ")} -E ${parameter}`);
            }
            return libraries;
        }
    }
    return [];
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
        printInConsole(`${i + 1} / ${projects.length} ${project}...`);
        try {
            function getLibraries(dependencyArray: string[]) {
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
            const dependencies = await updateDependencies(packageJsonContent => packageJsonContent.dependencies, "", project, getLibraries, argv.check);
            const devDependencies = await updateDependencies(packageJsonContent => packageJsonContent.devDependencies, "-D", project, getLibraries, argv.check);

            if (!argv.check) {
                await rimrafAsync(`./${project}/node_modules`);
                await rimrafAsync(`./${project}/yarn.lock`);
                await execAsync(`cd ${project} && yarn`);

                if (argv.commit && dependencies.length + devDependencies.length > 0) {
                    await execAsync(`cd ${project} && npm run build &&  npm run lint && git add -A && git commit -m "update dependencies" && git push`);
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
            }
        } catch (error) {
            printInConsole(error);
            if (error.code !== 0) {
                erroredProjects.push(project);
            }
        }
    }
    printInConsole(`Errored ${erroredProjects.length} Projects:`);
    printInConsole(erroredProjects);
    printInConsole(`Outdated ${allLibraries.length} Libraries:`);
    for (const library of allLibraries) {
        printInConsole(`${library.name}@${library.version}`);
    }
}

executeCommandLine().then(() => {
    printInConsole("update-project success.");
}, error => {
    printInConsole(error);
    if (!suppressError) {
        process.exit(1);
    }
});

type PackageJson = {
    dependencies: { [name: string]: string };
    devDependencies: { [name: string]: string };
    version: string;
};
