import { Routes, Route } from 'react-router-dom';
import HeroBanner from './HeroBanner.jsx';
import { Options } from './Options.jsx';

import Meditate from './pages/Meditate.jsx';
import SelfCare from './pages/SelfCare.jsx';
import AnxietyRelief from './pages/AnxietyRelief.jsx';
import AttentionBoost from './pages/AttentionBoost.jsx';
import BabySleep from './pages/BabySleep.jsx';


export const App=()=> {
  return (
    <div>
      <Routes>
        {/* Home Page */}
        <Route path="/" element={
          <>
            <HeroBanner />
            <Options />
          </>
        } />

        {/* Individual Routes */}
        <Route path="/meditate" element={<Meditate />} />
        <Route path="/selfcare" element={<SelfCare />} />
        <Route path="/anxietyrelief" element={<AnxietyRelief />} />
        <Route path="/attentionboost" element={<AttentionBoost />} />
        <Route path="/babysleep" element={<BabySleep />} />
      </Routes>
    </div>
  );
}



