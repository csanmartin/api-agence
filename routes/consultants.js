const express = require('express');
const router = express.Router();
const sequelize = require('../database');

router.get('/', function (req, res, next) {
    // Consulta a la BD con INNER JOIN de tablas cao_usuario y permissao_sistema
    sequelize.query('SELECT cao_usuario.co_usuario AS \'userCode\', cao_usuario.no_usuario AS \'userName\' \n' +
        'FROM cao_usuario \n' +
        'INNER JOIN permissao_sistema ON cao_usuario.co_usuario = permissao_sistema.co_usuario \n' +
        'WHERE permissao_sistema.co_sistema = 1 \n' +
        'AND permissao_sistema.in_ativo = \'S\' \n' +
        'AND permissao_sistema.co_tipo_usuario IN (0, 1, 2)',
        {
            type: sequelize.QueryTypes.SELECT
        }
    ).then(consultants => {
        res.success('Información de consultores obtenida con éxito', consultants);
    }).catch(() => {
        res.sendError('No se ha podido obtener la información de los consultores');
    });
});

router.post('/getDataForReport/:minDate/:maxDate/', function (req, res, next) {
    if (!req.params.minDate || !req.params.maxDate || !req.body.consultants) {
        res.sendError('Faltan datos para completar la petición');
    }
    const minDate = req.params.minDate;
    const maxDate = req.params.maxDate;
    const consultants = req.body.consultants;
    // Consulta a la BD con INNER JOIN de tablas cao_fatura, cao_salario y cao_usuario
    sequelize.query('SELECT \n' +
        'cao_usuario.co_usuario AS \'userCode\',\n' +
        'cao_usuario.no_usuario AS \'userName\',\n' +
        'MONTH(cao_fatura.data_emissao) AS \'month\', \n' +
        'YEAR(cao_fatura.data_emissao) AS \'year\', \n' +
        'SUM(cao_fatura.valor - (cao_fatura.valor * (cao_fatura.total_imp_inc / 100))) AS \'gain\', \n' +
        'cao_salario.brut_salario AS \'fixedCost\', \n' +
        'SUM((cao_fatura.valor - (cao_fatura.valor * (cao_fatura.total_imp_inc / 100))) * (cao_fatura.comissao_cn / 100)) AS \'commission\' \n' +
        'FROM cao_fatura \n' +
        'INNER JOIN cao_os ON cao_fatura.co_os = cao_os.co_os \n' +
        'INNER JOIN cao_salario ON cao_os.co_usuario = cao_salario.co_usuario \n' +
        'INNER JOIN cao_usuario ON cao_os.co_usuario = cao_usuario.co_usuario\n' +
        'WHERE cao_os.co_usuario IN (:consultants) AND cao_fatura.data_emissao BETWEEN :minDate AND :maxDate \n' +
        'GROUP BY MONTH(cao_fatura.data_emissao), YEAR(cao_fatura.data_emissao), cao_usuario.co_usuario \n' +
        'ORDER BY YEAR(cao_fatura.data_emissao), MONTH(cao_fatura.data_emissao), cao_usuario.co_usuario;',
        {
            replacements: {consultants: consultants, minDate: minDate, maxDate: maxDate},
            type: sequelize.QueryTypes.SELECT
        }
    ).then(commercialData => {
        // Estructura del resultado
        let result = [];
        consultants.forEach((consultant) => {
            // Se filtran los datos devueltos por la base de datos por consultor
            const commercialDataUser = commercialData.filter(
                commercialDataUser => commercialDataUser.userCode === consultant
            );
            if (commercialDataUser.length > 0) {
                result.push({
                    userCode: consultant,
                    userName: commercialDataUser[0].userName,
                    commercialData: dataFormatForReport(commercialDataUser) // Se llama a la función que configura los datos comerciales.
                });
            }
        });
        res.success('Información comercial de consultores obtenida con éxito', result);
    }).catch(() => {
        res.sendError('No se ha podido obtener la información comercial de los consultores');
    })
});

router.post('/getDataForBarChart/:minDate/:maxDate/', function (req, res, next) {
    if (!req.params.minDate || !req.params.maxDate || !req.body.consultants) {
        res.sendError('Faltan datos para completar la petición');
    }
    const minDate = req.params.minDate;
    const maxDate = req.params.maxDate;
    const consultants = req.body.consultants;
    sequelize.query('SELECT \n' +
        'cao_usuario.co_usuario AS \'userCode\',\n' +
        'cao_usuario.no_usuario AS \'userName\',\n' +
        'MONTH(cao_fatura.data_emissao) AS \'month\',\n' +
        'YEAR(cao_fatura.data_emissao) AS \'year\',\n' +
        'SUM(cao_fatura.valor - (cao_fatura.valor * (cao_fatura.total_imp_inc / 100))) AS \'gain\' , \n' +
        'cao_salario.brut_salario AS \'fixedCost\'\n' +
        'FROM cao_fatura \n' +
        'INNER JOIN cao_os ON cao_fatura.co_os = cao_os.co_os \n' +
        'INNER JOIN cao_salario ON cao_os.co_usuario = cao_salario.co_usuario \n' +
        'INNER JOIN cao_usuario ON cao_os.co_usuario = cao_usuario.co_usuario \n' +
        'WHERE cao_os.co_usuario IN (:consultants) AND cao_fatura.data_emissao BETWEEN :minDate AND :maxDate \n' +
        'GROUP BY MONTH(cao_fatura.data_emissao), YEAR(cao_fatura.data_emissao), cao_usuario.co_usuario \n' +
        'ORDER BY YEAR(cao_fatura.data_emissao), MONTH(cao_fatura.data_emissao), cao_usuario.co_usuario;',
        {
            replacements: {consultants: consultants, minDate: minDate, maxDate: maxDate},
            type: sequelize.QueryTypes.SELECT
        }
    ).then(result => {
        let response = dataFormatForBarChart(result, consultants);
        res.success('Información obtenida con éxito', response);
    }).catch(() => {
        res.sendError('No se ha podido obtener la información comercial de los consultores');
    });
});

router.post('/getDataForPieChart/:minDate/:maxDate/', function (req, res, next) {
    if (!req.params.minDate || !req.params.maxDate || !req.body.consultants) {
        res.sendError('Faltan datos para completar la petición');
    }
    const minDate = req.params.minDate;
    const maxDate = req.params.maxDate;
    const consultants = req.body.consultants;
    // Se realiza la consulta para obtener el total de ganancias obtenidas por consultor durante un periodo de tiempo
    sequelize.query('SELECT \n' +
        'cao_usuario.co_usuario AS \'userCode\',\n' +
        'cao_usuario.no_usuario AS \'userName\',\n' +
        'SUM(cao_fatura.valor - (cao_fatura.valor * (cao_fatura.total_imp_inc / 100))) AS \'gain\'\n' +
        'FROM cao_fatura \n' +
        'INNER JOIN cao_os ON cao_fatura.co_os = cao_os.co_os \n' +
        'INNER JOIN cao_usuario ON cao_os.co_usuario = cao_usuario.co_usuario \n' +
        'WHERE cao_os.co_usuario IN (:consultants) AND cao_fatura.data_emissao BETWEEN :minDate AND :maxDate \n' +
        'GROUP BY cao_usuario.co_usuario \n' +
        'ORDER BY cao_usuario.co_usuario;',
        {
            replacements: {consultants: consultants, minDate: minDate, maxDate: maxDate},
            type: sequelize.QueryTypes.SELECT
        }
    ).then(result => {
        // Se inicializa el objeto principal que contendra los consultores y el total de ganacia obtenido durante el periodo consultado
        let response = {
            totalGains: 0,
            consultants: []
        };
        result.forEach(consultant => {
            response.consultants.push({ // Se agregan los datos del consultor necesarios para construir el gráfico de torta
                userName: consultant.userName,
                gain: consultant.gain
            });
            response.totalGains = response.totalGains + consultant.gain; // Se suma la ganancia obtenida por el usuario a la ganancia total
        });
        res.success('Información obtenida con éxito', response);
    }).catch(() => {
        res.sendError('No se ha podido obtener la información comercial de los consultores');
    });
});

// Se realiza una configuración de formato a los datos comerciales para la respuesta JSON ordenada.
// NOTA: Este formato solo aplica realizando la consulta en el orden correspondiente a Por Año y Mes
function dataFormatForReport(data) {
    // Se inicializan los valores totales
    let result = {
        totalGains: 0,
        totalFixedCosts: 0,
        totalCommissions: 0,
        totalProfits: 0,
        years: []
    };
    let resultData = [];
    let currentYear = 0;
    data.forEach((commercialData) => {
        // Si es un nuevo año, añade un nuevo elemento
        if (currentYear !== commercialData.year) {
            resultData.push({
                year: commercialData.year,
                data: [
                    {
                        month: commercialData.month,
                        gain: commercialData.gain,
                        fixedCost: commercialData.fixedCost,
                        commission: commercialData.commission,
                        profit: commercialData.gain - (commercialData.fixedCost + commercialData.commission)
                    }
                ]
            });
            currentYear = commercialData.year // Actualiza el validador de año
        } else { // Si el año es el mismo que el del elemento anterior, agrega los datos comerciales al mismo elemento
            resultData[resultData.length - 1].data.push({
                month: commercialData.month,
                gain: commercialData.gain,
                fixedCost: commercialData.fixedCost,
                commission: commercialData.commission,
                profit: commercialData.gain - (commercialData.fixedCost + commercialData.commission)
            });
        }
        // Aumenta el total de los valores obtenidos
        result.totalGains = result.totalGains + commercialData.gain;
        result.totalFixedCosts = result.totalFixedCosts + commercialData.fixedCost;
        result.totalCommissions = result.totalCommissions + commercialData.commission;
        result.totalProfits = result.totalProfits + (commercialData.gain - (commercialData.fixedCost + commercialData.commission))
    });
    // Se agrega el resultado comercial correspondiente a cada año
    result.years = resultData;
    return result;
}

function dataFormatForBarChart(data, arrayConsultants) {
    let currentYear = 0;
    let currentMonth = 0;
    let response = {
        periods: [],
        meanFixedCost: 0,
        consultants: []
    };
    let totalFixedCost = 0;
    arrayConsultants.forEach(result => { // Se observa si existen resultados de cada consultor solicitado en la petición
        const consultantInData = data.find(consultant => consultant.userCode === result);
        if (consultantInData) { // Si existe se añade al total de costos fijos el costo fijo del consultor y luego al arreglo de consultores el nombre de este
            totalFixedCost = totalFixedCost + consultantInData.fixedCost;
            response.consultants.push({
                userName: consultantInData.userName,
                data: []
            });
        }
    });
    response.meanFixedCost = totalFixedCost / response.consultants.length; // Se guarda la media de todos los gastos fijos
    data.forEach(result => {
        if (currentYear !== result.year) { // Si es un nuevo año, añade el primer valor (mes, año) de este elemento
            response.periods.push({
                year: result.year,
                month: result.month
            });
            currentYear = result.year; // El año y mes actual son los nuevos valores
            currentMonth = result.month;
        } else { // Si el año es el mismo
            if (currentMonth !== result.month) { // Si el mes es distinto se añade el valor (mes, año) de este elemento
                response.periods.push({
                    year: result.year,
                    month: result.month
                });
                currentMonth = result.month; // El mes actual es el nuevo mes
            }
        }
    });
    response.consultants.forEach(consultant => { // En cada usuario se evalua si el existe valor de ganancia durante cada periodo
        response.periods.forEach(period => {
            let dataResult = data.find(
                result => result.year === period.year && result.month === period.month && result.userName === consultant.userName
            );
            if (dataResult) { // Si existe ganancia en el periodo se agrega ese valor, si no se añade un 0
                consultant.data.push(dataResult.gain);
            } else {
                consultant.data.push(0);
            }
        });
    });
    return response;
}

module.exports = router;
