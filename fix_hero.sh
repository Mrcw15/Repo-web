#!/bin/bash

FILE="src/components/UnifiedReachHero.tsx"

# Replace imports
sed -i 's/import React, { useState, useEffect } from .react.;/import React from '"'"'react'"'"';/g' $FILE
sed -i '/Clock,/d' $FILE
sed -i '/TrendingUp,/d' $FILE
sed -i '/BarChart3,/d' $FILE
sed -i '/Zap,/d' $FILE
sed -i '/ChevronDown,/d' $FILE
sed -i '/ChevronUp,/d' $FILE
sed -i '/Calendar/d' $FILE
sed -i '/import {/,/} from .recharts.;/d' $FILE
sed -i '/import { motion, AnimatePresence } from .motion\/react.;/d' $FILE
sed -i '/import { soundFx } from/d' $FILE

# Remove the states and the useMemo hooks, up to the return statement.
# We will use perl for multiline replacement
perl -0777 -pi -e 's/const \[showChart, setShowChart\].*?return \(/return \(/s' $FILE

# Replace React.FC parameters to remove history
perl -0777 -pi -e 's/  history,\n  onNavigateTab,\n}\) => \{/  onNavigateTab,\n}) => {/s' $FILE

