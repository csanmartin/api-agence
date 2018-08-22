const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const db = require('./database');
const debug = require('debug')('api-agence:app');

// Se realiza la conexión a la base de datos MySQL con Sequelize
db.authenticate()
    .then(function() {
        debug('Conectado correctamente a la base de datos');
    })
    .catch(function (err) {
        debug('No se pudo conectar a la base de datos');
        debug(err);
        process.exit(1);
    });

const indexRouter = require('./routes/index');
// Ruta para las peticiones relacionadas con los consultores
const consultantsRouter = require('./routes/consultants');

const app = express();

// Se habilita CORS para admitir conexiones
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(require('./lib/response-lib'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// Se enlaza la ruta de consultores al app
app.use('/consultants', consultantsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
