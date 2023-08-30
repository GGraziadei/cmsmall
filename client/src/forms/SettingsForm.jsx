import { useContext, useEffect, useState } from 'react';
import { Button, ButtonGroup, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ErrorContext from '../contexts/ErrorContext';
import validator from 'validator';
import StatusContext from '../contexts/StatusContext';

function SettingsForm(props) {
    const { title, updateTitle } = props;
    
    const { handleErrors } = useContext(ErrorContext);
    const {loadTitle} = useContext(StatusContext);
    useEffect(loadTitle, []);
    const navigate = useNavigate();

    const [nTitle, setNTitle] = useState(title.title);

    const reset = () => setNTitle(title.title);
    const handleSubmit = (event) => {
        
        event.preventDefault();

        if(validator.isEmpty(nTitle)){
            handleErrors(["Insert a valid title."]);
            return;
        }

        updateTitle(nTitle);

    };

    return (
        <Container>
            <Form onSubmit={handleSubmit}>

                <Form.Group className='mb-3'>
                    <Form.Label>Title</Form.Label>
                    <Form.Floating>Last update by: {title.author.name} - {title.author.email}</Form.Floating>
                    <Form.Control type="text" name="title" value={nTitle} onChange={ev => setNTitle(ev.target.value)} />
                </Form.Group>

                <ButtonGroup>
                    {nTitle !== title.title ?
                        <>
                            <Button type='submit' variant="primary">Save</Button>
                            <Button variant='warning' onClick={() => reset()}>Reset</Button>
                        </>  : <></>}
                    <Button variant='danger' onClick={() => navigate('/back-office')}>Cancel</Button>
                </ButtonGroup>

            </Form>
        </Container>
    );

}

export default SettingsForm;