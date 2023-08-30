import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoadingPage, MyAlert, NotFoundPage } from './Miscellaneous';
import { useEffect, useState } from 'react';
import ErrorContext from './contexts/ErrorContext';
import StatusContext from './contexts/StatusContext';
import { Container } from 'react-bootstrap/';
import LoginForm from './forms/LoginForm';
import { BackOfficeDefaultLayout, DefaultLayout, FrontOfficeDefaultLayout, Homepage, WelcomePage } from './PageLayout';
import { PageBackOfficePreview, PagePublicPreview } from './Page';
import API from './api/API';
import PageForm from './forms/PageForm';
import { changeItemProperty } from './api/helpers';
import SettingsForm from './forms/SettingsForm';

const Main = () => {

  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertData, setAlertData] = useState({ messages: [], property: 'danger' });

  const [title, setTitle] = useState('CMSmall');

  const loadTitle = () => {
    console.log('load title');
    API.getTitle()
      .then(title => { setTitle(title); document.title = title.title; })
      .catch(err => handleErrors([err]));
  }

  const updateTitle = async (newTitle) => {

    try {
      const changes = await API.setTitle(newTitle);
      console.log('Updates : ' + changes);
      loadTitle();
    } catch (err) {
      handleErrors([err]);
      return false;
    }

    handleGenericNotification(['Title update Completed'], 'success');

    return true;
  }

  const handleErrors = (e) => {
    /*Errors formatting*/
    const errorsList = e.map(err => {
      if (err.error) return err.error;
      else if (typeof err === 'string') return String(err);
      else return "Unknown Error, see console log for details";
    });

    setAlertData({
      messages: errorsList,
      property: 'danger'
    });

  }

  const handleGenericNotification = (e, property) => {

    setAlertData({
      messages: e,
      property: property
    });

  }

  const dismissNotification = () => {

    setAlertData({
      messages: [],
      property: 'danger'
    });

  }

  const doLogIn = async (credentials) => {
    setLoading(true);

    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
      const pages = await API.getAllPages_auth();
      setPages(pages);
      setLoading(false);
    }
    catch (error) {
      handleErrors([error]);
      setLoading(false);
    }


  }

  const doLogOut = async () => {
    try {
      setLoading(true);
      await API.logOut();
      setLoggedIn(false);
      setPages([]);
      setUser(undefined);
      navigate('/');
      setLoading(false);
    } catch (error) {
      debugger;
      handleErrors([error]);
      setLoading(false);
    }
  }

  const checkAlreadyAuth = async () => {

    try {
      const user = await API.getUserInfo();
      setLoading(true);
      const pages = await API.getAllPages_auth();
      setPages(pages);
      setLoggedIn(true);
      setUser(user);
      setLoading(false);
    } catch (err) {
      //handleErrors([err]);
    }

  }

  const deletePage = async (pageId) => {

    setPages(oldList => changeItemProperty(oldList, pageId, 'danger'));

    try {
      const res = await API.deletePage(pageId);
      console.log("Delete page " + pageId);
      setPages(oldList => {
        const newList = [...oldList];
        return newList.filter(p => p.id !== pageId);
      });
      handleGenericNotification(['Page deleted'], 'success');
      navigate('/back-office');
    }
    catch (err) {
      console.log('error');
      handleErrors([err]);
      setPages(oldList => changeItemProperty(oldList, pageId, ''));
    }

  }

  const updatePage = async (page) => {
    const pageId = page.id;
    setPages(oldList => changeItemProperty(oldList, pageId, 'warning'));

    let errors = false;

    try {
      const changes = await API.updatePage(page);
      console.log('Updates : ' + JSON.stringify(changes));
      handleGenericNotification(['Update Completed'], 'success');
    } catch (err) {
      handleErrors([err]);
      errors = true;
    } finally {
      const pageUpdated = await API.getPageById_auth(pageId);
      /*Update page list with correct updated version*/
      setPages(oldList => {
        const newList = [...oldList];
        return newList.map(p => p.id === pageId ? pageUpdated : p);
      });
      if(errors) throw page;
      else return pageUpdated;
    }
    
  }

  const createPage = async (page) => {

    try {
      const changes = await API.createPage(page);
      console.log('Created page : ' + changes.pageId);
      for (const blockId of changes.blockIds) {
        console.log('Created block : ' + blockId);
      }
      const pageCreated = await API.getPageById_auth(changes.pageId);
      /*Update page list with correct updated version*/
      setPages(oldList => [pageCreated, ...oldList]);
      handleGenericNotification(['Page created.'], 'success');
      return pageCreated;
    } catch (err) {
      handleErrors([err]);
      return undefined;
    }
  }

  const loadPages = () => {

    console.log('load pages');

    API.getAllPages_auth()
      .then(pages => setPages(pages))
      .catch(err => handleErrors([err]));

  }

  useState(() => {
    checkAlreadyAuth();
    loadTitle();
  }, []);

  return (
    <StatusContext.Provider value={{ user, title, doLogIn, doLogOut, loadTitle, loadPages }}>
      <Container fluid className='App'>
        <ErrorContext.Provider value={{ handleErrors, handleGenericNotification }}>
          <Routes>

            <Route element={loading ? <LoadingPage /> : <DefaultLayout />}>
              <Route path='back-office' element={loggedIn ?
                <BackOfficeDefaultLayout pages={pages} deletePage={deletePage} />
                : <Navigate replace to='/login' />} >
                <Route index element={<WelcomePage />} />
                <Route path='edit/:pageId' element={<PageForm updatePage={updatePage} />} />
                <Route path='add' element={<PageForm createPage={createPage} />} />
                <Route path='preview/:pageId' element={<PageBackOfficePreview />} />
                <Route path='settings' element={<SettingsForm title={title} updateTitle={updateTitle} />} />
              </Route>

              <Route path="/" element={<FrontOfficeDefaultLayout />} >
                <Route index element={<Homepage />} />
                <Route path='page/:slug' element={<PagePublicPreview />} />
              </Route>
              <Route path="login" element={loggedIn ? <Navigate replace to='/back-office' /> : <LoginForm />} />
              <Route path="front-office" element={<Navigate replace to='/' />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorContext.Provider>
      </Container>
      {
        alertData.messages.length > 0 ?
          <Container className='fixed-bottom'>
            <MyAlert messages={alertData.messages} property={alertData.property} dismiss={dismissNotification}/>
          </Container> : <></>
      }

    </ StatusContext.Provider >
  );
}

function App() {

  return (<>

    <BrowserRouter>
      <Main />
    </BrowserRouter>

  </>
  );
}

export default App
