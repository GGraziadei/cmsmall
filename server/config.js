'use strict';

exports.config = {
  appName: 'cmsmall-server',
  dbName : 'cmsmall.sqlite',
  port: 3001,
  corsOptions: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
  sessionOptions: {
    secret: 'aw1Exam_20230620_s308963',
    resave: false,
    saveUninitialized: false
  },
  saltSize: 64,
  debug: {
    active: false,
    delay: 1000
  }

}

