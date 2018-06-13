# update-project

[![Dependency Status](https://david-dm.org/plantain-00/update-project.svg)](https://david-dm.org/plantain-00/update-project)
[![devDependency Status](https://david-dm.org/plantain-00/update-project/dev-status.svg)](https://david-dm.org/plantain-00/update-project#info=devDependencies)
[![Build Status: Linux](https://travis-ci.org/plantain-00/update-project.svg?branch=master)](https://travis-ci.org/plantain-00/update-project)
[![Build Status: Windows](https://ci.appveyor.com/api/projects/status/github/plantain-00/update-project?branch=master&svg=true)](https://ci.appveyor.com/project/plantain-00/update-project/branch/master)
[![npm version](https://badge.fury.io/js/update-project.svg)](https://badge.fury.io/js/update-project)
[![Downloads](https://img.shields.io/npm/dm/update-project.svg)](https://www.npmjs.com/package/update-project)

A CLI tool to update dependencies for projects.

## features

+ check multiple js projects, check and update their dependencies, dev dependencies, peer dependencies, dependencies in lerna packages, remove `node_modules` and `yarn.lock` then `yarn install`
+ optional, just check which packages can be updated
+ optional, run `npm run build && npm run lint`, commit local changes then push

## install

`yarn global add update-project`

## usage

`update-project **`

## parameters

name | type | description
--- | --- | ---
--exclude | string | exclude a project, can be multiple
--lib | string | just update the package, can be multiple
--exclude-lib | string | do not update the package, can be multiple
--commit | boolean | after packages updated, run `npm run build && npm run lint`, commit local changes then push
--check | boolean | just check which packages can be updated
