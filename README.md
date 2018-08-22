# api-agence
API Restful en Node.JS de prueba para Agence

## Información
Esta API Restful esta creada en Node.JS con Express

## Configuración de Base de Datos:
Modificar archivo **CONFIG.JSON** con los datos de conexión con la base de datos.

## Peticiones:
Responde a 4 peticiones las cuales son las siguientes.

#### GET
Ruta "/consultants/": Entrega el listado de consultores permitidos por el sistema.

#### POST
Ruta **"/consultants/getDataForReport/:minDate/:maxDate/"**, con cuerpo **{ "consultants": String[] }**: Entrega los datos necesarios para generar el reporte de los consultores en los periodos solicitados.

Ruta **"/consultants/getDataForBarChart/:minDate/:maxDate/"**, con cuerpo **{ "consultants": String[] }**: Entrega los datos necesarios para generar el gráfico de barra de los consultores en los periodos solicitados.

Ruta **"/consultants/getDataForReport/:minDate/:maxDate/"**, con cuerpo **{ "consultants": String[] }**: Entrega los datos necesarios para generar el gráfico de torta de los consultores en los periodos solicitados.
