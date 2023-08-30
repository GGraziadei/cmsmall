import { Col, Container, Button, Form, ButtonGroup, ListGroup, ListGroupItem, Image, Tooltip, OverlayTrigger, Row } from 'react-bootstrap';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import API from '../api/API';
import ErrorContext from '../contexts/ErrorContext';
import validator from 'validator';
import { LoadingLottie } from '../lotties/Lotties';
import { type as blockTypes } from '../api/helpers';
import StatusContext from '../contexts/StatusContext';

function BlockForm(props) {

    const { block, placeholders, up, down, updateBlock, deleteBlock, removeBlock } = props;
    const types = Object.entries(blockTypes);
    const { handleErrors } = useContext(ErrorContext);

    const [update, setUpdate] = useState(block.newBlock && block.newBlock >= 1);
    const [type, setType] = useState(block && block.type ? block.type : blockTypes.Paragraph);
    const [content, setContent] = useState(block && block.content ? block.content : '');

    const canModify = !(block.property && block.property === 'danger');

    const reset = () => {
        setType(block && block.type);
        setContent(block && block.content);
        setUpdate(false);
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (validator.isEmpty(content)) {
            handleErrors(['Insert a valid content for block ' + block.position]);
            return;
        }

        setUpdate(false);

        const blockUpdate = {
            ...block,
            type: type,
            content: content
        };

        updateBlock(blockUpdate);

    }

    return (
        <Form onSubmit={handleSubmit} >

            <Form.Group className='mb-3' >
                <Form.Label>Type</Form.Label>
                <Form.Select name="type" value={type} onChange={ev => { setType(ev.target.value); setUpdate(true); }} disabled={!canModify}>
                    {
                        types.map(([k, v]) => <option value={v} key={k} >{v}</option >)
                    }
                </Form.Select>
            </Form.Group>
            {
                type !== blockTypes.Image ?
                    <Form.Group className='mb-3' >
                        <Form.Label>Content</Form.Label>
                        <Form.Floating><p className={
                            type === 'paragrafo' ? 'block-paragraph' : 'block-header'
                        }>{content}</p></Form.Floating>
                        <Form.Control as="textarea" name="content" value={content} onChange={ev => { setUpdate(true); setContent(ev.target.value); }} disabled={!canModify} />
                    </Form.Group> :
                    <Form.Group className='mb-3'>
                        <Form.Label>Content Image</Form.Label>
                        {
                            placeholders.filter(p => p.uri === content).length >= 1 ? <>
                                <Form.Floating><Image src={API.STATIC_URL + content} className='img' height={300} /></Form.Floating>
                                <br></br>
                                <hr></hr>
                            </> : <></>
                        }
                        <Form.Select name="content" value={content} onChange={ev => { setUpdate(true); setContent(ev.target.value); }} disabled={!canModify} >
                            <option value={null} key={-1} disabled>Select an image from list...</option>
                            {
                                placeholders.map((p) => <option value={p.uri} key={p.name} >
                                    {p.name}
                                </option >)
                            }
                        </Form.Select>
                    </Form.Group>
            }

            <ButtonGroup>
                {
                    !canModify ? //block !deleted
                        <>
                            <Button type='submit' variant="primary">Restore</Button>
                        </> :
                        <>
                            { update ? <Button type='submit' variant="primary">{props.action}</Button> : <></> }
                            {!(block.property && block.property === 'success') ?
                                <>
                                    <Button variant='warning' onClick={reset} >Reset</Button>
                                    <OverlayTrigger placement="top" overlay={<Tooltip>{`Delete block `}</Tooltip>}>
                                        <Button variant='danger' onClick={deleteBlock} ><i className="bi bi-trash"></i></Button>
                                    </OverlayTrigger>
                                </> : <></>}

                            <OverlayTrigger placement="top" overlay={<Tooltip>{`Move down block `}</Tooltip>}>
                                <Button variant='info' onClick={down} disabled={!down}>
                                    <i className="bi bi-arrow-down"></i>
                                </Button>
                            </OverlayTrigger>

                            <OverlayTrigger placement="top" overlay={<Tooltip>{`Move up block`}</Tooltip>}>
                                <Button variant='info' onClick={up} disabled={!up}>
                                    <i className="bi bi-arrow-up"></i>
                                </Button>
                            </OverlayTrigger>

                        </>
                }
                {
                    !canModify || (block.property && block.property === 'success') ?
                        <Button onClick={removeBlock} variant="secondary">Remove</Button> : <></>
                }
            </ButtonGroup>

        </Form>
    );

}

function UpdateCreateForm(props) {

    const { page, action, isAdmin, users } = props;
    const navigate = useNavigate();
    const { handleErrors } = useContext(ErrorContext);

    function handleSubmit(event) {
        event.preventDefault();

        setHandle(false);
        const errors = [];

        if (validator.isEmpty(title)) {
            errors.push('Insert title.');
        }

        const creationDateValidation = (page && page.creationDate) ? page.creationDate : dayjs().format('YYYY-MM-DD');
        if (publishDate && dayjs(publishDate).isBefore(dayjs(creationDateValidation))) {
            errors.push('You cannot publish a page before its creation.');
        }

        if (publishDate && !validator.isDate(publishDate)) {
            errors.push('Insert valid publishDate.');
        }

        if (errors.length > 0) {
            setHandle(true);
            handleErrors(errors);

            return;
        }

        if (page && page.id) {
            const pageUpdate = {
                id: page.id,
                title: title,
                publishDate: published ? publishDate : null,
                authorId: isAdmin && authorId //set only if admin
            };


            /*Disable other update during update*/
            props.updatePage(pageUpdate).then(r => { setHandle(true); }).catch(err => setHandle(true));
        } else {

            const pageCreate = {
                title: title,
                publishDate: published ? publishDate : null,
            };

            /*Disable other update during update*/
            props.createPage(pageCreate).then(r => { setHandle(true); }).catch(err => setHandle(true));
        }


    }

    const [title, setTitle] = useState(page && page.title ? page.title : '');
    const [published, setPublished] = useState(page && page.publishDate ? true : false);
    const [publishDate, setPublishDate] = useState(page && page.publishDate ? page.publishDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
    const [authorId, setAuthorId] = useState(page && page.authorId);

    const [handle, setHandle] = useState(true);

    return (
        <Form onSubmit={handleSubmit}>
            <h3>{action} page</h3>
            <Form.Group className='mb-3 '>
                <Form.Label>Title</Form.Label>
                <Form.Control type="text" name="title" value={title} onChange={ev => setTitle(ev.target.value)} />
            </Form.Group>

            {
                page && page.slug ?
                    <Form.Group className='mb-3 '>
                        <Form.Label>Slug</Form.Label>
                        <Form.Floating>The slug is automatically generated serverside</Form.Floating>
                        <Form.Control type="text" name="title" value={page.slug} disabled={true} />
                    </Form.Group>
                    : <></>
            }

            <Form.Group className='mb-3'>
                <Form.Label>Author</Form.Label>
                {!page && isAdmin ? <Form.Floating>You cannot modify author of page during creation.</Form.Floating> : <></>}
                <Form.Select name="author" value={authorId} onChange={ev => setAuthorId(ev.target.value)} disabled={!isAdmin || !page} >
                    {
                        users.map((user) => <option value={user.id} key={user.id} >{user.name} - {user.username}</option >)
                    }
                </Form.Select>
            </Form.Group>

            <Form.Group className='mb-3'>
                <Form.Label>Creation Date</Form.Label>
                {!page && isAdmin ? <Form.Floating>You cannot modify creation date.</Form.Floating> : <></>}
                <Form.Control type="date" name="creationDate" value={page && page.creationDate ? page.creationDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')} disabled={true} />
            </Form.Group>

            <Form.Group className='mb-3'>
                <Form.Label>Publish or program</Form.Label>
                <Form.Check type="switch" name="published" checked={published} onChange={ev => setPublished(p => !p)} />
            </Form.Group>

            {
                published ?
                    <Form.Group className='mb-3'>
                        <Form.Label>Publish Date</Form.Label>
                        <Form.Control type="date" name="publishDate" value={publishDate} onChange={ev => setPublishDate(ev.target.value)} />
                    </Form.Group>
                    : <></>
            }

            <ButtonGroup>
                <Button type='submit' variant="primary" disabled={!handle} >{action}</Button>
                <Button variant='danger' onClick={() => navigate(-1)}>Cancel</Button>
            </ButtonGroup>

        </Form>
    );

}


function PageForm(props) {
    const navigate = useNavigate();
    const { handleErrors, handleGenericNotification } = useContext(ErrorContext);
    const { user, loadTitle, loadPages } = useContext(StatusContext);
    const { pageId } = useParams(); // 1,2...undefined

    const [users, setUsers] = useState([]);
    const [placeholders, setPlaceholders] = useState([]);

    const [page, setPage] = useState(undefined);
    const [blocks, setBlocks] = useState([]);
    const [newBlocks, setNewBlocks] = useState(0);
    const [loading, setLoading] = useState(true);

    const isAdmin = user.role === 'admin';

    useEffect(() => {
        const promises = [];
        setNewBlocks(0);
        loadTitle();

        setLoading(true);
        //Sincronizza le modifiche condotte da altri utenti 
        loadPages();

        promises.push(API.getPlaceholders());
        promises.push(isAdmin ? API.getUsers() : null);
        promises.push(pageId ? API.getPageById_auth(pageId) : null);

        Promise.all(promises)
            .then(([placeholders, users, page]) => {
                setPlaceholders(placeholders);
                if (users) setUsers(users); else setUsers([user]);
                if (pageId) { setPage(page); setBlocks([...page.blocks]); }
                else { setPage(undefined); setBlocks([]); }
                setLoading(false);
            }).catch(err => {
                handleErrors([err]);
                navigate('/back-office');
            });

    }, [parseInt(pageId)]);

    const updatePage = async (update) => {
        const errors = [];
        const draftBlocks = blocks.filter(b => b.property && b.property === 'success').length;

        if (draftBlocks > 0) {
            errors.push(`Please confirm or remove draft (green) blocks. There are ${draftBlocks} draft blocks.`);

        }

        const editedBlocks = blocks.filter(b => b.property && b.property === 'warning').length;
        const confirmedBlocks = blocks.filter(b => b.property && b.property === 'info').length;

        const deletedBlocks = blocks.filter(b => b.property && b.property === 'danger').length;
        if (deletedBlocks > 0) {
            errors.push(`Please restore or remove deleted (red) blocks. There are ${deletedBlocks} deleted blocks.`);

        }

        if (errors.length > 0) {
            handleGenericNotification(errors, 'info');
            return;
        }

        const blocksUpdate = [];
        blocks.filter(b => !(b.property && b.property === 'danger'))
                .forEach((block, index) => {
                    blocksUpdate.push({
                        ...block,
                        position: index
                    })
                });

        try {

            const pageUpdate = {
                ...update,
                blocks: [...blocksUpdate]
            };

            const pageUpdated = await props.updatePage(pageUpdate);
            setPage(pageUpdated);
            setBlocks([...pageUpdated.blocks]);
        } catch (err) {
            //navigate('/back-office');
        }

    }

    const createPage = async (create) => {

        const draftBlocks = blocks.filter(b => b.property && b.property === 'success').length;
        if (draftBlocks > 0) {
            handleGenericNotification([`Please confirm or remove draft (green) blocks. There are ${draftBlocks} draft blocks.`], 'info');
            return;
        }

        const pageCreate = {
            ...create,
            blocks: [...blocks]
        };

        try {
            const createdPage = await props.createPage(pageCreate);
            navigate('/back-office/edit/' + createdPage.id);
        } catch (e) {
            return;
        }

    }

    const updateBlock = (update) => {

        const property = (update.newBlock && update.newBlock >= 1) ? 'info' : 'warning';

        const updateBlock = {
            ...update,
            property: property,
        };

        setBlocks(old => {
            return [...old].map(b => b.position === updateBlock.position ? updateBlock : b);
        });

    };

    const deleteBlock = (blockPosition) => {

        setBlocks(old => {
            const newList = [...old]
                .map(b => {
                    if (b.position === blockPosition) return {
                        ...b,
                        property: 'danger'
                    };
                    return b;
                });
            return newList;
        });

    };

    const removeBlock = (blockPosition) => {

        setBlocks(old => {
            const newList = [...old]
                .filter(b => b.position !== blockPosition)
                .map(b => {
                    if (b.position > blockPosition) {
                        return {
                            ...b,
                            position: b.position - 1
                        }
                    }
                    return b;
                });
            return newList;
        });

    };

    const modifyPos = (blockPosition, p) => {

        const oldPos = parseInt(blockPosition);
        let newPos = (oldPos + p);

        while (blocks[newPos - 1].property && blocks[newPos - 1].property === 'danger') {
            newPos += p;
            if (newPos <= 0 || newPos > blocks.length) {
                console.log('Invalid position upgrade');
                return;
            }
        }

        setBlocks(old => {
            const newList = [...old].map(b => {

                if (b.position === newPos) {
                    return {
                        ...b,
                        position: oldPos,
                        property: b.property ? b.property : 'warning'
                    }
                }

                if (b.position === oldPos) {
                    return {
                        ...b,
                        position: newPos,
                        property: b.property ? b.property : 'warning'
                    }
                }

                return b;
            });
            return newList.sort((b1, b2) => b1.position - b2.position);
        });
    };

    const insertBlock = () => {

        setBlocks(old => {

            const newBlock = {
                position: 1,
                property: 'success',
                newBlock: newBlocks + 1,
                pageId: pageId ? parseInt(pageId) : -1,
                content: new String('')
            };

            setNewBlocks(old => (old + 1));

            const newList = [...old]
                .map(b => Object({
                    ...b,
                    position: b.position + 1
                }));

            return [newBlock, ...newList];
        });

    };

    return (
        loading ? <LoadingLottie /> : <Container >
            <UpdateCreateForm page={page} action={pageId ? 'Update' : 'Create'}
                updatePage={updatePage} 
                createPage={createPage} 
                isAdmin={isAdmin} users={users} />
            <br></br>
            <hr></hr>
            <div>

                <br></br>
                {
                    blocks.length > 0 ? <>
                        <h4 className='text-danger'>Remember to update. If you don't update the page you lost blocks update.</h4>
                    </> :
                        <></>
                }

                <div>

                    <ListGroup >
                        <ListGroupItem key={'blocksHeader'}>
                            <Row>
                                <Col>
                                    <Button variant='primary' onClick={insertBlock} >
                                        < i className="bi bi-database-add"></i>
                                        {" "}
                                        Add new block
                                    </Button>
                                </Col>
                                <Col className='col-auto'>
                                    <ButtonGroup >
                                        <Button variant='success'>Draft blocks: {blocks.filter(b => b.property && b.property === 'success').length}</Button>
                                        <Button variant='warning'>Edited blocks: {blocks.filter(b => b.property && b.property === 'warning').length}</Button>
                                        <Button variant='info'>Confirmed blocks: {blocks.filter(b => b.property && b.property === 'info').length}</Button>
                                        <Button variant='danger'>Deleted blocks: {blocks.filter(b => b.property && b.property === 'danger').length}</Button>
                                    </ButtonGroup>
                                </Col>
                            </Row>
                        </ListGroupItem>
                        {
                            blocks.map(block => {
                                //se inserisco come key la position non viene eseguito il render in quanto non varia
                                //in quanto i componenti sono sempre ordinati per posizione
                                const key = block.id ? block.id : `_newBlock_${block.newBlock}`;

                                return (
                                    <ListGroupItem key={key} variant={block.property}>
                                        <BlockForm block={block}
                                            placeholders={placeholders}
                                            up={block.position > 1 ? () => modifyPos(block.position, -1) : undefined}
                                            down={block.position < blocks.length ? () => modifyPos(block.position, +1) : undefined}
                                            updateBlock={updateBlock}
                                            deleteBlock={() => deleteBlock(block.position)}
                                            removeBlock={() => removeBlock(block.position)}
                                            action={'Confirm'}
                                        />
                                    </ListGroupItem>
                                );
                            }

                            )
                        }
                    </ListGroup>
                </div>

            </div>


        </Container>
    );

}

export default PageForm;