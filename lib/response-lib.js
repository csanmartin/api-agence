module.exports = function (req, res, next) {
    res.data = data;
    res.success = success;
    res.sendError = sendError;
    next();

    /**
     * Retorna un JSON con formato
     *
     * @param success {boolean}
     * @param message {string}
     * @param data {any}
     */
    function data(success, message, data) {
        if (typeof success === 'undefined') {
            success = true;
        }

        if (typeof message === 'undefined') {
            message = null;
        }

        res.json({
            success: success,
            message: message,
            data: data
        });
    }

    /**
     * Retorna un JSON con estado exitoso
     *
     * @param message {string}
     * @param data {any}
     */
    function success(message, data) {
        if (typeof data === 'undefined') {
            data = null;
        }

        res.data(true, message, data);
    }

    /**
     * Retorna un JSON con estado fallido
     *
     * @param message {string}
     * @param data {any}
     */
    function sendError(message, data) {
        if (typeof data === 'undefined') {
            data = null;
        }

        res.data(false, message, data);
    }
};