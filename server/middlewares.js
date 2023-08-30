'use strict';

const { validationResult, ValidationChain } = require('express-validator');
const cmsDao = require("./cms-dao");
const { blocksBusinessRule} = require('./helpers');
const { config } = require('./config');

exports.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated())
      return next();
    
    return res.status(401).json({ error: 'Not authenticated'});
}

exports.isAdmin = (req, res, next) => {
    if(req.isAuthenticated()){
        if(req.user.role === 'admin' )
            return next();
        else 
            return res.status(401).json({ error: 'User not allowed.'});
    }
    
    return res.status(401).json({ error: 'Not authenticated'});
}

//Gestisco gli errori attraverso il middleware che analizza la catena di validazione
exports.validate = validations => {
    return async (req, res, next) => {
        for (const validation of validations) {
            const result = await validation.run(req);
            if (result.errors.length) break;
        }

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({ errors: errors.array() });
    };
};

exports.roleValidator = (req, res, next) => {
    const user = req.user;
    const authorId = req.body.authorId;

    if(!req.body.authorId) return next(); //Next middleware check permissions

    if (user.role === 'admin' || user.id === authorId) {
        return next();
    } else {
        res.status(400).json({ error: "user has not privilegies." });
    }
}

exports.checkIdMatch = (req, res, next) => {
    const bodyId = parseInt(req.body.id);
    const urlId = parseInt(req.params.id);

    if (urlId === bodyId) return next();

    res.status(400).json({ error: "id in url doesn\'t match with id in body." });
}

exports.pageExistsAndUserCanOperate = async (req, res, next) => {

    try{
        const id = req.params.id;
        const userId = parseInt(req.user.id);
        const isAdmin = req.user.role === 'admin';

        const page = await cmsDao.getPageById(id, userId, isAdmin);

        if(!page.id){
            res.status(404).json({ error: "page not found." });
            return;
        }

        if (req.user.role === 'admin' || (page.authorId == req.user.id ) ) {
            return next();
        }

        res.status(403).json({ error: "user has not permission." });

    }catch(err){
        res.status(400).json({ error: err });
    }
    
}

exports.blocksValidation = (req, res, next) => {

    const blocks = req.body.blocks;
    
    if(!blocks)
        return next();

    if (blocksBusinessRule(blocks, -1 ))
        return next();

    res.status(400).json({ error: "Header block is required. Image or Paragraph block is required." });
}


exports.debugDelay =  (req, res, next) => {
    setTimeout(() => req.next() , config.debug.delay );
}