export type TierLabel = 'Leader' | 'Officer' | 'Member' | 'Recruit'
export const TIER_LABELS: TierLabel[] = ['Recruit', 'Member', 'Officer', 'Leader']
export const TIER_COLORS: Record<TierLabel, string> = {
  Leader:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Officer: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Member:  'bg-green-500/15 text-green-400 border-green-500/30',
  Recruit: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

export type SpecialistRole = 'farm' | 'pvp' | 'build' | 'scout' | 'defend' | 'none'

export const SPECIALIST_LABELS: Record<SpecialistRole, string> = {
  farm:   'Farmer',
  pvp:    'PvP Fighter',
  build:  'Builder',
  scout:  'Scout',
  defend: 'Defender',
  none:   'Unassigned',
}

export const SPECIALIST_COLORS: Record<SpecialistRole, string> = {
  farm:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  pvp:    'bg-red-500/15 text-red-400 border-red-500/25',
  build:  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  scout:  'bg-purple-500/15 text-purple-400 border-purple-500/25',
  defend: 'bg-green-500/15 text-green-400 border-green-500/25',
  none:   'bg-gray-500/15 text-gray-400 border-gray-500/25',
}

export interface Member {
  id: string
  username: string
  ingameName: string
  tier: 0 | 1 | 2 | 3
  specialistRole: SpecialistRole
  currentWipeHours: number
  totalHours: number
  wipeRaids: number
  totalRaids: number
  currentWipeTasks: number
  tasksCompleted: number
  warnings: number
  online: boolean
  lastSeen: string
  steamRustHours: number
  vcCurrentWipe: number
  joinedAt: string
  score: number
}

export const mockMembers: Member[] = [
  { id: '1', username: 'xXRustLord420Xx', ingameName: 'RustLord', tier: 3, specialistRole: 'pvp',    currentWipeHours: 87, totalHours: 342, wipeRaids: 12, totalRaids: 47, currentWipeTasks: 3, tasksCompleted: 18, warnings: 0, online: true,  lastSeen: '2 minutes ago',  steamRustHours: 3420, vcCurrentWipe: 14, joinedAt: '2025-01-15', score: 1840 },
  { id: '2', username: 'SteelHammer99',   ingameName: 'Hammer',   tier: 2, specialistRole: 'defend', currentWipeHours: 64, totalHours: 289, wipeRaids: 9,  totalRaids: 38, currentWipeTasks: 1, tasksCompleted: 24, warnings: 1, online: false, lastSeen: '3 hours ago',    steamRustHours: 2100, vcCurrentWipe: 8,  joinedAt: '2025-02-20', score: 1420 },
  { id: '3', username: 'ClanWarlord',     ingameName: 'Warlord',  tier: 2, specialistRole: 'pvp',    currentWipeHours: 59, totalHours: 201, wipeRaids: 11, totalRaids: 29, currentWipeTasks: 2, tasksCompleted: 15, warnings: 0, online: true,  lastSeen: 'just now',       steamRustHours: 1850, vcCurrentWipe: 11, joinedAt: '2025-03-01', score: 1310 },
  { id: '4', username: 'AK47Ace',         ingameName: 'Ace',      tier: 1, specialistRole: 'pvp',    currentWipeHours: 48, totalHours: 176, wipeRaids: 7,  totalRaids: 22, currentWipeTasks: 0, tasksCompleted: 9,  warnings: 0, online: false, lastSeen: '1 day ago',      steamRustHours: 980,  vcCurrentWipe: 5,  joinedAt: '2025-04-10', score: 1050 },
  { id: '5', username: 'NightRaider',     ingameName: 'Raider',   tier: 1, specialistRole: 'scout',  currentWipeHours: 43, totalHours: 155, wipeRaids: 6,  totalRaids: 20, currentWipeTasks: 1, tasksCompleted: 7,  warnings: 2, online: false, lastSeen: '6 hours ago',    steamRustHours: 760,  vcCurrentWipe: 3,  joinedAt: '2025-04-22', score: 920  },
  { id: '6', username: 'BaseBuilder_Pro', ingameName: 'Builder',  tier: 1, specialistRole: 'build',  currentWipeHours: 38, totalHours: 142, wipeRaids: 4,  totalRaids: 18, currentWipeTasks: 2, tasksCompleted: 11, warnings: 0, online: true,  lastSeen: 'just now',       steamRustHours: 620,  vcCurrentWipe: 7,  joinedAt: '2025-05-03', score: 870  },
  { id: '7', username: 'FarmKing',        ingameName: 'Farmer',   tier: 1, specialistRole: 'farm',   currentWipeHours: 31, totalHours: 98,  wipeRaids: 3,  totalRaids: 12, currentWipeTasks: 1, tasksCompleted: 6,  warnings: 0, online: false, lastSeen: '12 hours ago',   steamRustHours: 430,  vcCurrentWipe: 2,  joinedAt: '2025-05-18', score: 680  },
  { id: '8', username: 'SurvivalPro_X',  ingameName: 'Survivor',  tier: 0, specialistRole: 'farm',   currentWipeHours: 12, totalHours: 24,  wipeRaids: 1,  totalRaids: 1,  currentWipeTasks: 0, tasksCompleted: 0,  warnings: 0, online: false, lastSeen: '2 days ago',     steamRustHours: 210,  vcCurrentWipe: 1,  joinedAt: '2026-06-10', score: 200  },
  { id: '9', username: 'NewRecruit_2026', ingameName: 'Newbie',   tier: 0, specialistRole: 'none',   currentWipeHours: 7,  totalHours: 14,  wipeRaids: 0,  totalRaids: 0,  currentWipeTasks: 0, tasksCompleted: 0,  warnings: 1, online: true,  lastSeen: 'just now',       steamRustHours: 85,   vcCurrentWipe: 0,  joinedAt: '2026-06-20', score: 100  },
]

export interface Task {
  id: string
  title: string
  description: string
  category: 'farm' | 'pvp' | 'build' | 'scout' | 'defend' | 'admin'
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed'
  assignedTo: string[]
  assignedBy: string
  autoAssigned: boolean
  deadline: string | null
  createdAt: string
}

export const mockTasks: Task[] = [
  { id: 't1', title: 'Farm sulfur for raid tonight',        description: 'Need at least 2000 sulfur before 8pm',              category: 'farm',   priority: 'high',   status: 'in-progress', assignedTo: ['4', '7'], assignedBy: 'system', autoAssigned: true,  deadline: '2026-06-24T20:00:00Z', createdAt: '2026-06-24T10:00:00Z' },
  { id: 't2', title: 'Scout enemy base at G12',             description: 'Identify external TC count and honeycomb level',     category: 'scout',  priority: 'high',   status: 'pending',     assignedTo: ['5'],      assignedBy: 'system', autoAssigned: true,  deadline: '2026-06-24T18:00:00Z', createdAt: '2026-06-24T11:00:00Z' },
  { id: 't3', title: 'Upgrade base to stone (floors 3-5)',  description: 'Priority upgrade on top floors before wipe push',   category: 'build',  priority: 'medium', status: 'in-progress', assignedTo: ['6'],      assignedBy: '2',      autoAssigned: true,  deadline: null,                   createdAt: '2026-06-23T14:00:00Z' },
  { id: 't4', title: 'PvP patrol around dome',              description: 'Keep dome clear of enemy activity',                 category: 'pvp',    priority: 'medium', status: 'pending',     assignedTo: ['3', '5'], assignedBy: '1',      autoAssigned: false, deadline: null,                   createdAt: '2026-06-24T08:00:00Z' },
  { id: 't5', title: 'Defend main base against raid',       description: 'Enemy clan incoming — online defenders needed',     category: 'defend', priority: 'high',   status: 'completed',   assignedTo: ['1','2','3'], assignedBy: '1',   autoAssigned: false, deadline: null,                   createdAt: '2026-06-23T22:00:00Z' },
  { id: 't6', title: 'Set up external tool cupboard',       description: 'Place TC and lock down G14 area',                  category: 'build',  priority: 'low',    status: 'pending',     assignedTo: ['6'],      assignedBy: '2',      autoAssigned: false, deadline: null,                   createdAt: '2026-06-24T09:00:00Z' },
]

// ─── Stages ──────────────────────────────────────────────────────────────────

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskCategory = 'farm' | 'pvp' | 'build' | 'scout' | 'defend'

export interface StageTaskTemplate {
  id: string
  role: SpecialistRole
  title: string
  description: string
  priority: TaskPriority
  category: TaskCategory
}

export interface Stage {
  id: string
  name: string
  description: string
  color: string
  order: number
  taskTemplates: StageTaskTemplate[]
}

export interface StageConfig {
  activeStageId: string | null
  autoAssignEnabled: boolean
  rustplusConnected: boolean
  notifyOnAssign: boolean
}

export const STAGE_COLORS = [
  { label: 'Orange',  value: 'orange',  ring: 'bg-orange-500',  badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  { label: 'Red',     value: 'red',     ring: 'bg-red-500',     badge: 'bg-red-500/15 text-red-400 border-red-500/30' },
  { label: 'Yellow',  value: 'yellow',  ring: 'bg-yellow-500',  badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  { label: 'Green',   value: 'green',   ring: 'bg-green-500',   badge: 'bg-green-500/15 text-green-400 border-green-500/30' },
  { label: 'Blue',    value: 'blue',    ring: 'bg-blue-500',    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { label: 'Purple',  value: 'purple',  ring: 'bg-purple-500',  badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { label: 'Teal',    value: 'teal',    ring: 'bg-teal-500',    badge: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
]

export function stageColorBadge(color: string) {
  return STAGE_COLORS.find(c => c.value === color)?.badge ?? 'bg-gray-500/15 text-gray-400 border-gray-500/30'
}
export function stageColorRing(color: string) {
  return STAGE_COLORS.find(c => c.value === color)?.ring ?? 'bg-gray-500'
}

export const mockStages: Stage[] = [
  {
    id: 's1',
    name: 'Early Wipe',
    description: 'First 24h of wipe. Focus on getting established quickly.',
    color: 'green',
    order: 1,
    taskTemplates: [
      { id: 'st1', role: 'farm',   title: 'Farm wood and stone',          description: 'Collect at least 5000 wood and 3000 stone for base', priority: 'high',   category: 'farm' },
      { id: 'st2', role: 'build',  title: 'Build starter 2x2 base',       description: 'Get a twig starter up and upgrade to wood asap',     priority: 'high',   category: 'build' },
      { id: 'st3', role: 'pvp',    title: 'Secure immediate area',        description: 'Clear nearby players, claim spawn zone',             priority: 'medium', category: 'pvp' },
      { id: 'st4', role: 'scout',  title: 'Scout monument locations',     description: 'Mark launch site, airfield and power plant on map',  priority: 'medium', category: 'scout' },
    ],
  },
  {
    id: 's2',
    name: 'Farming for Raid',
    description: 'Active farming stage before a planned raid. All roles push resources.',
    color: 'yellow',
    order: 2,
    taskTemplates: [
      { id: 'st5', role: 'farm',   title: 'Farm sulfur at D8 node cluster', description: 'Target ~2000 sulfur per run, report when done',    priority: 'high',   category: 'farm' },
      { id: 'st6', role: 'farm',   title: 'Farm metal frags at airfield',   description: 'Need 5000 frags for explosives crafting',          priority: 'high',   category: 'farm' },
      { id: 'st7', role: 'build',  title: 'Craft explosives',               description: 'Convert sulfur to satchels/rockets in base',       priority: 'high',   category: 'build' },
      { id: 'st8', role: 'scout',  title: 'Watch target base at G12',       description: 'Track online times and patrol patterns',           priority: 'high',   category: 'scout' },
      { id: 'st9', role: 'pvp',    title: 'Roam and prevent interference',  description: 'Keep the area around our base clear',              priority: 'medium', category: 'pvp' },
      { id: 'st10', role: 'defend', title: 'Man base defenses',             description: 'Stay online to defend if we get countered',        priority: 'high',   category: 'defend' },
    ],
  },
  {
    id: 's3',
    name: 'Active Raid',
    description: 'Raid is in progress. Everyone has a role.',
    color: 'red',
    order: 3,
    taskTemplates: [
      { id: 'st11', role: 'pvp',    title: 'Push the target base',          description: 'Lead the raid push, call out positions',           priority: 'high',   category: 'pvp' },
      { id: 'st12', role: 'build',  title: 'Build raid tower at G12',       description: 'Construct approach tower for roof access',         priority: 'high',   category: 'build' },
      { id: 'st13', role: 'defend', title: 'Guard raid base entrance',      description: 'Do not let anyone through our rear',               priority: 'high',   category: 'defend' },
      { id: 'st14', role: 'farm',   title: 'Resupply rockets from base',    description: 'Restock the pushers when they call for ammo',      priority: 'high',   category: 'farm' },
      { id: 'st15', role: 'scout',  title: 'Watch for counter-raid squad',  description: 'Alert team if enemy allies respond',               priority: 'high',   category: 'scout' },
    ],
  },
  {
    id: 's4',
    name: 'Post-Raid Recovery',
    description: 'After the raid. Loot sorted, base secured, restock.',
    color: 'blue',
    order: 4,
    taskTemplates: [
      { id: 'st16', role: 'farm',   title: 'Sort and store raid loot',      description: 'Organize loot boxes and recycle excess materials',  priority: 'medium', category: 'farm' },
      { id: 'st17', role: 'build',  title: 'Expand base after raid gains',  description: 'Use gained resources to upgrade and expand',        priority: 'medium', category: 'build' },
      { id: 'st18', role: 'defend', title: 'Reinforce base defenses',       description: 'Upgrade weak points, add external TCs',            priority: 'high',   category: 'defend' },
    ],
  },
]

export const mockStageConfig: StageConfig = {
  activeStageId: 's2',
  autoAssignEnabled: true,
  rustplusConnected: true,
  notifyOnAssign: true,
}

// ─── Rest of mock data ────────────────────────────────────────────────────────

export const mockWipe = {
  serverName: 'Rustafied US Main',
  wipeNumber: 47,
  wipeStart: '2026-06-12T19:00:00Z',
  wipeEnd: '2026-06-26T19:00:00Z',
  daysLeft: 2,
  hoursLeft: 48,
  nextWipeType: 'full' as const,
  mapSize: 4000,
  connect: '51.91.207.147:28015',
  battlemetricsId: '123456',
  totalPlayers: 200,
  currentPlayers: 127,
  maxPlayers: 200,
}

export const mockActivityChart = [
  { day: 'Jun 18', hours: 42, members: 6 },
  { day: 'Jun 19', hours: 38, members: 5 },
  { day: 'Jun 20', hours: 65, members: 8 },
  { day: 'Jun 21', hours: 71, members: 9 },
  { day: 'Jun 22', hours: 58, members: 7 },
  { day: 'Jun 23', hours: 83, members: 9 },
  { day: 'Jun 24', hours: 49, members: 6 },
]

export const mockPopHistory = [
  { time: '00:00', players: 82 },
  { time: '02:00', players: 61 },
  { time: '04:00', players: 43 },
  { time: '06:00', players: 38 },
  { time: '08:00', players: 55 },
  { time: '10:00', players: 89 },
  { time: '12:00', players: 134 },
  { time: '14:00', players: 158 },
  { time: '16:00', players: 172 },
  { time: '18:00', players: 189 },
  { time: '20:00', players: 200 },
  { time: '22:00', players: 178 },
]

export const mockApplications = [
  { id: 'a1', username: 'GhostSniper_X', age: 22, availability: '20+ hrs/week', steamHours: 1240, status: 'pending' as const, appliedAt: '2026-06-23T15:30:00Z', whyJoin: 'Looking for an active clan with good raid coordination' },
  { id: 'a2', username: 'IronFist_2024', age: 18, availability: '15 hrs/week',  steamHours: 890,  status: 'pending' as const, appliedAt: '2026-06-24T09:10:00Z', whyJoin: 'Been solo for too long, want to join an organized team' },
]

export const mockRaids = [
  { id: 'r1', name: 'Operation Payback', time: '2026-06-24T21:00:00Z', gridRef: 'G12', target: 'ToxicWaste clan base', maxMembers: 8, rsvps: { in: ['1','2','3','4'], out: ['7'], maybe: ['5','6'] } },
]

export const mockIntel = [
  { id: 'n1', title: 'Enemy main base',    gridRef: 'G12', type: 'enemy_base'    as const, content: 'Sheet metal compound, 3 external TCs, honeycomb on all sides. Auto turrets at entrance.', addedBy: '1', addedAt: '2026-06-22' },
  { id: 'n2', title: 'Sulfur rock cluster', gridRef: 'D8', type: 'resource_node' as const, content: 'Large sulfur node cluster ~800 sulfur per run, usually uncontested early morning',         addedBy: '3', addedAt: '2026-06-21' },
  { id: 'n3', title: 'Safe house alpha',    gridRef: 'B3', type: 'safe_house'    as const, content: '2x2 with sleeping bags, stocked with basic meds and kit',                                   addedBy: '2', addedAt: '2026-06-20' },
]
