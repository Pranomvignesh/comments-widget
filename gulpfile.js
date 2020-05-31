'use strict';
// imports
const path          = require('path');
const del           = require('del');
const {
    src,
    dest,
    parallel,
    series,
    task,
    watch
}                   = require('gulp');
const consolidate   = require('gulp-concat');
const stripDebug    = require('gulp-strip-debug');
const autoprefixer  = require('gulp-autoprefixer');
const cleanCss      = require('gulp-clean-css');
const minify        = require('gulp-minify');
const less          = require('gulp-less');

// global functions
const parseContents = (object) => {
    const packageJson = require("./package.json");
    const parse = (value) => {
        const dynamicContentRegex = /\{package\.(.+)\}/;
        if(dynamicContentRegex.test(value)){
            const keyToInclude = dynamicContentRegex.exec(value)[1];
            const keysArray = keyToInclude.split('.');
            let valueToReplace = value;
            let objectToCheck = packageJson;
            let length = keysArray.length,i = -1;
            while(i++ < length){
                const currKey = keysArray[i]
                if(objectToCheck.hasOwnProperty(currKey)){
                    valueToReplace = packageJson[currKey];
                    objectToCheck = packageJson[currKey];
                }else{
                    break;
                }
            }
            value = value.replace(dynamicContentRegex,valueToReplace);
        }
        return value;
    }
    for(let key in object){
        object[key] = parse(object[key]);
    }
    return object;
}


// global constants
const { 
    DIST_PATH, 
    LESS_PATH , 
    SCRIPTS_PATH,
    BUNDLED_CSS,
    BUNDLED_JS
} = parseContents(require('./bundler/config.json'));
const STYLES = [
    path.join(LESS_PATH,'**/*.less'),
    path.join(LESS_PATH,'**/*.css')
]
const SCRIPTS = [
    path.join(SCRIPTS_PATH,'**/*.js')
]

// tasks
task('bundleCss',() => {
    return src(STYLES)
               .pipe(less())
               .pipe(autoprefixer())
               .pipe(cleanCss())
               .pipe(consolidate(BUNDLED_CSS))
               .pipe(dest(DIST_PATH));
});

task('bundleJs',() => {
    return  src(SCRIPTS)
                .pipe(consolidate(BUNDLED_JS))
                .pipe(stripDebug())
                .pipe(minify())
                .pipe(dest(DIST_PATH))
});

task('bundle',parallel(['bundleCss','bundleJs']))

task('watch',() => {
    STYLES.forEach((glob) => {
        watch(glob,series('bundleCss'));
    })
    SCRIPTS.forEach((glob) => {
        watch(glob,series('bundleJs'));
    })
});

task('default',series(['bundle','watch']));
