'use strict';

const sqlite = require('sqlite3');
const { config } = require('./config');
const { row2page, page2row, row2block, block2row } = require('./helpers');
const dayjs = require('dayjs');
const { isAdmin } = require('./middlewares');

/* Data Access Object (DAO) module for accessing pages and blocks */


// open the database
// enable foreign key support (ON DELETE CASCADE enable)
// https://www.sqlite.org/foreignkeys.html
const db = new sqlite.Database(config.dbName, (err) => {
  if (err) throw err;
});

db.run("PRAGMA foreign_keys=ON;", [], function (err) {
  console.log("foreign key support enabled");
  if (err) {
    console.log('Support for foreign key not enabled. error: ' + err)
    return;
  }
});

// get all pages
exports.listPages = (userId, isAdmin) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT P.id, P.title, P.slug, P.creation_date, P.publish_date, U.name, U.id AS authorId \
      FROM users U, pages P \
      WHERE U.id = P.authorId \
      ORDER BY P.creation_date DESC ;';

    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const pages = rows.map(row => row2page(row, userId, isAdmin));
      resolve(pages);
    });
  });
};

// get all published pages
exports.getPublishedPages = (userId, isAdmin) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT P.id, P.title, P.slug, P.creation_date, P.publish_date, U.name, U.id AS authorId \
      FROM users U, pages P \
      WHERE U.id = P.authorId AND P.publish_date IS NOT NULL \
      AND P.publish_date <= DATE(?) \
      ORDER BY P.publish_date DESC;';

    db.all(sql, [dayjs().format('YYYY-MM-DD')], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const pages = rows.map((row) => {
        const page = row2page(row, -1, false);
        return page;
      });

      resolve(pages);
    });
  });
};

// get the page identified by {id}
exports.getPageById = (id, userId, isAdmin) => {
  return new Promise((resolve, reject) => {

    const sql = 'SELECT P.id, P.title, P.slug, P.creation_date, P.publish_date, U.name, U.id AS authorId \
      FROM users U, pages P \
      WHERE U.id = P.authorId AND P.id = ? ;';

    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      if (row == undefined) {
        resolve({ error: 'Page not found.' });
      } else {
        const page = row2page(row, userId, isAdmin);
        resolve(page);
      }
    });
  });
};

// get the page identified by {slug}
exports.getPageBySlug = (slug) => {
  return new Promise((resolve, reject) => {

    const sql = 'SELECT P.id, P.title, P.slug, P.creation_date, P.publish_date, U.name, U.id AS authorId \
      FROM users U, pages P \
      WHERE U.id = P.authorId AND P.slug = ? \
      AND P.publish_date IS NOT NULL\
      AND P.publish_date <= DATE(?) \ ;';

    db.get(sql, [slug, dayjs().format('YYYY-MM-DD')], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      if (row == undefined) {
        resolve({ error: 'Page not found.' });
      } else {
        const page = row2page(row, -1, false);
        resolve(page);
      }
    });
  });
};

// add a new page
exports.createPage = (page) => {
  return new Promise((resolve, reject) => {

    const sql = 'INSERT INTO pages(title, slug, authorId, creation_date, publish_date) \
                VALUES(?, ?, ?, DATE(?), DATE(?) );';

    const pageDto = page2row(page);
    db.run(sql, pageDto, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    });

  });
};

// update an existing page
exports.updatePage = (page, userId, isAdmin) => {
  return new Promise((resolve, reject) => {

    if (isAdmin) {
      const sql = 'UPDATE pages SET title=?, slug=?, authorId=?, publish_date=DATE(?) WHERE id = ? ;';
      const pageDto = page2row(page);
      db.run(sql, pageDto, function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);
      });
    } else {
      
      /*Only admin can modify authorId*/
      if(page.authorId !== userId){
        reject("Only admin user can change the authorId");
      }

      const sql = 'UPDATE pages SET title=?, slug=?, authorId=?, publish_date=DATE(?) WHERE id = ? AND authorId = ? ;';
      const pageDto = page2row(page);
      db.run(sql, [...pageDto, userId], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);
      });
    }

  });
};

// delete an existing page
// ON DELETE CASCADE => also linked block are deleted
exports.deletePage = (id, userId, isAdmin) => {
  return new Promise((resolve, reject) => {

    let sql = 'DELETE FROM pages \
      WHERE id = ? ';
    const par = [id];
    if (!isAdmin) {
      sql += 'AND authorId = ? ;';
      par.push(userId);
    } else {
      sql += ';';
    }

    db.run(sql, par, function (err) {
      if (err) {
        reject(err);
        return;
      } else
        resolve(this.changes);
    });

  });
}

// get all blocks by pageId
exports.getBlocksByPageId = (pageId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT B.id, B.type, B.pageId, B.position, B.content \
      FROM blocks B \
      WHERE B.pageId = ? \
      ORDER BY B.position ASC;';

    db.all(sql, [pageId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const blocks = rows.map(row => row2block(row));
      resolve(blocks);
    });
  });
};

// delete an existing block
exports.deleteBlocksByPageId = (pageId) => {
  return new Promise((resolve, reject) => {

    let sql = 'DELETE FROM blocks \
      WHERE pageId = ? ;';

    db.run(sql, [pageId], function (err) {
      if (err) {
        reject(err);
        return;
      } else
        resolve(this.changes);
    });

  });
}

// add a new block
exports.createBlock = (block) => {
  return new Promise((resolve, reject) => {

    const sql = 'INSERT INTO blocks(type, pageId, content, position) \
    VALUES(?, ?, ?, ( (SELECT COUNT(*) FROM BLOCKS WHERE pageId = ? ) + 1 ) );';

    const blockDto = block2row(block);

    db.run(sql, blockDto, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    });

  });
};


// get setting 
exports.getSetting = (k) => {
  return new Promise((resolve, reject) => {

    const sql = 'SELECT S.v, U.name, U.email \
      FROM users U, settings S \
      WHERE U.id = S.userId AND S.k = ? ;';

    db.get(sql, [k], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      if (row == undefined) {
        resolve({ error: 'Setting not found.' });
      } else {
        const setting = {
          author : {
            name : row.name,
            email : row.email
          }
        };
        setting[k] = row.v; /*Assign value*/
        resolve(setting);
      }
    });
  });
};

// update setting
exports.updateSetting = (k,v, userId) => {
  return new Promise((resolve, reject) => {

    const sql = 'UPDATE settings \
      SET v = ? , userId = ? \
      WHERE  k = ? ;';

      db.run(sql, [v,userId,k], function(err){
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);
      });

  });
};

