import { React, useContext, useEffect, useState } from 'react';
import { Row, Col, Container, ListGroup, ListGroupItem } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import { LoadingPage, MyNavbar, RoutePages } from './Miscellaneous';
import ErrorContext from './contexts/ErrorContext';
import API from './api/API';
import { WelcomeLottie } from './lotties/Lotties';
import { PageCard } from './Page';
import StatusContext from './contexts/StatusContext';


function DefaultLayout(props) {

    return (
        <Row >
            <MyNavbar />
            <div className="below-nav n-scroll">
                <Outlet />
            </div>
        </Row>
    );
}

function BackOfficeDefaultLayout(props) {

    const { pages, deletePage, loading } = props;
    
    return (
        <Row >
            <Col md={5} xl={4} bg="light" id="left-sidebar" >
                <RoutePages pages={pages} deletePage={deletePage} loading={loading}/>
            </Col>
            <Col md={7} xl={8} className='scroll' >
                <Outlet />
            </Col>
        </Row>
    );

}

function FrontOfficeDefaultLayout() {
    return (
            <Row className=' scroll vh-100'>
                <Outlet />
            </Row>
    );

}


function WelcomePage() {

    const { user } = useContext(StatusContext);
    const {loadTitle} = useContext(StatusContext);

    useEffect(loadTitle, []);

    return (
        <Container >
            <WelcomeLottie />
            <p>Hello {user.name}, you are logged in as {user.role}</p>
        </Container>);
}

function Homepage() {

    const { handleErrors } = useContext(ErrorContext);
    const {loadTitle} = useContext(StatusContext);
    const [loading, setLoading] = useState(true);
    const [pages, setPages] = useState([]);

    useEffect(() => {
        loadTitle();
        API.getAllPublishedPages_public()
            .then(pages => {
                setPages(pages);
                setLoading(false);
            }).catch(err => {
                setLoading(false);
                handleErrors([err]);
            });
    }, []);

    return (
        <Container >

            {
                loading ? <LoadingPage /> : <>
                    <WelcomeLottie />
                    <div >
                        <ListGroup>
                            {
                                pages.map(p => {

                                    return (
                                        <ListGroupItem key={p.id}>
                                            <PageCard page={p} />
                                        </ListGroupItem>
                                    );

                                })
                            }
                        </ListGroup>
                    </div>
                </>
            }

        </Container>);
}




export { DefaultLayout, BackOfficeDefaultLayout, WelcomePage, Homepage, FrontOfficeDefaultLayout }; 
