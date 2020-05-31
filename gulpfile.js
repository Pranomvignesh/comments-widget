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
const getOptions = () => {
    const args = process.argv.slice(2);
    const options = {};
    const optionsKeyRegex = /--(.+)/;
    const optionsKeyValueRegex = /--(.+)=(.+)/;
    let lastKey;
    args.forEach((arg)=>{
        if(optionsKeyValueRegex.test(arg)){
            const tokens =optionsKeyValueRegex.exec(arg);
            const key = tokens[1];
            const value = tokens[2];
            options[key] = value;
        }else if(optionsKeyRegex.test(arg)){
            const key = optionsKeyRegex.exec(arg)[1];
            options[key] = true;
            lastKey = key;
        }else if(lastKey){
            if(!Array.isArray(options[lastKey])){
                options[lastKey] = [];
            }
            options[lastKey].push(arg);
        }
    })
    return options;
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
const options = getOptions();

// tasks
task('bundleCss',() => {
    return src(STYLES)
            .pipe(less())
            .pipe(autoprefixer())
            .pipe(consolidate(BUNDLED_CSS))
            .pipe(dest(DIST_PATH));
})

task('bundleJs',() => {
    return src(SCRIPTS)
            .pipe(consolidate(BUNDLED_JS))
            .pipe(stripDebug())
            .pipe(dest(DIST_PATH))
})

task('bundle',parallel(['bundleCss','bundleJs']))

task('watch',() => {
    STYLES.forEach((glob) => {
        watch(glob,series('bundleCss'))
    })
    SCRIPTS.forEach((glob) => {
        watch(glob,series('bundleJs'))
    })
})

task('minifyCss',() =>{
    return src(path.join(DIST_PATH,'*.css'))
            .pipe(cleanCss())
            .pipe(dest(DIST_PATH))
})
task('minifyJs',() =>{
    return src(path.join(DIST_PATH,'*.js'))
            .pipe(minify())
            .pipe(dest(DIST_PATH))
})

task('minify',parallel(['minifyJs','minifyCss']))

task('production',series(['bundle','minify']))

task('development',series(['bundle','watch']))

task('flush',() => {
    return del(DIST_PATH);
})

if(options.production){
    task('default',series(['flush','production']))
}else{
    task('default',series(['development']))
}
