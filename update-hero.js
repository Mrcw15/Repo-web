const fs = require('fs');

const path = 'src/components/UnifiedReachHero.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove unused lucide icons
content = content.replace(/  Clock,\n  TrendingUp,\n  BarChart3,\n  Zap,\n  ChevronDown,\n  ChevronUp,\n  Calendar\n/g, '');

// Remove recharts imports
content = content.replace(/import {\n  AreaChart,\n  Area,\n  XAxis,\n  YAxis,\n  Tooltip,\n  ResponsiveContainer,\n  CartesianGrid,\n} from 'recharts';\n/g, '');

// Remove motion imports if unused (wait, let's keep motion just in case)
content = content.replace(/import \{ motion, AnimatePresence \} from 'motion\/react';\n/g, '');

// Remove states
content = content.replace(/  const \[showChart, setShowChart\] = useState\(false\);\n  const \[hours, setHours\] = useState\('00'\);\n  const \[minutes, setMinutes\] = useState\('00'\);\n  const \[seconds, setSeconds\] = useState\('00'\);\n/g, '');

// Remove the whole effects block up to `const total7DaysBoosts = last7DaysData.reduce((acc, curr) => acc + curr.boosts, 0);`
content = content.replace(/  \/\/ Live midnight countdown[\s\S]*?const total7DaysBoosts = last7DaysData\.reduce\(\(acc, curr\) => acc \+ curr\.boosts, 0\);\n/g, '');

// Remove the Sub-Banner div completely
content = content.replace(/      \{\/\* Sub-Banner: Unified Countdown \+ Activity Metric Pills \+ Chart Toggle \*\/\}[\s\S]*?      \{\/\* Expandable Lightweight Activity Chart \*\/\}[\s\S]*?      <\/AnimatePresence>\n/g, '');

fs.writeFileSync(path, content, 'utf8');
