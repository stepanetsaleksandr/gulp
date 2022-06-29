let project_folder = "dist"; // папка для продакшена
let source_folder = "src";

let path = {
  // пути к папкам
  build: {
    // пути к папкам для продакшена
    html: project_folder + "/",
    css: project_folder + "/css/",
    js: project_folder + "/js/",
    img: project_folder + "/img/",
    fonts: project_folder + "/fonts/",
  },
  src: {
    // пути к папкам для разработки
    html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
    css: source_folder + "/scss/style.scss",
    js: source_folder + "/js/script.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
    fonts: source_folder + "/fonts/*.ttf",
  },
  watch: {
    // пути к папкам для отслеживания изменений
    html: source_folder + "/**/*.html",
    css: source_folder + "/scss/**/*.scss",
    js: source_folder + "/js/**/*.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
  },
  clean: "./" + project_folder + "/", // пути к папкам для очистки
};

let { src, dest } = require("gulp"), // подключаем библиотеку gulp
  gulp = require("gulp"), // подключаем библиотеку gulp
  browsersync = require("browser-sync").create(), // подключаем библиотеку browser-sync
  fileinclude = require("gulp-file-include"), // подключаем библиотеку gulp-file-include
  del = require("del"), // подключаем библиотеку del
  scss = require("gulp-sass")(require("sass")), // подключаем библиотеку gulp-sass
  autoPrefixer = require("gulp-autoprefixer"), // подключаем библиотеку gulp-autoprefixer
  groupMediaQueries = require("gulp-group-css-media-queries"), // подключаем библиотеку gulp-group-css-media-queries
  cleanCSS = require("gulp-clean-css"), // подключаем библиотеку gulp-clean-css
  rename = require("gulp-rename"), // подключаем библиотеку gulp-rename
  uglify = require("gulp-uglify-es").default,
  imagemin = require("gulp-imagemin"), // подключаем библиотеку gulp-imagemin
  webp = require("gulp-webp"), // подключаем библиотеку gulp-webp
  wephtml = require("gulp-webp-html"), // подключаем библиотеку gulp-webp-html
  webpcss = require("gulp-webp-css"); // подключаем библиотеку gulp-webp-css

function browserSync(params) {
  // Следим за изменениями в папке build
  browsersync.init({
    // инициализируем браузерсинк
    server: {
      baseDir: "./" + project_folder + "/", // путь к папке для запуска браузера
    },
    port: 3000, // порт для запуска браузера
    notify: false, // отключаем уведомления
  });
}

function html() {
  // Копирование html
  return src(path.src.html) //берем источник
    .pipe(fileinclude()) // подключаем все файлы из папки include
    .pipe(wephtml()) // преобразуем в webp
    .pipe(dest(path.build.html)) // положим в папку build
    .pipe(browsersync.stream()); // перезагрузим браузер
}

function js() {
  // Копирование js
  return src(path.src.js) //берем источник
    .pipe(fileinclude()) // подключаем все файлы из папки include
    .pipe(dest(path.build.js)) // положим в папку build
    .pipe(uglify()) // минимизируем весь js
    .pipe(rename({ extname: ".min.js" })) // переименовываем
    .pipe(dest(path.build.js)) // положим в папку build уже минимизированный файл
    .pipe(browsersync.stream()); // перезагрузим браузер
}

async function css() {
  // Компиляция scss в css
  return src(path.src.css) //берем источник
    .pipe(scss({ outputStyle: "expanded" }).on("error", scss.logError)) // компилируем

    .pipe(
      autoPrefixer({ overrideBrowserslist: ["last 5 versions"], cascade: true })
    ) // добавляем префиксы
    .pipe(groupMediaQueries()) // группируем медиа запросы
    .pipe(webpcss()) // преобразуем в webp
    .pipe(dest(path.build.css)) // положим в папку build перед сжатием
    .pipe(cleanCSS()) // минифицируем
    .pipe(rename({ extname: ".min.css" })) // переименовываем
    .pipe(dest(path.build.css)) // положим в папку build уже минимизированный файл
    .pipe(browsersync.stream()); // перезагрузим браузер
}

function images() {
  // Копирование картинок
  return src(path.src.img) //берем источник
    .pipe(
      webp({
        quality: 70,
        lossless: true,
        alpha: true,
        method: 6,
      })
    )
    .pipe(dest(path.build.img)) // положим в папку build
    .pipe(src(path.src.img)) //берем источник
    .pipe(
      imagemin({
        // оптимизируем картинки
        progressive: true, // объединяет прогрессивные картинки
        svgoPlugins: [{ removeViewBox: false }], // отключает все вьюбоксы
        interlaced: true, // объединяет прогрессивные картинки
        optimizationLevel: 3, // уровень оптимизации от 0 до 7 включительно
      })
    )
    .pipe(dest(path.build.img)) // положим в папку build
    .pipe(browsersync.stream()); // перезагрузим браузер
}

function watchFiles() {
  // Отслеживание изменений
  gulp.watch([path.watch.html], html); // Отслеживание html
  gulp.watch([path.watch.css], css); // Отслеживание css
  gulp.watch([path.watch.js], js); // Отслеживание js
  gulp.watch([path.watch.img], images); // Отслеживание картинок
}

function clean(params) {
  // Очистка папки build
  return del(path.clean); // Удаляем папку build
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images)); // Создаем серию для паковки проекта
let watch = gulp.parallel(build, watchFiles, browserSync); // Создаем параллельную задачу для запуска всего

exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
