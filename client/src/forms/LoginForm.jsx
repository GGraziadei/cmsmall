import { Form, Button, Container, Row, Col, Navbar, ListGroup, ListGroupItem } from 'react-bootstrap';
import { useState, useContext } from 'react';
import StatusContext from '../contexts/StatusContext';
import validator from "validator";
import ErrorContext from '../contexts/ErrorContext';
import { LoadingPage } from '../Miscellaneous';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
    const [username, setUsername] = useState('admin@test.com');
    const [password, setPassword] = useState('pwd');
    const [loading, setLoading ] = useState(false);

    const { doLogIn } = useContext(StatusContext);
    const {handleErrors} = useContext(ErrorContext);

    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        const trimmedEmail = username.trim();

        const errors = [];

        if (validator.isEmpty(trimmedEmail) || validator.isEmpty(password)) {
            errors.push("Incorrect username and/or password.");
        }

        if (!validator.isEmail(trimmedEmail)) {
            errors.push("Incorrect username and/or password.");
        }

        if (errors.length > 0) {
            handleErrors(errors);
            return;
        }

        const credentials = { username, password };
        doLogIn(credentials);
    };

    return (
        <Container >
            <Row>
                <Col className='below-nav'>
                    <Navbar.Brand onClick={event => { event.preventDefault(); navigate("/"); }}>
                        <h1>
                            <i className="bi bi-balloon-heart" />
                            {" "}
                            Login
                        </h1>
                    </Navbar.Brand>
                    <br></br>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId='username'>
                            <Form.Label>Email</Form.Label>
                            <Form.Control type='email' value={username} onChange={ev => setUsername(ev.target.value)} />
                        </Form.Group>
                        <Form.Group controlId='password'>
                            <Form.Label>Password</Form.Label>
                            <Form.Control type='password' value={password} onChange={ev => setPassword(ev.target.value)} />
                        </Form.Group>
                        <Button className='my-2' type='submit' >Login</Button>
                        <Button className='my-2 mx-2' variant='danger' onClick={() => navigate('/')}>Cancel</Button>
                    </Form>
                    <br></br>

                    {/* Placeholders users */}
                    <ListGroup>
                        <ListGroupItem>
                            Admin Credentials:
                            <ul>
                                <li>username: admin@test.com</li>
                                <li>password: pwd</li>
                            </ul>

                        </ListGroupItem>
                        <ListGroupItem>
                            Author Credentials:
                            <ul>
                                <li>username: author@test.com</li>
                                <li>password: pwd</li>
                            </ul>

                        </ListGroupItem>

                    </ListGroup>
                </Col>
            </Row>
        </Container>
    );
}

export default LoginForm;