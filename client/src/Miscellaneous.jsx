import { Link, useNavigate, useParams } from "react-router-dom";
import { Navbar, Container, Nav, NavLink, ListGroup, Card, CardGroup, Alert, ButtonGroup, Button, Tooltip, OverlayTrigger, ListGroupItem, NavItem, Col, Row } from 'react-bootstrap';
import { useContext, useEffect, useState } from 'react';
import StatusContext from './contexts/StatusContext';
import { LoadingLottie, NotFoundLottie, UpdateLottie } from './lotties/Lotties';
import { userCanOperate } from "./api/helpers";
import { PageMeta } from "./Page";

const NotFoundPage = () => {
    return <>
        <div style={{ "textAlign": "center", "paddingTop": "5rem" }}>
            <NotFoundLottie />
            <p>
                The requested page does not exist, please head back to the <Link to={"/"}>homepage</Link>.
            </p>
        </div>
    </>;
}

const LoadingPage = () => {
    return (<div>
        <div style={{ "textAlign": "center", "paddingTop": "5rem" }}>
            <h1>
                CMSmall. Loading...
            </h1>
            <LoadingLottie />
        </div>

    </div>);
}


const RoutePages = (props) => {

    const { pageId } = useParams();
    const { pages, deletePage, loading } = props;
    const { user } = useContext(StatusContext);
    const navigate = useNavigate();

    return (
        loading ? <LoadingLottie /> :
            <ListGroup>
                <ButtonGroup>
                    <Button variant='primary' onClick={() => navigate('/back-office')}>
                        <i className="bi bi-house"></i>
                        {" "} BackOffice Home
                    </Button>
                    <Button variant='success' onClick={() => {
                        navigate('/back-office/add');
                    }}>
                        <i className="bi bi-file-earmark-plus"></i>
                        {" "} New Page
                    </Button>
                    {
                        user.role === 'admin' ?
                            <Button variant='secondary' onClick={() => navigate('/back-office/settings')} disabled={user.role !== 'admin'}>
                                <i className="bi bi-gear"></i>
                                {" "} Settings
                            </Button>
                            : <></>
                    }
                </ButtonGroup>
                <ListGroup as="ul" className="overflow-auto shadow scroll" >
                    {
                        pages.map(page => {

                            const allowed = userCanOperate(user, page.authorId);

                            return (
                                <ListGroupItem className="list-group-item" key={page.id}
                                    active={pageId == page.id && page.property === undefined}
                                    variant={page.property && page.property} >
                                    <PageMeta page={page} />
                                    <div className="justify-content-end">
                                        <ButtonGroup>
                                            <OverlayTrigger placement="top"
                                                overlay={!allowed ? <Tooltip>{`${user.name} has not permissions to edit page ${page.id}`}</Tooltip> : <Tooltip>{`Edit page ${page.id}`}</Tooltip>}>
                                                <Button variant={!allowed ? 'light' : 'warning'}
                                                    onClick={() => {
                                                        if (userCanOperate(user, page.authorId)) {
                                                            navigate('edit/' + page.id);
                                                        }
                                                        return;
                                                    }}
                                                >
                                                    {allowed ? <i className="bi bi-pencil-square"></i> : <i className="bi bi-slash-circle"></i>}
                                                </Button>
                                            </OverlayTrigger>

                                            <OverlayTrigger placement="top"
                                                overlay={!allowed ? <Tooltip>{`${user.name} has not permissions to delete page ${page.id}`}</Tooltip> : <Tooltip>{`Delete page ${page.id}`}</Tooltip>}>
                                                <Button variant={!allowed ? 'light' : 'danger'}
                                                    onClick={() => {
                                                        if (userCanOperate(user, page.authorId)) deletePage(page.id);
                                                        return;
                                                    }}
                                                >
                                                    {allowed ? <i className="bi bi-trash"></i> : <i className="bi bi-slash-circle"></i>}
                                                </Button>
                                            </OverlayTrigger>

                                            <OverlayTrigger overlay={<Tooltip>{`BackOffice preview for page ${page.id}`}</Tooltip>}>
                                                <Button variant='primary'
                                                    onClick={() => { navigate('preview/' + page.id); }}
                                                >
                                                    <i className="bi bi-book"></i>
                                                </Button>
                                            </OverlayTrigger>


                                        </ButtonGroup>

                                    </div>
                                </ListGroupItem>);
                        })
                    }
                </ListGroup>
            </ListGroup>

    )
}

const MyNavbar = () => {
    const navigate = useNavigate();
    const { user, doLogOut } = useContext(StatusContext);

    return (
        <Navbar className="shadow mr-1 ml-1 " fixed={"top"} bg="light" style={{ "marginBottom": "2rem" }}>
            <Container>
                <Navbar.Brand onClick={event => { event.preventDefault(); navigate("/"); }}>
                    <i className="bi bi-balloon-heart" />
                    {" "}
                    CMSmall
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mx-auto">

                        {
                            user ?
                                <>
                                    <Nav.Link href="/page/*" onClick={event => { event.preventDefault(); navigate('/front-office'); }} >FrontOffice </Nav.Link>
                                    <Nav.Link href="/back-office/*" onClick={event => { event.preventDefault(); navigate('/back-office'); }} >BackOffice </Nav.Link>
                                </>
                                : <>
                                    <Nav.Link href="" onClick={event => { event.preventDefault(); navigate('/front-office'); }} >Home </Nav.Link>

                                </>
                        }
                    </Nav>
                    <Nav className="ml-auto">

                        {
                            user ?
                                <>
                                    <Navbar.Text>
                                        Hi {user.name} <span className="badge bg-primary">{user.role}</span>{" "}
                                    </Navbar.Text>
                                    <Nav.Link onClick={event => { event.preventDefault(); doLogOut(); }} >Logout</Nav.Link>
                                </>

                                :
                                <Nav.Link href="/login" onClick={event => { event.preventDefault(); navigate("/login"); }}>
                                    Login
                                    {" "}
                                    <i className="bi bi-person-fill" />
                                </Nav.Link>
                        }

                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

const MyAlert = (props) => {

    const { messages, property, dismiss } = props;

    const [show, setShow] = useState(true);

    return (
        show ?
            <Alert variant={property || 'danger'} dismissible={true} onClose={dismiss} >
                <Row>
                    <Col className='col-8'>
                        <ul>
                            {
                                messages.length > 1 ? messages.map((e, k) =>
                                    <li key={k}>{e}</li>
                                ) : <p>{messages[0]}</p>
                            }
                        </ul>
                    </Col>
                    <Col className='col-4'>
                        <UpdateLottie />
                    </Col>
                </Row>
            </Alert> : <></>
    );
}





export { NotFoundPage, LoadingPage, MyNavbar, RoutePages, MyAlert };
