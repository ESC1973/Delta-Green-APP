import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Activity, Brain, Dna, Skull, Scroll, Terminal, AlertTriangle, ChevronRight, Save, RefreshCw, HelpCircle, Dice5, User, MapPin, Clapperboard, Briefcase, FileText, X, Menu, Upload, Download, Trash2, List, Plus, Camera, Hexagon, Square, Triangle, Circle } from 'lucide-react';

// --- Types ---

type Stat = 'STR' | 'CON' | 'DEX' | 'INT' | 'POW' | 'CHA';

interface Agent {
  id: string;
  name: string;
  profession: string;
  description: string;
  image?: string; // Base64 image string
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
  type: 'narrative' | 'mythic' | 'system' | 'combat' | 'alert' | 'dialogue';
  content: string;
  details?: string;
}

interface ListItem {
  id: string;
  title: string;
  description: string;
  type: 'thread' | 'npc' | 'location';
}

interface GameState {
  agents: Agent[];
  chaosFactor: number;
  logs: LogEntry[];
  threads: ListItem[];
  npcs: ListItem[];
  locations: ListItem[];
  scene: {
    title: string;
    description: string;
  };
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
    skills: [
      'Alertness 60%', 'Athletics 50%', 'Criminology 50%', 'Dodge 40%', 
      'Drive 50%', 'Firearms 50%', 'Humint 60%', 'Law 40%', 
      'Melee Weapons 50%', 'Persuade 50%', 'Search 50%', 'Unarmed 60%'
    ],
    gear: ['Glock 17', 'Badge & ID', 'Kevlar Vest', 'Handcuffs', 'Unmarked Sedan', 'Smartphone']
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
    skills: [
      'Alertness 50%', 'Biology 40%', 'Bureaucracy 40%', 'Drive 40%', 
      'First Aid 60%', 'Forensics 30%', 'Humint 40%', 'Medicine 50%', 
      'Persuade 40%', 'Pharmacy 40%', 'Search 40%', 'Science (Chemistry) 40%'
    ],
    gear: ['Trauma Bag', 'Nitrile Gloves', 'Headlamp', 'Multi-tool', 'Personal SUV', 'PPE Kit']
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
    skills: [
      'Anthropology 50%', 'Archaeology 50%', 'Bureaucracy 40%', 'History 70%', 
      'Humint 50%', 'Language (Latin) 50%', 'Language (Spanish) 40%', 
      'Occult 50%', 'Persuade 60%', 'Research 60%'
    ],
    gear: ['Laptop', 'Voice Recorder', 'Notebook', 'Library Keycard', 'Volvo Station Wagon']
  }
];

const INITIAL_THREADS: ListItem[] = [
  { id: 't1', type: 'thread', title: 'Operation: VISCID GLIMMER', description: 'Locate Elias Vance and contain the threat.' },
  { id: 't2', type: 'thread', title: 'Find Elias Vance', description: 'Missing 48hrs from U of Chicago. Grad student. Occult ties?' },
  { id: 't3', type: 'thread', title: 'Investigate Hyper-geometry', description: 'Vance\'s thesis topic. Possible link to Pre-Columbian myths.' },
  { id: 't4', type: 'thread', title: 'Dr. J.C. Tillinghast', description: 'Discredited scientist (1920s). Claimed Aztec temples folded space. Paul recalled this name.' }
];

const INITIAL_NPCS: ListItem[] = [
  { id: 'n1', type: 'npc', title: 'Handler (Control)', description: 'Your Delta Green contact. Communicates via encrypted app. No face-to-face.' },
  { id: 'n2', type: 'npc', title: 'Elias Vance', description: 'Target. 24yo. Missing. Apartment contains charcoal scrawls.' },
  { id: 'n3', type: 'npc', title: 'Responding Officer', description: 'Reported nausea upon entering Vance\'s apartment. Identity needed.' }
];

const INITIAL_LOCATIONS: ListItem[] = [
  { id: 'l1', type: 'location', title: 'Vance\'s Apartment', description: 'Hyde Park. Crime scene. "Charcoal scrawls" & Nausea reported.' },
  { id: 'l2', type: 'location', title: 'University of Chicago', description: 'Vance\'s research site. Regenstein Library. Academic records.' },
  { id: 'l3', type: 'location', title: 'Woodfield Mall', description: 'Current Location. Coffee shop. Secure meeting point.' }
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
  },
  {
    id: 'init-3',
    timestamp: '10:30',
    type: 'narrative',
    content: 'SCENE 2: THE MALL MEETING\n\nLocation: Woodfield Mall. Time: 10:30 AM.\n\nThe team meets in a quiet corner of the food court to formulate a plan. The atmosphere is mundane—shoppers, pretzels, coffee—contrasting with the grim briefing. You need to decide how to approach the two primary leads: the Apartment (the crime scene) and the University (the research).'
  },
  {
    id: 'init-4',
    timestamp: '10:42',
    type: 'dialogue',
    content: 'Jack: "We need some previous information about this menace. I don\'t want to go blind."\n\nTo Paul: "Does it ring a bell about this \'Hypergeometry in Pre-Columbian Architecture\'? Do you need additional info and where we can get it?"\n\nTo Tom: "Any clues how we should approach the interior of the apartment to avoid us being affected or at least analyze it? Maybe you should need some equipment we don\'t have in our hands now?"'
  },
  {
    id: 'init-5',
    timestamp: '10:45',
    type: 'narrative',
    content: 'The team confers. Tom notes he has PPE (N95s/Gloves) for everyone. He plans to collect samples at the apartment for later analysis and potentially incinerate evidence.\n\nPaul racks his brain for historical context on Vance\'s research topic.'
  },
  {
    id: 'init-6',
    timestamp: '10:46',
    type: 'system',
    content: 'Paul rolls History (70%): [38] SUCCESS.',
    details: 'Paul recalls obscure 1920s papers by a Dr. J.C. Tillinghast claiming Aztec temples were machines designed to "fold space" or channel acoustic shadows. Discredited as pseudo-science.'
  },
  {
    id: 'init-7',
    timestamp: '10:47',
    type: 'narrative',
    content: 'Paul shares the Tillinghast connection. "Hyper-geometry" is a term popularized by Lovecraft and his circle, often referring to non-Euclidean spatial theories. However, in a Pre-Columbian context, he recalls obscure (and largely discredited) papers from the 1920s about Aztec temples designed to channel "acoustic shadows" or "fold space" using specific angles. Specifically, he remembers a controversial figure named Dr. J.C. Tillinghast who claimed Mayan step-pyramids were machines, not tombs. Most call it pseudo-science. Delta Green calls it a lead.'
  },
  {
    id: 'init-8',
    timestamp: '10:48',
    type: 'dialogue',
    content: 'Jack reacts to the history lesson: "Well that sounds f***ing crazy about those Indians."\n\nHe steps away to make a call to his CPD contact. "I\'m going to say this connects to missing students in other states. Just gathering info for a yearly analysis."\n\n(Jack attempting Persuade/Law check to get the officer\'s report.)'
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

const MYTHIC_ACTIONS = [
  'Attainment', 'Starting', 'Neglect', 'Fight', 'Recruit', 'Triumph', 'Violate', 'Oppose', 'Malice', 'Communicate',
  'Persecute', 'Increase', 'Decrease', 'Abandon', 'Gratify', 'Inquire', 'Antagonize', 'Move', 'Waste', 'Truce',
  'Release', 'Befriend', 'Judge', 'Desert', 'Dominate', 'Procrastinate', 'Praise', 'Separate', 'Take', 'Break',
  'Heal', 'Delay', 'Stop', 'Lie', 'Return', 'Imitate', 'Struggle', 'Inform', 'Bestow', 'Postpone',
  'Expose', 'Haggle', 'Imprison', 'Release', 'Celebrate', 'Develop', 'Travel', 'Block', 'Harm', 'Debase',
  'Overindulge', 'Adjourn', 'Adversity', 'Kill', 'Disrupt', 'Usurp', 'Create', 'Betray', 'Agree', 'Abuse',
  'Oppress', 'Inspect', 'Ambush', 'Spy', 'Attach', 'Carry', 'Open', 'Carelessness', 'Ruins', 'Extravagance',
  'Trick', 'Arrive', 'Propose', 'Divide', 'Refuse', 'Mistrust', 'Deceive', 'Cruelty', 'Intolerance', 'Trust',
  'Excitement', 'Activity', 'Assist', 'Care', 'Negligence', 'Passion', 'Work', 'Control', 'Attract', 'Failure',
  'Pursue', 'Vengeance', 'Proceedings', 'Dispute', 'Punish', 'Guide', 'Transform', 'Overthrow', 'Oppress', 'Change'
];

const MYTHIC_DESCRIPTORS = [
  'Abnormally', 'Adventurously', 'Aggressively', 'Angrily', 'Anxiously', 'Awkwardly', 'Beautifully', 'Bleakly', 'Boldly', 'Bravely',
  'Busily', 'Calmly', 'Carefully', 'Carelessly', 'Cautiously', 'Ceaselessly', 'Cheerfully', 'Combatively', 'Coolly', 'Crazily',
  'Curiously', 'Dangerously', 'Defiantly', 'Deliberately', 'Delicately', 'Delightfully', 'Dimly', 'Efficiently', 'Energetically', 'Enormously',
  'Enthusiastically', 'Excitedly', 'Fearfully', 'Ferociously', 'Fiercely', 'Foolishly', 'Fortunately', 'Frantically', 'Freely', 'Frighteningly',
  'Fully', 'Generously', 'Gently', 'Gladly', 'Gracefully', 'Gratefully', 'Happily', 'Hastily', 'Healthily', 'Helpfully',
  'Helplessly', 'Hopelessly', 'Innocently', 'Intensely', 'Interestingly', 'Irritatingly', 'Jovially', 'Joyfully', 'Judgementally', 'Kindly',
  'Kookily', 'Lazily', 'Lightly', 'Loosely', 'Loudly', 'Lovingly', 'Loyally', 'Majestically', 'Meaningfully', 'Mechanically',
  'Miserably', 'Mockingly', 'Mysteriously', 'naturally', 'Neatly', 'Nicely', 'Oddly', 'Offensively', 'Officially', 'Partially',
  'Passively', 'Peacefully', 'Perfectly', 'Playfully', 'Politely', 'Positively', 'Powerfully', 'Quaintly', 'Quarrelsomely', 'Quietly',
  'Roughly', 'Rudely', 'Ruthlessly', 'Slowly', 'Softly', 'Swiftly', 'Threateningly', 'Very', 'Violently', 'Wildly'
];

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
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustStat = (type: 'hp' | 'wp' | 'san', val: number) => {
    const newAgent = { ...agent };
    newAgent.derived[type].current = Math.max(0, Math.min(newAgent.derived[type].max, newAgent.derived[type].current + val));
    updateAgent(newAgent);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateAgent({ ...agent, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    updateAgent({ ...agent, skills: [...agent.skills, newSkill] });
    setNewSkill('');
    setIsAddingSkill(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 mb-4 shadow-lg transition-all duration-200 relative group">
      <div 
        className="flex justify-between items-start mb-2 cursor-pointer hover:bg-slate-700/50 rounded p-1 -m-1"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
           {/* Avatar / Upload */}
           <div 
             className="w-12 h-12 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center overflow-hidden relative group/avatar"
             onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
           >
             {agent.image ? (
               <img src={agent.image} alt={agent.name} className="w-full h-full object-cover" />
             ) : (
               <User className="w-6 h-6 text-slate-500" />
             )}
             <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
               <Camera className="w-4 h-4 text-white" />
             </div>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
           </div>
           
           <div>
            <h3 className="text-lg font-bold text-emerald-400">{agent.name}</h3>
            <p className="text-xs text-slate-400 uppercase tracking-wider">{agent.profession}</p>
           </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
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
            <div className="flex justify-between items-center mb-1">
               <p className="text-xs text-slate-400 font-bold flex items-center gap-1"><Brain className="w-3 h-3" /> SKILLS</p>
               <button onClick={() => setIsAddingSkill(!isAddingSkill)} className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add
               </button>
            </div>
            
            {isAddingSkill && (
              <form onSubmit={handleAddSkill} className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  value={newSkill} 
                  onChange={(e) => setNewSkill(e.target.value)} 
                  placeholder="Skill Name %"
                  className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:border-emerald-500 outline-none"
                  autoFocus
                />
                <button type="submit" className="bg-emerald-700 hover:bg-emerald-600 px-2 py-1 rounded text-xs">OK</button>
              </form>
            )}

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
    </div>
  );
};

const DeltaGreenApp = () => {
  // --- State ---
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [chaosFactor, setChaosFactor] = useState(5);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [logInput, setLogInput] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'log' | 'agents'>('log'); // Mobile tabs
  
  // Adventure Lists (Updated to ListItem[])
  const [threads, setThreads] = useState<ListItem[]>(INITIAL_THREADS);
  const [npcs, setNpcs] = useState<ListItem[]>(INITIAL_NPCS);
  const [locations, setLocations] = useState<ListItem[]>(INITIAL_LOCATIONS);
  
  const [scene, setScene] = useState({
    title: 'Scene 2: The Mall Meeting',
    description: '10:30 AM at Woodfield Mall. The team strategizes.'
  });

  const [odds, setOdds] = useState<Odds>('50/50');
  const [fateQuestion, setFateQuestion] = useState('');
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Persistance Logic ---
  
  // Load from local storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('dg_ops_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setAgents(parsed.agents);
        setChaosFactor(parsed.chaosFactor);
        setLogs(parsed.logs);
        
        // Migration logic for old string arrays to new ListItem arrays
        if (parsed.threads && typeof parsed.threads[0] === 'string') {
           setThreads(parsed.threads.map((t:string, i:number) => ({ id: `t${i}`, title: t, description: 'Legacy Data', type: 'thread' })));
        } else {
           setThreads(parsed.threads || INITIAL_THREADS);
        }

        if (parsed.npcs && typeof parsed.npcs[0] === 'string') {
           setNpcs(parsed.npcs.map((n:string, i:number) => ({ id: `n${i}`, title: n, description: 'Legacy Data', type: 'npc' })));
        } else {
           setNpcs(parsed.npcs || INITIAL_NPCS);
        }

        if (parsed.locations && typeof parsed.locations[0] === 'string') {
           setLocations(parsed.locations.map((l:string, i:number) => ({ id: `l${i}`, title: l, description: 'Legacy Data', type: 'location' })));
        } else {
           setLocations(parsed.locations || INITIAL_LOCATIONS);
        }

        // Migration for scene (string to object)
        if (typeof parsed.scene === 'string') {
            setScene({ title: parsed.scene, description: 'Restored Scene' });
        } else {
            setScene(parsed.scene || { title: 'Scene 2: The Mall Meeting', description: '10:30 AM at Woodfield Mall.' });
        }

        addLog('system', 'Mission data restored from local storage.');
      } catch (e) {
        console.error('Failed to load save data', e);
      }
    }
    
    // Load draft input if exists
    const savedInput = sessionStorage.getItem('dg_log_draft');
    if (savedInput) setLogInput(savedInput);
  }, []);

  // Save to local storage whenever state changes
  useEffect(() => {
    const gameState: GameState = {
      agents, chaosFactor, logs, threads, npcs, locations, scene
    };
    localStorage.setItem('dg_ops_data', JSON.stringify(gameState));
  }, [agents, chaosFactor, logs, threads, npcs, locations, scene]);

  // Save input draft to session storage
  useEffect(() => {
    sessionStorage.setItem('dg_log_draft', logInput);
  }, [logInput]);

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

  const handleExport = () => {
    const gameState: GameState = {
      agents, chaosFactor, logs, threads, npcs, locations, scene
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameState));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "delta-green-save.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setShowSaveMenu(false);
    addLog('system', 'Mission data exported to file.');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (parsed.agents && parsed.logs) {
          setAgents(parsed.agents);
          setChaosFactor(parsed.chaosFactor);
          setLogs(parsed.logs);
          // Migration logic also here for file imports
          if (parsed.threads && typeof parsed.threads[0] === 'string') {
            setThreads(parsed.threads.map((t:string, i:number) => ({ id: `t${i}`, title: t, description: 'Legacy Data', type: 'thread' })));
          } else {
            setThreads(parsed.threads || []);
          }

          if (parsed.npcs && typeof parsed.npcs[0] === 'string') {
            setNpcs(parsed.npcs.map((n:string, i:number) => ({ id: `n${i}`, title: n, description: 'Legacy Data', type: 'npc' })));
          } else {
            setNpcs(parsed.npcs || []);
          }

          if (parsed.locations && typeof parsed.locations[0] === 'string') {
            setLocations(parsed.locations.map((l:string, i:number) => ({ id: `l${i}`, title: l, description: 'Legacy Data', type: 'location' })));
          } else {
            setLocations(parsed.locations || []);
          }
          
          if (typeof parsed.scene === 'string') {
             setScene({ title: parsed.scene, description: 'Restored Scene' });
          } else {
             setScene(parsed.scene || { title: 'Unknown Scene', description: '' });
          }

          addLog('system', 'Mission data imported successfully.');
          setShowSaveMenu(false);
        } else {
          alert("Invalid save file format");
        }
      } catch (err) {
        alert("Failed to parse save file");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    if (confirm("Are you sure? This will wipe all current progress.")) {
      setAgents(INITIAL_AGENTS);
      setChaosFactor(5);
      setLogs(INITIAL_LOGS);
      setThreads(INITIAL_THREADS);
      setNpcs(INITIAL_NPCS);
      setLocations(INITIAL_LOCATIONS);
      setScene({ title: 'Scene 2: The Mall Meeting', description: '10:30 AM at Woodfield Mall.' });
      localStorage.removeItem('dg_ops_data');
      sessionStorage.removeItem('dg_log_draft');
      setLogInput('');
      setShowSaveMenu(false);
      addLog('alert', 'SYSTEM RESET. Factory defaults restored.');
    }
  };

  // --- Mythic Logic ---

  const handleFateRoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fateQuestion.trim()) return;

    const probability = getFateProbability(chaosFactor, odds);
    const roll = Math.floor(Math.random() * 100) + 1;
    
    const rollStr = roll.toString().padStart(2, '0');
    const isDoubles = rollStr[0] === rollStr[1];
    const chaosDigit = parseInt(rollStr[0]);
    const randomEvent = isDoubles && chaosDigit <= chaosFactor;

    let result = 'NO';
    if (roll <= Math.ceil(probability * 0.2)) result = 'EXCEPTIONAL YES';
    else if (roll <= probability) result = 'YES';
    else if (roll >= 100 - Math.floor((100 - probability) * 0.2)) result = 'EXCEPTIONAL NO';
    else result = 'NO';

    addLog('mythic', `Q: ${fateQuestion}`, `Odds: ${odds} | Roll: ${roll} vs ${probability}% | Result: ${result}`);
    if (window.innerWidth < 768) setActiveTab('log');

    if (randomEvent) {
      // Generate Focus
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

      // Generate Meaning
      const actionWord = MYTHIC_ACTIONS[Math.floor(Math.random() * MYTHIC_ACTIONS.length)];
      const descWord = MYTHIC_DESCRIPTORS[Math.floor(Math.random() * MYTHIC_DESCRIPTORS.length)];

      addLog('alert', 'RANDOM EVENT TRIGGERED!', `Doubles rolled (${roll}) under Chaos Factor (${chaosFactor}).`);
      addLog('mythic', `EVENT: ${focus} (${focusRoll})`, `Meaning: ${actionWord} / ${descWord}`);
    }

    setFateQuestion('');
  };

  const handleDiceRoll = (sides: number) => {
    const result = Math.floor(Math.random() * sides) + 1;
    addLog('system', `Rolled d${sides}: ${result}`);
    if (window.innerWidth < 768) setActiveTab('log'); 
  };

  const handleNarrativeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logInput.trim()) return;
    addLog('narrative', logInput);
    setLogInput('');
  };

  // --- Icons Helper ---

  const getDieIcon = (sides: number) => {
    switch(sides) {
      case 4: return <Triangle className="w-3 h-3" />;
      case 6: return <Square className="w-3 h-3" />;
      case 8: return <span className="font-bold text-[10px]">d8</span>;
      case 10: return <span className="font-bold text-[10px]">d10</span>;
      case 20: return <Hexagon className="w-3 h-3" />;
      case 100: return <span className="font-bold text-[10px]">00</span>;
      default: return <Dice5 className="w-3 h-3" />;
    }
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
                  <li>• <strong>Photo:</strong> Click the avatar icon to upload a character portrait.</li>
                  <li>• <strong>Skills:</strong> Click "Add" to type in custom skills.</li>
                  <li>• <strong>Edit:</strong> Use + / - buttons to adjust stats during play.</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-900 rounded border border-slate-700">
              <h4 className="text-sm font-bold text-amber-500 mb-2 flex items-center gap-2"><Save className="w-4 h-4" /> SAVING & LOADING</h4>
              <p className="text-xs text-slate-300">
                The app <strong>auto-saves</strong> to this browser. To move between computers or keep backups, use the <strong>SAVE</strong> button in the header to <strong>Export</strong> a .json file.
              </p>
            </div>

            <button onClick={() => setShowHelp(false)} className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded transition-colors">
              ENTER OPERATION
            </button>
          </div>
        </div>
      )}

      {/* Save/Load Menu Overlay */}
      {showSaveMenu && (
        <div className="absolute top-14 right-4 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-40 p-2 flex flex-col gap-2">
           <button onClick={handleExport} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-700 rounded text-sm text-left">
             <Download className="w-4 h-4 text-emerald-400" /> Export Mission File
           </button>
           <label className="flex items-center gap-3 px-4 py-2 hover:bg-slate-700 rounded text-sm text-left cursor-pointer">
             <Upload className="w-4 h-4 text-blue-400" /> Import Mission File
             <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
           </label>
           <div className="h-px bg-slate-700 my-1"></div>
           <button onClick={handleReset} className="flex items-center gap-3 px-4 py-2 hover:bg-red-900/50 rounded text-sm text-left text-red-400">
             <Trash2 className="w-4 h-4" /> Factory Reset
           </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 border-b border-emerald-900/30 p-3 md:p-4 flex items-center justify-between shadow-md z-10 shrink-0 relative">
        <div className="flex items-center gap-3">
          <Shield className="text-emerald-500 w-6 h-6 md:w-8 md:h-8" />
          <div>
            <h1 className="text-lg md:text-xl font-black tracking-widest text-emerald-500">DELTA GREEN</h1>
            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wide hidden md:block">Operation Manager // Clearance: TOP SECRET</p>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-xs text-slate-500 uppercase">Operation</span>
            <span className="font-mono text-emerald-400">VISCID GLIMMER</span>
          </div>
          
          <button 
            onClick={() => setShowSaveMenu(!showSaveMenu)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded border border-slate-700 transition-colors"
            title="Save/Load Data"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold hidden md:inline">SAVE</span>
          </button>

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
          w-full md:w-1/4 min-w-[300px] bg-slate-900 border-r border-slate-800 p-2 md:p-3 flex flex-col gap-2 overflow-y-auto
          absolute md:relative inset-0 z-10 md:z-0
          ${activeTab === 'game' ? 'block' : 'hidden md:flex'}
        `}>
          
          {/* COMPACT ROW: Chaos + Dice */}
          <div className="flex gap-2">
             {/* Chaos Factor - Compact */}
             <div className="flex-1 bg-slate-800 p-2 rounded-lg border border-slate-700 flex flex-col justify-center min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-[10px] font-bold text-red-400 uppercase flex items-center gap-1 truncate">
                    <Activity className="w-3 h-3" /> Chaos
                  </h2>
                  <span className="text-lg font-bold font-mono text-white leading-none">{chaosFactor}</span>
                </div>
                <input 
                  type="range" min="1" max="9" 
                  value={chaosFactor} 
                  onChange={(e) => setChaosFactor(parseInt(e.target.value))}
                  className="w-full accent-red-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
             </div>

             {/* Quick Dice - Compact */}
             <div className="flex-[1.5] bg-slate-800 p-2 rounded-lg border border-slate-700 min-w-0">
                <h2 className="text-[10px] font-bold text-slate-300 uppercase mb-1 flex items-center gap-1 truncate">
                  <Dice5 className="w-3 h-3" /> Dice
                </h2>
                <div className="grid grid-cols-6 gap-1">
                  {[4, 6, 8, 10, 20, 100].map(d => (
                    <button 
                      key={d} 
                      onClick={() => handleDiceRoll(d)}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-300 h-6 rounded flex items-center justify-center transition-colors"
                      title={`Roll d${d}`}
                    >
                      {getDieIcon(d)}
                    </button>
                  ))}
                </div>
             </div>
          </div>

          {/* Fate Question - Compact */}
          <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 shrink-0">
            <h2 className="text-[10px] font-bold text-blue-400 uppercase mb-1 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> Oracle
            </h2>
            <form onSubmit={handleFateRoll} className="space-y-2">
              <div className="flex gap-2">
                 <select 
                  value={odds} 
                  onChange={(e) => setOdds(e.target.value as Odds)}
                  className="w-1/3 bg-slate-900 border border-slate-600 rounded px-1 py-1.5 text-xs focus:outline-none focus:border-blue-500 truncate"
                >
                  {Object.keys(ODDS_MAP).map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-2 rounded text-xs transition-colors">
                  ASK ORACLE
                </button>
              </div>
              <div>
                <input 
                  type="text" 
                  value={fateQuestion}
                  onChange={(e) => setFateQuestion(e.target.value)}
                  placeholder="Yes/No Question..."
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </form>
          </div>

          {/* Lists (Expanded Space) */}
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            <div className="bg-slate-800/50 p-2 rounded border border-slate-700 shrink-0">
              <h3 className="text-[10px] font-bold text-amber-500 uppercase mb-1 flex items-center gap-1"><Clapperboard className="w-3 h-3" /> Current Scene</h3>
              <div className="text-xs font-bold text-white leading-tight">{scene.title}</div>
              <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{scene.description}</div>
            </div>

            {/* Threads List */}
            <div className="shrink-0">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-1 border-b border-slate-700 pb-0.5 flex items-center gap-1">
                <List className="w-3 h-3" /> Threads
              </h3>
              <ul className="space-y-1">
                {threads.map((t, i) => (
                  <li key={i} className="bg-slate-800 p-1.5 rounded border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
                    <div className="text-xs font-medium text-emerald-300 leading-tight">{t.title}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">{t.description}</div>
                  </li>
                ))}
              </ul>
            </div>

            {/* NPCs List */}
            <div className="shrink-0">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-1 border-b border-slate-700 pb-0.5 flex items-center gap-1">
                <User className="w-3 h-3" /> NPCs
              </h3>
              <ul className="space-y-1">
                {npcs.map((n, i) => (
                  <li key={i} className="bg-slate-800 p-1.5 rounded border border-slate-700/50 hover:border-blue-500/30 transition-colors">
                    <div className="text-xs font-medium text-blue-300 leading-tight">{n.title}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">{n.description}</div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Locations List */}
            <div className="shrink-0 pb-2">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-1 border-b border-slate-700 pb-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Locations
              </h3>
              <ul className="space-y-1">
                {locations.map((l, i) => (
                  <li key={i} className="bg-slate-800 p-1.5 rounded border border-slate-700/50 hover:border-amber-500/30 transition-colors">
                    <div className="text-xs font-medium text-amber-200/80 leading-tight">{l.title}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">{l.description}</div>
                  </li>
                ))}
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
                log.type === 'dialogue' ? 'bg-slate-800/40 border-purple-500 italic' :
                'bg-slate-800/20 border-emerald-600'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold uppercase ${
                    log.type === 'mythic' ? 'text-blue-400' : 
                    log.type === 'alert' ? 'text-red-400' :
                    log.type === 'dialogue' ? 'text-purple-400' :
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