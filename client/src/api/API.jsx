import {  dto2block, dto2page, page2dto } from "./helpers";

const STATIC_URL = 'http://localhost:3001';

const SERVER_URL = STATIC_URL + '/api';

const REQUEST = async (method, path, body) => {
    try {
        const response = await fetch(SERVER_URL + path,
            {
                method: method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

        const obj = await response.json() ;

        if (response.ok) {
            return obj;
        } else {
            throw obj; // { error : "Error" }
        }
    } catch (error) {
        throw error;
    }
};

const GET = async (path) => await REQUEST('GET', path, undefined);
const DELETE = async (path) => await REQUEST('DELETE', path, undefined);
const PUT = async (path, obj) => await REQUEST('PUT', path, obj);
const POST = async (path, obj) => await REQUEST('POST', path, obj);

const getTitle = async () => await GET(`/settings/title`);

const setTitle = async newTitle => await PUT(`/settings/title`, {title : newTitle} );

const getUsers = async () => await GET(`/users`);

const getPageBySlug_public = async (pageSlug) => {
    const dto = await GET(`/pages/filters?filterId=slug&value=${pageSlug}`);
    const blocks = dto.blocks.map(b => dto2block(b));
    const page = dto2page(dto);
    page.blocks = [...blocks];
    return page;
};

const getAllPublishedPages_public = async () => {
    const dto = await GET(`/pages/filters?filterId=published`);
    return dto.map(p => dto2page(p));
};

const getAllPages_auth = async () => {
    const dto = await GET(`/pages`);
    return dto.map(p => dto2page(p));
};

const getPageById_auth = async (pageId) => {
    const dto = await GET(`/pages/${pageId}`);
    const blocks = dto.blocks.map(b => dto2block(b));
    const page = dto2page(dto);
    page.blocks = [...blocks];
    return page;
};

const createPage = async (page) => await POST(`/pages`, page2dto(page));

const deletePage = async (pageId) => await DELETE(`/pages/${pageId}`);

const updatePage = async (page) => await PUT(`/pages/${page.id}`, page2dto(page));

const getPlaceholders = async () => { 
    const dto = await GET(`/static`);
    return dto.images;
};

/*user authentication*/
const logIn = async (credentials) => await POST('/sessions', credentials);

const logOut = async () => await DELETE(`/sessions/current`);

const getUserInfo = async () => await GET(`/sessions/current`);

/*Enable access to API*/
const API = {
    logIn, logOut, getUserInfo, getAllPages_auth, getAllPublishedPages_public, getPageBySlug_public, createPage,
    getPageById_auth, deletePage, updatePage, getUsers, getTitle, setTitle, getPlaceholders, STATIC_URL
};

export default API;