'use strict';

const dayjs = require('dayjs');
const slugify = require('slugify');
const path = require('path');
const fs = require('fs');
const { title } = require('process');

const status = Object.freeze({
    Draft: 'draft',
    Published: 'pubblicata',
    Scheduled: 'programmata'
});

const type = Object.freeze({
    Image: 'immagine',
    Paragraph: 'paragrafo',
    Header: 'header'
});

const pageStatus = (rowDate) => {

    if (rowDate === null)
        return status.Draft;
    if (dayjs(rowDate).isBefore(dayjs()))
        return status.Published;

    return status.Scheduled;

}

const blockType = (rowType) => {
    switch (rowType) {
        case 'immagine' : return type.Image;
        case 'paragrafo' : return type.Paragraph;
        case 'header' : return type.Header;
    }
}

const slugifyImproved = (str) => {

    const title = str.toLowerCase().replace(/[^A-Za-z0-9]/g," ");
    const slug = slugify(title);
    return slug;

}

exports.row2page = (row, userId, isAdmin) => Object({
    id: parseInt(row.id),
    title: new String(row.title),
    slug: new String(row.slug),
    creationDate: row.creation_date && dayjs(row.creation_date).format('YYYY-MM-DD'),
    publishDate: row.publish_date && dayjs(row.publish_date).format('YYYY-MM-DD'),
    status: pageStatus(row.publish_date),
    author: new String(row.name),
    authorId : (parseInt(userId) === parseInt(row.authorId) || isAdmin ) ? row.authorId : null
});

exports.row2block = (row) => Object({
    id : parseInt(row.id),
    type: blockType( row.type ),
    pageId : parseInt(row.pageId),
    position : parseInt(row.position),
    content :  new String( row.content ),
});

exports.page2row = (page) => {

    if (!page.id) {
        page.creationDate = dayjs().format('YYYY-MM-DD');
    } 

    if (page.publishDate) {
        page.publishDate = page.publishDate && dayjs(page.publishDate).format('YYYY-MM-DD');
    } else {
        page.publishDate = null; 
    }

    const slug = slugifyImproved(page.title);

    if(page.id){
        //Update
        return [page.title, slug, page.authorId, page.publishDate, page.id];
    }else{
        //Creation
        return [page.title, slug, page.authorId, page.creationDate, page.publishDate];
    }
}

exports.block2row = (block) => {

    return [block.type, block.pageId, block.content, block.pageId];

}

exports.fileList =  (dir) => {
    const publicPath = path.join(__dirname, 'public');
    const directoryPath = path.join(publicPath, dir);
    
    return new Promise( (resolve, reject) => {
        fs.readdir(directoryPath, function (err, files) {
            if (err) {
                reject(err);
            } 
            const fileList = [];
            files.forEach(function (file) {
                fileList.push(file);
            });
            resolve(fileList);
        });
    });

}

exports.blocksBusinessRule = (blocks, filterId) => {
    let header = false;
    let content = false;

    for (const block of blocks) {
        if (block.id && block.id ===  filterId ) continue;
        if (block.type == type.Header){
            header = true;
        }else if (block.type == type.Image 
            || block.type == type.Paragraph){
            content = true;
        }
        if (header && content) return true;
    }

    return false;
}

exports.blockType = type;