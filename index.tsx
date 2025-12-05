
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Activity, Brain, Dna, Skull, Scroll, Terminal, AlertTriangle, ChevronRight, Save, RefreshCw, HelpCircle, Dice5, User, MapPin, Clapperboard, Briefcase, FileText, X, Menu } from 'lucide-react';

// --- Types ---

type Stat = 'STR' | 'CON' | 'DEX' | 'INT' | 'POW' | 'CHA';

interface Agent {
  id: string;
  name: string;
  profession: string;
  description: string;
  stats: Record<Stat, number>;
  derived: {
    hp: { current: number; max: number };
    wp: { current: number; max: number };
    san: { current: number; max: number; break: number };
  };
  skills: string[];
  gear: string[];
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'narrative' | 'mythic' | 'system' | 'combat' | 'alert';
  content: string;
  details?: string;
}

type Odds = 'Impossible' | 'No Way' | 'Unlikely' | '50/50' | 'Likely' | 'Sure Thing' | 'Has To Be';

// --- Constants & Data ---

const INITIAL_AGENTS: Agent[] = [
  {
    id: 'jack',
    name: 'Jack Robbins',
    profession: 'Police Detective',
    description: '38 y/o. Sturdy build, weary eyes. Wears cheap suits. Smells of coffee.',
    stats: { STR: 13, CON: 13, DEX: 12, INT: 12, POW: 11, CHA: 11 },
    derived: {
      hp: { current: 13, max: 13 },
      wp: { current: 11, max: 11 },
      san: { current: 55, max: 99, break: 44 },
    },
    skills: ['Firearms 50%', 'Humint 60%', 'Law 40%', 'Search 50%', 'Unarmed 50%'],
    gear: ['Glock 17', 'Badge & ID', 'Kevlar Vest', 'Handcuffs', 'Unmarked Sedan']
  },
  {
    id: 'tom',
    name: 'Tom Marteen',
    profession: 'Paramedic',
    description: '29 y/o. Lean, nervous energy. Practical dress (cargo pants, hoodies).',
    stats: { STR: 10, CON: 11, DEX: 12, INT: 15, POW: 14, CHA: 10 },
    derived: {
      hp: { current: 11, max: 11 },
      wp: { current: 14, max: 14 },
      san: { current: 70, max: 99, break: 56 },
    },
    skills: ['First Aid 60%', 'Medicine 50%', 'Pharmacy 40%', 'Science (Biology) 40%'],
    gear: ['Trauma Bag', 'Nitrile Gloves', 'Headlamp', 'Multi-tool', 'Personal SUV']
  },
  {
    id: 'paul',
    name: 'Paul Smith',
    profession: 'Historian',
    description: '45 y/o. Soft build, glasses, tweed jackets. Professor at U of Chicago.',
    stats: { STR: 9, CON: 10, DEX: 10, INT: 17, POW: 14, CHA: 12 },
    derived: {
      hp: { current: 10, max: 10 },
      wp: { current: 14, max: 14 },
      san: { current: 70, max: 99, break: 56 },
    },
    skills: ['History 70%', 'Occult 50%', 'Language (Latin) 50%', 'Research 60%'],
    gear: ['Laptop', 'Voice Recorder', 'Notebook', 'Library Keycard', 'Volvo Station Wagon']
  }
];

const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'init-1',
    timestamp: '09:00',
    type: 'system',
    content: 'Secure connection established. Decrypting mission packet...'
  },
  {
    id: 'init-2',
    timestamp: '09:01',
    type: 'narrative',
    content: 'BRIEFING: Operation VISCID GLIMMER\n\nTARGET: Elias Vance (Grad Student, U of Chicago).\nSTATUS: Missing (48hrs).\n\nDETAILS: Vance was researching "Hyper-geometry in Pre-Columbian Architecture." Local PD report he is a runaway, but responding officer reported nausea and disorientation upon entering Vance\'s apartment. Apartment contains strange charcoal scrawls.\n\nOBJECTIVES:\n1. Locate Vance.\n2. Assess potential unnatural threat.\n3. Contain/Sanitize.'
  }
];

const ODDS_MAP: Record<Odds, number> = {
  'Impossible': -2,
  'No Way': -1,
  'Unlikely': 0, // Base low
  '50/50': 1,    // Base mid
  'Likely': 2,
  'Sure Thing': 3,
  'Has To Be': 4,
};

// Mythic Fate Chart Logic (Simplified 2nd Edition Logic for UI)
const getFateProbability = (chaos: number, odds: Odds): number => {
  // Base probability map (Chaos Rank 5)
  const baseProbs: Record<Odds, number> = {
    'Impossible': 10,
    'No Way': 25,
    'Unlikely': 45,
    '50/50': 50,
    'Likely': 65,
    'Sure Thing': 85,
    'Has To Be': 95,
  };
  
  let prob = baseProbs[odds];
  
  // Chaos modifier: For every point above 5, +5% to YES. Below 5, -5% to YES.
  const modifier = (chaos - 5) * 5;
  prob += modifier;

  // Clamp
  return Math.max(5, Math.min(95, prob));
};

// --- Components ---

const AgentCard: React.FC<{ agent: Agent; updateAgent: (a: Agent) => void }> = ({ agent, updateAgent }) => {
  const [expanded, setExpanded] = useState(false);

  const adjustStat = (type: 'hp' | 'wp' | 'san', val: number) => {
    const newAgent = { ...agent };
    newAgent.derived[type].current = Math.max(0, Math.min(newAgent.derived[type].max, newAgent.derived[type].current + val));
    updateAgent(newAgent);
  };

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 mb-4 shadow-lg transition-all duration-200 relative group">
      <div 
        className="flex justify-between items-start mb-2 cursor-pointer hover:bg-slate-700/50 rounded p-1 -m-1"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 className="text-lg font-bold text-emerald-400">{agent.name}</h3>
          <p className="text-xs text-slate-400 uppercase tracking-wider">{agent.profession}</p>
        </div>
        <User className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs font-mono text-slate-300">
        <div className="bg-slate-900 p-1 rounded" title="Strength">STR {agent.stats.STR}</div>
        <div className="bg-slate-900 p-1 rounded" title="Constitution">CON {agent.stats.CON}</div>
        <div className="bg-slate-900 p-1 rounded" title="Dexterity">DEX {agent.stats.DEX}</div>
        <div className="bg-slate-900 p-1 rounded" title="Intelligence">INT {agent.stats.INT}</div>
        <div className="bg-slate-900 p-1 rounded" title="Power">POW {agent.stats.POW}</div>
        <div className="bg-slate-900 p-1 rounded" title="Charisma">CHA {agent.stats.CHA}</div>
      </div>

      <div className="space-y-2">
        {/* HP */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center text-red-400 w-16 font-bold" title="Hit Points"><Activity className="w-3 h-3 mr-1" /> HP</span>
          <div className="flex items-center gap-2">
             <button onClick={() => adjustStat('hp', -1)} className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-red-900 rounded text-slate-200">-</button>
             <span className="w-12 text-center font-mono">{agent.derived.hp.current} / {agent.derived.hp.max}</span>
             <button onClick={() => adjustStat('hp', 1)} className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-emerald-900 rounded text-slate-200">+</button>
          </div>
        </div>

        {/* WP */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center text-blue-400 w-16 font-bold" title="Willpower Points"><Brain className="w-3 h-3 mr-1" /> WP</span>
          <div className="flex items-center gap-2">
             <button onClick={() => adjustStat('wp', -1)} className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-red-900 rounded text-slate-200">-</button>
             <span className="w-12 text-center font-mono">{agent.derived.wp.current} / {agent.derived.wp.max}</span>
             <button onClick={() => adjustStat('wp', 1)} className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-emerald-900 rounded text-slate-200">+</button>
          </div>
        </div>

        {/* SAN */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center text-purple-400 w-16 font-bold" title="Sanity"><Dna className="w-3 h-3 mr-1" /> SAN</span>
          <div className="flex items-center gap-2">
             <button onClick={() => adjustStat('san', -1)} className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-red-900 rounded text-slate-200">-</button>
             <span className="w-12 text-center font-mono">{agent.derived.san.current} / {agent.derived.san.max}</span>
             <button onClick={() => adjustStat('san', 1)} className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-emerald-900 rounded text-slate-200">+</button>
          </div>
        </div>
        <div className="text-xs text-right text-slate-500 mt-1">Break Point: {agent.derived.san.break}</div>
      </div>
      
      {expanded && (
        <div className="mt-4 pt-2 border-t border-slate-600 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
           <div>
            <p className="text-xs text-slate-400 mb-1 font-bold flex items-center gap-1"><FileText className="w-3 h-3" /> BIO</p>
            <p className="text-xs text-slate-300 italic leading-relaxed">{agent.description}</p>
          </div>
          
          <div>
            <p className="text-xs text-slate-400 mb-1 font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> SKILLS</p>
            <div className="flex flex-wrap gap-1">
              {agent.skills.map((skill, idx) => (
                <span key={idx} className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">{skill}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-1 font-bold flex items-center gap-1"><Briefcase className="w-3 h-3" /> GEAR</p>
            <div className="flex flex-wrap gap-1">
              {agent.gear.map((item, idx) => (
                <span key={idx} className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-400">{item}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!expanded && (
         <div className="mt-2 text-center group-hover:translate-y-1 transition-transform duration-300">
            <ChevronRight className="w-4 h-4 text-slate-600 mx-auto rotate-90" />
         </div>
      )}
    </div>
  );
};

const DeltaGreenApp = () => {
  // --- State ---
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [chaosFactor, setChaosFactor] = useState(5);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [logInput, setLogInput] = useState('');
  const [showHelp, setShowHelp] = useState(true);
  const [activeTab, setActiveTab] = useState<'game' | 'log' | 'agents'>('log'); // Mobile tabs
  
  // Adventure Lists
  const [threads, setThreads] = useState<string[]>(['Operation: VISCID GLIMMER', 'Find Elias Vance']);
  const [npcs, setNpcs] = useState<string[]>(['Handler (Control)']);
  const [locations, setLocations] = useState<string[]>(['Vance\'s Apartment', 'University of Chicago']);
  const [scene, setScene] = useState<string>('Scene 1: The Call (Briefing)');

  const [odds, setOdds] = useState<Odds>('50/50');
  const [fateQuestion, setFateQuestion] = useState('');
  
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom of log on update
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // --- Helpers ---

  const addLog = (type: LogEntry['type'], content: string, details?: string) => {
    const newEntry: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      content,
      details
    };
    setLogs(prev => [...prev, newEntry]);
  };

  const updateAgent = (updatedAgent: Agent) => {
    setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
  };

  // --- Mythic Logic ---

  const handleFateRoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fateQuestion.trim()) return;

    const probability = getFateProbability(chaosFactor, odds);
    const roll = Math.floor(Math.random() * 100) + 1;
    
    // Check Doubles for Random Event
    const rollStr = roll.toString().padStart(2, '0');
    const isDoubles = rollStr[0] === rollStr[1];
    const chaosDigit = parseInt(rollStr[0]); // In 2nd ed, digit must be <= chaos factor
    const randomEvent = isDoubles && chaosDigit <= chaosFactor;

    let result = 'NO';
    if (roll <= Math.ceil(probability * 0.2)) result = 'EXCEPTIONAL YES';
    else if (roll <= probability) result = 'YES';
    else if (roll >= 100 - Math.floor((100 - probability) * 0.2)) result = 'EXCEPTIONAL NO';
    else result = 'NO';

    addLog('mythic', `Q: ${fateQuestion}`, `Odds: ${odds} | Roll: ${roll} vs ${probability}% | Result: ${result}`);
    if (window.innerWidth < 768) setActiveTab('log'); // Switch to log on mobile when action happens

    if (randomEvent) {
      addLog('alert', 'RANDOM EVENT TRIGGERED!', `Doubles rolled (${roll}) under Chaos Factor (${chaosFactor}).`);
      generateRandomEvent();
    }

    setFateQuestion('');
  };

  const generateRandomEvent = () => {
    const focusRoll = Math.floor(Math.random() * 100) + 1;
    let focus = '';
    if (focusRoll <= 7) focus = 'Remote Event';
    else if (focusRoll <= 28) focus = 'NPC Action';
    else if (focusRoll <= 35) focus = 'Introduce New NPC';
    else if (focusRoll <= 45) focus = 'Move Toward a Thread';
    else if (focusRoll <= 52) focus = 'Move Away from a Thread';
    else if (focusRoll <= 55) focus = 'Close a Thread';
    else if (focusRoll <= 67) focus = 'PC Negative';
    else if (focusRoll <= 75) focus = 'PC Positive';
    else if (focusRoll <= 83) focus = 'Ambiguous Event';
    else focus = 'NPC Negative';

    // Simplified meaning tables (Action/Subject)
    const actionRoll1 = Math.floor(Math.random() * 100);
    const actionRoll2 = Math.floor(Math.random() * 100);
    
    addLog('mythic', `EVENT FOCUS: ${focus} (${focusRoll})`, `Context: [Action ${actionRoll1}] + [Subject ${actionRoll2}] (Interpret from table)`);
  };

  const handleDiceRoll = (sides: number) => {
    const result = Math.floor(Math.random() * sides) + 1;
    addLog('system', `Rolled d${sides}: ${result}`);
    if (window.innerWidth < 768) setActiveTab('log'); // Switch to log on mobile
  };

  const handleNarrativeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logInput.trim()) return;
    addLog('narrative', logInput);
    setLogInput('');
  };

  // --- Render ---

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden relative">
      
      {/* Help Overlay */}
      {showHelp && (
        <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-800 border border-slate-600 p-6 rounded-lg shadow-2xl max-w-4xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-emerald-400">INTERFACE GUIDE</h2>
              <button onClick={() => setShowHelp(false)} className="p-1 hover:bg-slate-700 rounded"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-4 border border-blue-500/30 rounded bg-blue-900/10">
                <h3 className="text-lg font-bold text-blue-400 mb-2">LEFT COLUMN</h3>
                <p className="text-sm text-slate-300 mb-2">GAME MECHANICS</p>
                <ul className="text-xs text-slate-400 text-left space-y-2">
                  <li>• <strong>Chaos Factor:</strong> Slider (1-9). Controls randomness.</li>
                  <li>• <strong>Oracle:</strong> Ask "Yes/No" questions about the world.</li>
                  <li>• <strong>Lists:</strong> Track your Threads (Goals) and NPCs.</li>
                </ul>
              </div>

              <div className="p-4 border border-emerald-500/30 rounded bg-emerald-900/10">
                <h3 className="text-lg font-bold text-emerald-400 mb-2">CENTER COLUMN</h3>
                <p className="text-sm text-slate-300 mb-2">NARRATIVE LOG</p>
                <ul className="text-xs text-slate-400 text-left space-y-2">
                  <li>• <strong>History:</strong> Read mission updates and dice results.</li>
                  <li>• <strong>Input:</strong> Type your actions and narrative notes at the bottom.</li>
                  <li>• <strong>System:</strong> See Mythic results and alerts.</li>
                </ul>
              </div>

              <div className="p-4 border border-purple-500/30 rounded bg-purple-900/10">
                <h3 className="text-lg font-bold text-purple-400 mb-2">RIGHT COLUMN</h3>
                <p className="text-sm text-slate-300 mb-2">ACTIVE AGENTS</p>
                <ul className="text-xs text-slate-400 text-left space-y-2">
                  <li>• <strong>Roster:</strong> View health (HP), willpower (WP), and sanity (SAN).</li>
                  <li>• <strong>Expand:</strong> Click an agent to see Skills, Gear, and Bio.</li>
                  <li>• <strong>Edit:</strong> Use + / - buttons to adjust stats during play.</li>
                </ul>
              </div>
            </div>

            <button onClick={() => setShowHelp(false)} className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded transition-colors">
              ENTER OPERATION
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 border-b border-emerald-900/30 p-3 md:p-4 flex items-center justify-between shadow-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Shield className="text-emerald-500 w-6 h-6 md:w-8 md:h-8" />
          <div>
            <h1 className="text-lg md:text-xl font-black tracking-widest text-emerald-500">DELTA GREEN</h1>
            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wide hidden md:block">Operation Manager // Clearance: TOP SECRET</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-xs text-slate-500 uppercase">Operation</span>
            <span className="font-mono text-emerald-400">VISCID GLIMMER</span>
          </div>
          <button 
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded border border-slate-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold hidden md:inline">HELP</span>
          </button>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="md:hidden flex border-b border-slate-800 bg-slate-900">
        <button 
          onClick={() => setActiveTab('game')}
          className={`flex-1 py-3 text-xs font-bold uppercase border-b-2 ${activeTab === 'game' ? 'border-blue-500 text-blue-400 bg-slate-800' : 'border-transparent text-slate-500'}`}
        >
          Game Engine
        </button>
        <button 
          onClick={() => setActiveTab('log')}
          className={`flex-1 py-3 text-xs font-bold uppercase border-b-2 ${activeTab === 'log' ? 'border-emerald-500 text-emerald-400 bg-slate-800' : 'border-transparent text-slate-500'}`}
        >
          Log History
        </button>
        <button 
          onClick={() => setActiveTab('agents')}
          className={`flex-1 py-3 text-xs font-bold uppercase border-b-2 ${activeTab === 'agents' ? 'border-purple-500 text-purple-400 bg-slate-800' : 'border-transparent text-slate-500'}`}
        >
          Agents
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT: Mythic Controls */}
        <div className={`
          w-full md:w-1/4 min-w-[300px] bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-6 overflow-y-auto
          absolute md:relative inset-0 z-10 md:z-0
          ${activeTab === 'game' ? 'block' : 'hidden md:flex'}
        `}>
          
          {/* Chaos Factor */}
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-red-400 uppercase flex items-center gap-2">
                <Activity className="w-4 h-4" /> Mechanics: Chaos
              </h2>
              <span className="text-2xl font-bold font-mono text-white">{chaosFactor}</span>
            </div>
            <input 
              type="range" min="1" max="9" 
              value={chaosFactor} 
              onChange={(e) => setChaosFactor(parseInt(e.target.value))}
              className="w-full accent-red-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Order (1)</span>
              <span>Mayhem (9)</span>
            </div>
          </div>

          {/* Fate Question */}
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h2 className="text-sm font-bold text-blue-400 uppercase mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Oracle: Fate Question
            </h2>
            <form onSubmit={handleFateRoll} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Likelihood (Odds)</label>
                <select 
                  value={odds} 
                  onChange={(e) => setOdds(e.target.value as Odds)}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  {Object.keys(ODDS_MAP).map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Yes/No Question</label>
                <input 
                  type="text" 
                  value={fateQuestion}
                  onChange={(e) => setFateQuestion(e.target.value)}
                  placeholder="Is it locked? Is it trapped?"
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors">
                ASK ORACLE
              </button>
            </form>
          </div>

          {/* Dice Roller */}
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h2 className="text-sm font-bold text-slate-300 uppercase mb-3 flex items-center gap-2">
              <Dice5 className="w-4 h-4" /> Quick Dice
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {[4, 6, 8, 10, 20, 100].map(d => (
                <button 
                  key={d} 
                  onClick={() => handleDiceRoll(d)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-1 rounded text-xs font-mono"
                >
                  d{d}
                </button>
              ))}
            </div>
          </div>

          {/* Lists */}
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
              <h3 className="text-xs font-bold text-amber-500 uppercase mb-2 flex items-center gap-1"><Clapperboard className="w-3 h-3" /> Current Scene</h3>
              <div className="text-sm text-slate-200">{scene}</div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-700 pb-1">Threads</h3>
              <ul className="text-sm space-y-1">
                {threads.map((t, i) => <li key={i} className="text-slate-300 flex items-start"><ChevronRight className="w-4 h-4 text-slate-600 min-w-[16px] mt-0.5" /> {t}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-700 pb-1">NPCs</h3>
              <ul className="text-sm space-y-1">
                {npcs.map((n, i) => <li key={i} className="text-slate-300 flex items-start"><ChevronRight className="w-4 h-4 text-slate-600 min-w-[16px] mt-0.5" /> {n}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-700 pb-1">Locations</h3>
              <ul className="text-sm space-y-1">
                {locations.map((n, i) => <li key={i} className="text-slate-300 flex items-start"><MapPin className="w-4 h-4 text-slate-600 min-w-[16px] mt-0.5" /> {n}</li>)}
              </ul>
            </div>
          </div>

        </div>

        {/* MIDDLE: Log */}
        <div className={`
          flex-1 flex flex-col bg-slate-950 w-full
          absolute md:relative inset-0 z-10 md:z-0
          ${activeTab === 'log' ? 'block' : 'hidden md:flex'}
        `}>
          <div className="p-2 bg-slate-900 border-b border-slate-800 text-center hidden md:block">
             <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mission Log</h2>
          </div>
          <div ref={logContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth">
            {logs.length === 0 && (
              <div className="text-center text-slate-600 mt-20 italic">
                <p>Mission initialized.</p>
                <p>Waiting for input...</p>
              </div>
            )}
            {logs.map((log) => (
              <div key={log.id} className={`p-3 rounded border-l-4 ${
                log.type === 'mythic' ? 'bg-blue-900/10 border-blue-500' :
                log.type === 'system' ? 'bg-slate-800/30 border-slate-500 font-mono text-xs' :
                log.type === 'alert' ? 'bg-red-900/20 border-red-500' :
                'bg-slate-800/20 border-emerald-600'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold uppercase ${
                    log.type === 'mythic' ? 'text-blue-400' : 
                    log.type === 'alert' ? 'text-red-400' :
                    log.type === 'narrative' ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {log.type === 'mythic' ? 'Oracle' : log.type}
                  </span>
                  <span className="text-xs text-slate-600">{log.timestamp}</span>
                </div>
                <div className="text-slate-200 whitespace-pre-wrap">{log.content}</div>
                {log.details && <div className="mt-1 text-xs text-slate-500 font-mono">{log.details}</div>}
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3 md:p-4 bg-slate-900 border-t border-slate-800">
            <form onSubmit={handleNarrativeSubmit} className="flex gap-2">
              <input
                type="text"
                value={logInput}
                onChange={(e) => setLogInput(e.target.value)}
                placeholder="Enter narrative details or notes..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button type="submit" className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 md:px-6 rounded font-bold transition-colors text-sm md:text-base">
                LOG
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: Agents */}
        <div className={`
          w-full md:w-1/4 min-w-[300px] bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto
          absolute md:relative inset-0 z-10 md:z-0
          ${activeTab === 'agents' ? 'block' : 'hidden md:block'}
        `}>
          <h2 className="text-sm font-bold text-emerald-500 uppercase mb-4 flex items-center gap-2 pb-2 border-b border-emerald-900/30">
            <Skull className="w-4 h-4" /> Roster: Active Agents
          </h2>
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} updateAgent={updateAgent} />
          ))}
        </div>

      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<DeltaGreenApp />);
