import { Routes, Route } from 'react-router-dom';
import HeroBanner from './HeroBanner.jsx';
import { Options } from './Options.jsx';

import Meditate from './pages/Meditate.jsx';
import SelfCare from './pages/SelfCare.jsx';
import AnxietyRelief from './pages/AnxietyRelief.jsx';
import AttentionBoost from './pages/AttentionBoost.jsx';
import BabySleep from './pages/BabySleep.jsx';
import DeadlineTimer from './pages/DeadlineTimer.jsx';
import DeepWork from './pages/DeepWork.jsx';
import GamifyProductivity from './pages/GamifyProductivity.jsx';
import Pomodoro from './pages/Pomodoro.jsx';
import TodoList from './pages/TodoList.jsx';
import WakeUp from './pages/WakeUp.jsx';
import FocusTimer from './pages/FocusTimer.jsx';
import Relax from './pages/Relax.jsx';


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
        <Route path="/deadline-timer" element={<DeadlineTimer/>}/>
        <Route path="/deepwork" element={<DeepWork/>}/>
                <Route path="/focustimer" element={<FocusTimer/>}/>
        <Route path="/gamifyproductivity" element={<GamifyProductivity/>}/>
        <Route path="/pomodoro" element={<Pomodoro/>}/>
                <Route path="/relax" element={<Relax/>}/>
                        <Route path="/todo-list" element={<TodoList/>}/>
                                <Route path="/wakeup" element={<WakeUp/>}/>





      </Routes>
    </div>
  );
}



