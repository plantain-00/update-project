import * as minimist from "minimist";
import * as glob from "glob";
import * as fs from "fs";
import * as childProcess from "child_process";
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
async function canUpdate(project: string, dependencyName: string) {
    if (!latestVersions[dependencyName]) {
        latestVersions[dependencyName] = (await execAsync(`npm view ${dependencyName} dist-tags.latest --registry=https://registry.npm.taobao.org`)).trim();
    }
    const packageJsonContent: PackageJson = JSON.parse(fs.readFileSync(`./${project}/node_modules/${dependencyName}/package.json`).toString());
    return latestVersions[dependencyName] !== packageJsonContent.version;
}

async function updateDependencies(getDependencies: (packageJsonContent: PackageJson) => { [name: string]: string }, parameter: string, project: string, getLibraries: (dependencyArray: string[]) => string[]) {
    const packageJsonPath = `./${project}/package.json`;
    const packageJsonContent: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
    const dependencyObject = getDependencies(packageJsonContent);
    if (dependencyObject) {
        const dependencyArray = Object.keys(dependencyObject);
        if (dependencyArray.length > 0) {
            const allLibraries = getLibraries(dependencyArray);
            const libraries: string[] = [];
            for (const lib of allLibraries) {
                if (await canUpdate(project, lib)) {
                    libraries.push(lib);
                }
            }
            if (libraries.length > 0) {
                await execAsync(`cd ${project} && yarn add ${libraries.map(d => d + "@" + latestVersions[d]).join(" ")} -E ${parameter}`);
            }
        }
    }
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
    for (const project of projects) {
        printInConsole(`${project}...`);
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
            await updateDependencies(packageJsonContent => packageJsonContent.dependencies, "", project, getLibraries);
            await updateDependencies(packageJsonContent => packageJsonContent.devDependencies, "-D", project, getLibraries);

            if (argv.commit) {
                await execAsync(`cd ${project} && npm run build &&  npm run lint && git add -A && git commit -m "update dependencies" && git push`);
            }
        } catch (error) {
            printInConsole(error);
            if (error.code !== 0) {
                erroredProjects.push(project);
            }
        }
    }
    printInConsole("Errored Projects:");
    printInConsole(erroredProjects);
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
