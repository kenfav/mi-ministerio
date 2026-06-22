import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

// Importamos los iconos
import { homeOutline, statsChartOutline, peopleOutline, mapOutline, calendarOutline } from 'ionicons/icons';

// Importamos nuestras 5 páginas
import Home from './pages/Home';
import Report from './pages/Report';
// import Interested from './pages/Interested';
// import Territory from './pages/Territory';
import Schedule from './pages/Schedule';

/* Core CSS required for Ionic */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonTabs>
        
        {/* Rutas: Qué página cargar según la URL */}
        <IonRouterOutlet>
          <Route exact path="/home"><Home /></Route>
          <Route exact path="/report"><Report /></Route>
          <Route exact path="/schedule"><Schedule /></Route>
          <Route exact path="/"><Redirect to="/home" /></Route>
        </IonRouterOutlet>

        {/* Barra de navegación inferior */}
        <IonTabBar slot="bottom">
          <IonTabButton tab="home" href="/home">
            <IonIcon aria-hidden="true" icon={homeOutline} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>
          
          <IonTabButton tab="report" href="/report">
            <IonIcon aria-hidden="true" icon={statsChartOutline} />
            <IonLabel>Report</IonLabel>
          </IonTabButton>
          
         
          <IonTabButton tab="schedule" href="/schedule">
            <IonIcon aria-hidden="true" icon={calendarOutline} />
            <IonLabel>Schedule</IonLabel>
          </IonTabButton>
        </IonTabBar>

      </IonTabs>
    </IonReactRouter>
  </IonApp>
);

export default App;