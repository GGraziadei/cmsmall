'use strict';

const express = require('express');
const morgan = require('morgan'); // logging middleware
const { check, validationResult } = require('express-validator'); // validation middleware
const cors = require('cors');
const { config } = require('./config');
const { roleValidator, checkIdMatch, pageExistsAndUserCanOperate, validate, isLoggedIn,  blocksValidation, debugDelay, isAdmin } = require('./middlewares');
const passport = require('passport'); // auth middleware
const LocalStrategy = require('passport-local').Strategy; // username and password for login
const session = require('express-session'); // enable sessions

/* DAO */
const userDao = require('./user-dao'); // module for accessing the user info in the DB
const cmsDao = require('./cms-dao');
const { fileList } = require('./helpers');

// init express
const app = new express();

// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(cors(config.corsOptions));
app.use('/static', express.static('public'));

if(config.debug.active){
  app.use(debugDelay);
}

/*** Set up Passport ***/
// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(new LocalStrategy(
  function (username, password, done) {
    userDao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, { message: 'Incorrect username and/or password.' });

      return done(null, user);
    })
  }
));

// serialize and de-serialize the user (user object <-> session)
// we serialize the user id and we store it in the session: the session is very small in this way
passport.serializeUser((user, done) => {
  done(null, { email: user.email, id: user.id });
  //Verbose strategy: id => email 
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((session, done) => {
  const id = session.id;
  userDao.getUserById(id)
    .then(user => {
      if (session.email === user.email) {
        done(null, user); // this will be available in req.user
      } else {
        done({ error: "Email is not linked to the right user id." }, null);
      }
    }).catch(err => {
      done(err, null);
    });
});

// set up the session
app.use(session(config.sessionOptions));

//init passport
app.use(passport.initialize());
app.use(passport.session());

// GET /api/users
app.get('/api/users',
  isAdmin,
  async (req, res) => {
    try {
      const users = await userDao.getUsers();
      res.json(users);
    } catch (err) {
      console.log(err);
      res.status(500).end();
    }
  });

// GET /api/pages
app.get('/api/pages',
  isLoggedIn,
  async (req, res) => {
    try {
      const pages = await cmsDao.listPages(req.user.id, req.user.role === 'admin');
      res.json(pages);
    } catch (err) {
      console.log(err);
      res.status(500).end();
    }
  });

// GET /api/pages/filters
app.get('/api/pages/filters',
validate([
  check('filterId').isString().notEmpty(),
  check('value').optional({ nullable: true }).isSlug()
]),
async (req, res) => {

  const filterId = req.query.filterId;
  
  try {
    let result ;
    if(filterId === 'slug' ){
      const slug = req.query.value;
      result = await cmsDao.getPageBySlug(slug);
      result.blocks = await cmsDao.getBlocksByPageId(result.id);
    }else if (filterId === 'published' ) result = await cmsDao.getPublishedPages();
    
    if (result.error) res.status(404).json(result);
    else res.json(result);

  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
});

// GET /api/pages/<id>
app.get('/api/pages/:id',
  validate([
    check('id').isInt()
  ]),
  isLoggedIn,
  async (req, res) => {

    try {
      const page = await cmsDao.getPageById(req.params.id, req.user.id, req.user.role === 'admin');
      const blocks = await cmsDao.getBlocksByPageId(req.params.id);
      const result = {...page , blocks: blocks};
      if (result.error)
        res.status(404).json(result);
      else
        res.json(result);
    } catch (err) {
      console.log(err);
      res.status(500).end();
    }
  });


// POST /api/pages
app.post('/api/pages',
  isLoggedIn,
  validate([
    check('title').isString().notEmpty().withMessage('Insert string as title'),
    check('publishDate').isDate({ format: 'YYYY-MM-DD', strictMode: true }).optional({ nullable: true }).withMessage('Date format not valid.'),
    check('blocks', 'blocks list required.').isArray()
  ]),
  blocksValidation,
  async (req, res) => {

    const pageDto = {
      title: req.body.title,
      authorId: req.user.id,
      creationDate: undefined, //serverside set dayjs() as creation date
      publishDate: req.body.publishDate
    };


    try {
      const pageId = await cmsDao.createPage(pageDto);
      const blocks = req.body.blocks.map(block => {
        return new Object({
          type: block.type,
          pageId: pageId,
          content: block.content,
          position : block.position
        });
      });
      const blockIds = [];
      for (const blockDto of blocks) {
        const blockId = await cmsDao.createBlock(blockDto);
        blockIds.push(blockId);
      }

      res.status(201).json({ pageId: pageId, blockIds: blockIds });
    } catch (err) {
      console.log(err);
      res.status(503).json({ error: `Database error during the creation of page ${pageDto.title}.`, code: err.code, errno: err.errno });
    }

  });

// DELETE /api/pages/<id>
app.delete('/api/pages/:id',
  isLoggedIn,
  validate([
    check('id').isInt().withMessage('id not valid.'),
  ]),
  pageExistsAndUserCanOperate,
  async (req, res) => {
    try {
      const isAdmin = req.user.role === 'admin';
      const numRowChanges = await cmsDao.deletePage(req.params.id, req.user.id, isAdmin);
      res.json(numRowChanges);
    } catch (err) {
      console.log(err);
      res.status(503).json({ error: `Database error during the deletion of page ${req.params.id}.`, code: err.code, errno: err.errno });
    }
  });

// PUT /api/pages/<id>
app.put('/api/pages/:id',
  checkIdMatch,
  isLoggedIn,
  validate([
    check('title').isString().notEmpty().withMessage('Insert string as title'),
    check('publishDate').isDate({ format: 'YYYY-MM-DD', strictMode: true }).optional({ nullable: true }).withMessage('Date format not valid.'),
    check('id').isInt().withMessage('id not valid.'),
    check('authorId').isInt().optional({ nullable: true }).withMessage('authorId not valid.'),
    check('blocks', 'blocks list required.').isArray().optional({ nullable: true })
  ]),
  roleValidator,
  pageExistsAndUserCanOperate,
  blocksValidation,
  async (req, res) => {

    const page = {...req.body};
    const pageId = page.id;

    if(req.user.role === 'admin' && req.body.authorId){
      page.authorId = req.body.authorId;
    }else{
      //Default user is author of this page
      page.authorId = req.user.id;
    }

    try {
      const numRowChanges = await cmsDao.updatePage(page, req.user.id, req.user.role === 'admin');
      if(page.blocks) {
        const blocks = page.blocks;
        await cmsDao.deleteBlocksByPageId(pageId);
        for(const block of blocks) await cmsDao.createBlock({...block, pageId : pageId});
      }
      res.json({pageUpdated : numRowChanges, blocksUpdated : page.blocks && page.blocks.length });
    } catch (err) {
      console.log(err);
      res.status(503).json({ error: `Database error during the update of page ${req.params.id}.`, code: err.code, errno: err.errno });
    }

  });

/*** Settings APIs ***/
// GET /api/settings/:k
app.get('/api/settings/:k',
  async (req, res) => {

    const k = req.params.k;

    try {
      const result = await cmsDao.getSetting(k);
      if (result.error)
        res.status(404).json(result);
      else
        res.json(result);
    } catch (err) {
      console.log(err);
      res.status(500).end();
    }
  });

// PUT /api/settings/:k
app.put('/api/settings/:k',
  validate([
    check('title').isString().notEmpty().withMessage('Insert valid title'),
  ]),
  isAdmin,
  async (req, res) => {

    const k = req.params.k;
    const userId = req.user.id;
    const v = req.body.title;

    try {
      const numRowChanges = await cmsDao.updateSetting(k,v, userId);
      res.json(numRowChanges);
    } catch (err) {
      console.log(err);
      res.status(503).json({ error: `Database error during the update of setting ${k}.`, code: err.code, errno: err.errno });
    }

  });

/*** Static file APIs ***/
// GET /static -- index of content of static folder 
app.get('/api/static',
  isLoggedIn,
  async (req, res) => {
    try {
      const baseUri = '/static/images/';
      const files = await fileList('images');
      const fileListUri = files.map(f => Object({ name: f, uri: baseUri + f }));
      res.json({ images: fileListUri });
    } catch (err) {
      res.status(503).json({ error: "error during files opening" });
    }

  });

/*** Users APIs ***/

// POST /sessions 
// login
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json(info);
    }
    // success, perform the login
    req.login(user, (err) => {
      if (err)
        return next(err);

      return res.json(req.user);
    });
  })(req, res, next);
});

// DELETE /sessions/current 
// logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => { res.json({}); });
});

// GET /sessions/current
// check whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  }
  else
    res.status(401).json({ error: 'Unauthenticated user!' });;
});

// activate the server
app.listen(config.port, () => {
  console.log(`${config.appName} listening at http://localhost:${config.port}`);
});
