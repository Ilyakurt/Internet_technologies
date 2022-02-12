import express from 'express';
import { resolve } from 'path';
import { __dirname } from './globals.js';
import { readData, writeData } from './fileUtils.js';

const app = express();

const hostname = 'localhost';
const port = 4321;

const hrs = [];

// Middleware для формирования ответа в формате JSON
app.use(express.json());

// Middleware для логирования запросов
app.use((request, response, next) => {
  console.log(
    (new Date()).toISOString(),
    request.ip,
    request.method,
    request.originalUrl
  );

  next();
});

// Middleware для раздачи статики
app.use('/', express.static(
  resolve(__dirname, '..', 'public')
));

//---------------------------------------------------
// Роуты приложения

// Получение весех hr-ов
app.get('/hrs', (request, response) => {
  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json(hrs);
});

// Создание нового hr-а
app.post('/hrs', async (request, response) => {
  console.log(request);
  const { hrName } = request.body;
  hrs.push({
    hrName,
    vacancys: []
  });
  await writeData(hrs);

  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json({
      info: `hr'${hrName}' was successfully created`
    });
});

// Создание новой вакансии
app.post('/hrs/:hrId/vacancys', async (request, response) => {
  const { vacancyName, vacancyCompany } = request.body;
  const hrId = Number(request.params.hrId);

  if (hrId < 0 || hrId >= hrs.length) {
    response
      .setHeader('Content-Type', 'application/json')
      .status(404)
      .json({
        info: `There is no hr with id = ${hrId}`
      });
    return;
  }

  hrs[hrId].vacancys.push({vacancyName, vacancyCompany});
  await writeData(hrs);
  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json({
      info: `vacancy '${vacancyName}' was successfully added in hr '${hrs[hrId].hrName}'`
    });
});

// Изменение вакансии
app.put('/hrs/:hrId/vacancys/:vacancyId', async (request, response) => {
  const vacancyName = request.body.newvacancyName ;
  const vacancyCompany = request.body.newvacancyCompany ;
  const hrId = Number(request.params.hrId);
  const vacancyId = Number(request.params.vacancyId);

  if (hrId < 0 || hrId >= hrs.length
    || vacancyId < 0 || vacancyId >= hrs[hrId].vacancys.length) {
    response
      .setHeader('Content-Type', 'application/json')
      .status(404)
      .json({
        info: `There is no hr with id = ${
          hrId} or vacancy with id = ${vacancyId}`
      });
    return;
  }

  hrs[hrId].vacancys[vacancyId] = { vacancyName, vacancyCompany };
  await writeData(hrs);
  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json({
      info: `{vacancy №${vacancyId} was successfully edited in hr '${hrs[hrId].hrName}'`
    });
});

// Удаление вакансии
app.delete('/hrs/:hrId/vacancys/:vacancyId', async (request, response) => {
  const hrId = Number(request.params.hrId);
  const vacancyId = Number(request.params.vacancyId);

  if (hrId < 0 || hrId >= hrs.length
    || vacancyId < 0 || vacancyId >= hrs[hrId].vacancys.length) {
    response
      .setHeader('Content-Type', 'application/json')
      .status(404)
      .json({
        info: `There is no hr with id = ${hrId} or vacancy with id = ${vacancyId}`
      });
    return;
  }

  const deletedvacancyName = hrs[hrId].vacancys[vacancyId];
  hrs[hrId].vacancys.splice(vacancyId, 1);
  await writeData(hrs);
  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json({
      info: `vacancy '${deletedvacancyName}' was successfully deleted from hr '${hrs[hrId].hrName}'`
    });
});

// Перенос вакансии от одного HR`a к другому
app.patch('/hrs/:hrId', async (request, response) => {
  const fromhrId = Number(request.params.hrId);
  const { tohrId, vacancyId } = request.body;

  if (fromhrId < 0 || fromhrId >= hrs.length
    || vacancyId < 0 || vacancyId >= hrs[fromhrId].vacancys.length
    || tohrId < 0 || fromhrId >= hrs.length) {
    response
      .setHeader('Content-Type', 'application/json')
      .status(404)
      .json({
        info: `There is no hr with id = ${
          fromhrId} of ${tohrId} or vacancy with id = ${vacancyId}`
      });
    return;
  }

  const movedvacancyName = hrs[fromhrId].vacancys[vacancyId];

  hrs[fromhrId].vacancys.splice(vacancyId, 1);
  hrs[tohrId].vacancys.push(movedvacancyName);

  await writeData(hrs);
  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json({
      info: `vacancy '${movedvacancyName}' was successfully moved from hr '${hrs[fromhrId].hrName}' to hr '${
        hrs[tohrId].hrName
      }'`
    });
}); 

//---------------------------------------------------

// Запуск сервера
app.listen(port, hostname, async (err) => {
  if (err) {
    console.error('Error: ', err);
    return;
  }

  console.log(`Out server started at http://${hostname}:${port}`);

  const hrsFromFile = await readData();
  hrsFromFile.forEach(({ hrName, vacancys }) => {
    hrs.push({
      hrName,
      vacancys: [...vacancys]
    });
  });
});
