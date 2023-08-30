import dayjs from 'dayjs';
import API from './API';

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

const dto2page = (dto) => Object({
    id: parseInt(dto.id),
    title: dto.title,
    creationDate: dto.creationDate && dayjs(dto.creationDate),
    publishDate: dto.publishDate && dayjs(dto.publishDate),
    status: pageStatus(dto.publishDate),
    author: dto.author,
    authorId : dto.authorId, //undefined if absent
    slug: dto.slug
});

const dto2block = (dto) => Object({
    id : parseInt(dto.id),
    type: blockType( dto.type ),
    pageId : parseInt(dto.pageId),
    content : dto.content,
    position: parseInt(dto.position)
});

const page2dto = (page) => Object({
    id: page.id && parseInt(page.id), //creation no id, update id is defined
    title: page.title,
    publishDate: page.publishDate && dayjs(page.publishDate).format('YYYY-MM-DD'),
    authorId : parseInt(page.authorId), //set only if admin
    blocks : page.blocks && page.blocks.map( block => block2dto(block)) // [block, ...]
});

const block2dto = (block) => Object({
    id : block.id && parseInt(block.id),
    type: blockType( block.type ),
    pageId : block.pageId && parseInt(block.pageId), //creation no pageId, update pageId is defined
    content :   block.content ,
    position : block.position
});

const userCanOperate = (user, authorId) => {

    if(user.role === 'admin' || user.id === authorId ){
        return true;
    }

    return false;
}

const block2content = (block) => {
    switch(block.type){
        case type.Header : return(<p className='block-header'>{block.content}</p>);
        case type.Paragraph : return(<p className='block-paragraph'>{block.content}</p>);
        case type.Image : return(<img src={ API.STATIC_URL + block.content} alt={block.id} className='img-fluid'/>);
        default : return(<></>);
    }
}

const changeItemProperty = (oldList, itemId, property) => {
    const newList = [...oldList];
    return newList.map(p => p.id === itemId ? Object.assign({property : property }, p) : p);
}

export { block2dto, dto2block, dto2page, page2dto, userCanOperate, block2content, changeItemProperty, type };