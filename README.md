# update-project

[![Dependency Status](https://david-dm.org/plantain-00/update-project.svg)](https://david-dm.org/plantain-00/update-project)
[![devDependency Status](https://david-dm.org/plantain-00/update-project/dev-status.svg)](https://david-dm.org/plantain-00/update-project#info=devDependencies)
[![Build Status: Linux](https://travis-ci.org/plantain-00/update-project.svg?branch=master)](https://travis-ci.org/plantain-00/update-project)
[![Build Status: Windows](https://ci.appveyor.com/api/projects/status/github/plantain-00/update-project?
branch=master&svg=true)](https://ci.appveyor.com/project/plantain-00/update-project/branch/master)
[![npm version](https://badge.fury.io/js/update-project.svg)](https://badge.fury.io/js/update-project)
[![Downloads](https://img.shields.io/npm/dm/update-project.svg)](https://www.npmjs.com/package/update-project)

A CLI tool to update dependencies for projects.

## install

`yarn global add update-project`

## usage

`update-project ** --exclude "test" --lib "no-unused-export" --exclude-lib "uglify-js" --commit`

`update-project ** --exclude "test" --lib "no-unused-export" --exclude-lib "uglify-js" --check`
