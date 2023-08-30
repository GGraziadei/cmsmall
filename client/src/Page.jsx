import dayjs from 'dayjs';
import { React, useContext, useEffect, useState } from 'react';
import { Container, Card, CardGroup, Button} from 'react-bootstrap';
import ErrorContext from './contexts/ErrorContext';
import API from './api/API';
import { LoadingLottie } from './lotties/Lotties';
import { Link, useNavigate, useParams } from "react-router-dom";
import { block2content } from './api/helpers';
import StatusContext from './contexts/StatusContext';

const BlockCard = (props) => {
    const { block } = props;

    return (
        <CardGroup>
            <Card.Title />
            <Card.Body>
                {
                    block2content(block)
                }
            </Card.Body>
            <Card.Footer />
        </CardGroup>);
}

const Page = (props) => {

    const { page, pageBlocks } = props;

    return (
        <Container >
            <h1>{page.title}</h1>
            <h4>{page.author} - {page.publishDate ? page.publishDate.format('DD MMMM YYYY') : 'notPublished'} 
                {" "}<span className="badge bg-secondary">{page.status}</span>
            </h4>
            <hr></hr>


            <Container>
                {
                    pageBlocks.map((block) =>
                        <div key={block.id}>
                            < BlockCard block={block} />
                        </div>
                    )
                }
                <br></br>
            </Container>
            <hr></hr>
            <p>&copy; {dayjs().format('YYYY') + " " + page.author}</p>
        </Container>
    );
}

function PagePublicPreview() {

    const { slug } = useParams();
    const [page, setPage] = useState(undefined);
    const [loading, setLoading] = useState(true);
    const {loadTitle} = useContext(StatusContext);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        loadTitle();
        API.getPageBySlug_public(slug)
            .then(p => {
                setPage(p);
                setLoading(false);
            }).catch(err => {
                console.log(err);
                setLoading(false);
                navigate('/404');
            });
    }, [slug]);

    return (loading ? <LoadingLottie /> : <>
        
        <Page page={page} pageBlocks={page.blocks} />
        <Container>
            <Button onClick={() => navigate('/front-office')}>Homepage</Button>
        </Container>
    </>);
}

function PageBackOfficePreview(props) {

    const { pageId } = useParams();
    const [page, setPage] = useState(undefined);
    const [pageBlocks, setPageBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { handleErrors } = useContext(ErrorContext);
    const {loadTitle,loadPages} = useContext(StatusContext);

    useEffect(() => {
        setLoading(true);
        loadTitle();
        loadPages();
        API.getPageById_auth(pageId)
            .then(p => {
                setPage(p);
                setPageBlocks(p.blocks);
                setLoading(false);
            }).catch(err => {
                setLoading(false);
                navigate('back-office');
                handleErrors([err]);
            });
    }, [pageId]);

    return (loading ? <Container>  <LoadingLottie /> </Container> : <Page page={page} pageBlocks={pageBlocks} />);
}

const PageCard = (props) => {
    const { page } = props;

    return (<CardGroup>
        <Card.Title>
            <Link to={"page/" + page.slug}>
                {page.title}
            </Link>
        </Card.Title>
        <Card.Body>

            <p>{page.publishDate ? page.publishDate.format('DD MMMM YYYY') : 'notPublished'}</p>
        </Card.Body>
        <Card.Footer className="justify-content-end">

            <span className="badge bg-primary">{page.author}</span>
        </Card.Footer>
    </CardGroup>);
}

const PageMeta = (props) => {
    const { page } = props;

    return (<>
        <h5>
            {page.title} <span className="badge bg-primary">{page.status}</span>
        </h5>

        <p>
            Data Creazione: {page.creationDate.format('YYYY-MM-DD')}
            {
                page.publishDate ? <><br></br>Data Pubblicazione: {page.publishDate.format('YYYY-MM-DD')}</> : <></>
            }

            <br></br>
            Autore: {page.author}
        </p>
    </>)
}

export { PagePublicPreview, PageBackOfficePreview, PageCard, BlockCard, Page, PageMeta };