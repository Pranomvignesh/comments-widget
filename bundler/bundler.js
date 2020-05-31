(async () => {
    const fs    = require('fs');
    const path  = require('path');
    const gulp  = require('gulp');
    const consolidate   = require('gulp-concat');
    const stripDebug    = require('gulp-strip-debug');
    const uglify        = require('gulp-uglify');
    const less          = require('gulp-less');

// Task to concat all JS files, strip debugging and minify

    const root  = path.join(__dirname,'../');
    const distPath = path.join(root,'/dist');
    const lessPath = path.join(root,'/less');
    const scriptsPath = path.join(root,'/src');
    const bundled = {
        js  : 'comments-widget.js', // this has to take the values from the package.json
        css : 'comments-widget.css'
    }
    const deleteRecursive = (pathToDelete) => {
        const appendFolderPath = (relPath) => path.join(pathToDelete,relPath) 
        if(fs.existsSync(pathToDelete)){
            const stat = fs.lstatSync(pathToDelete);
            if(stat.isDirectory()){
                fs.readdir(pathToDelete,(error,dirContents) => {
                    if(error){ throw new Error(error) } 
                    dirContents.map(appendFolderPath).map(deleteRecursive)
                })
            }else if(stat.isFile()){
                fs.unlinkSync(pathToDelete);
            }
        }
    }
    const createFolderRecursive = (pathToCreate,foldersToCreate) => {
        foldersToCreate = foldersToCreate || [];
        const dir = path.dirname(pathToCreate);
        if(fs.existsSync(dir)){
            let len = foldersToCreate.length;
            while(len > 0){
                fs.mkdirSync(foldersToCreate[--len]);
            }
        }else{
            foldersToCreate.push(path.dirname(pathToCreate));
            createFolderRecursive(dir,foldersToCreate);
        }
        !fs.existsSync(pathToCreate) && fs.mkdirSync(pathToCreate)
    }
    const emptyAndCreateDist = (distPath) => {
        return new Promise((resolve,reject) => {
            try{
                deleteRecursive(distPath);
                createFolderRecursive(distPath);
                resolve();
            }catch(error){
                console.error(error);
                reject(error);
            }
        })
    }
    const copyStylesToDist = (lessPath,distPath) => {
        console.log(fs,path,less);
        debugger
    }
    const bundle = ({
        lessPath,
        distPath,
        scriptsPath,
        bundled
    }) => {
        return new Promise((resolve,reject) => {
            gulp.task('consolidateScripts', () => {
                gulp.src(path.join(scriptsPath,'*.js'))
                    .pipe(consolidate(bundled.js))
                    .pipe(stripDebug())
                    .pipe(uglify())
                    .pipe(gulp.dest(distPath));
            });
            gulp.task('convertLessToCss',()=>{
                gulp.src(path.join(lessPath,'*.less'))
                    .pipe(less())
                    .pipe(consolidate(bundled.css))
                    .pipe(gulp.dest(distPath));
            }),
            
            gulp.parallel([ 'consolidateScripts','convertLessToCss' ],function(){
                console.log('bundled');
            })()
        })
    }
    await emptyAndCreateDist(distPath);
    await bundle({
        lessPath : lessPath,
        distPath : distPath,
        scriptsPath : scriptsPath,
        bundled : bundled
    });
})()