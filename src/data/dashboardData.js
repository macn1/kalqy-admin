// Ecosystem-level DEMONSTRATION figures for the KPI cards (default "Last 30 days").
// They are scaled by the selected range. Charts and tables use the shared sample records instead.
export const KPI_BASE = [
  { id: 'students', label: 'Total Students', value: 1284, delta: 12.8, unit: '%', fmt: 'int', icon: 'GraduationCap', scale: 'stock' },
  { id: 'schools', label: 'Active Schools', value: 48, delta: 8.4, unit: '%', fmt: 'int', icon: 'School', scale: 'stock' },
  { id: 'sessions', label: 'Game Sessions', value: 8642, delta: 18.6, unit: '%', fmt: 'int', icon: 'Gamepad2', scale: 'flow' },
  { id: 'progress', label: 'Average Learning Progress', value: 78.4, delta: 5.2, unit: 'pp', fmt: 'pct', icon: 'TrendingUp', scale: 'stock' },
  { id: 'minutes', label: 'Total Learning Minutes', value: 126480, delta: 14.3, unit: '%', fmt: 'int', icon: 'Clock', scale: 'flow' },
  { id: 'demos', label: 'Demo Requests', value: 36, delta: 9.1, unit: '%', fmt: 'int', icon: 'CalendarCheck', scale: 'flow' },
];

export const RANGE_FLOW_FACTOR = { today: 0.04, '7d': 0.25, '30d': 1, '90d': 2.8 };

export const LEARNING_AREAS = [
  { key: 'Cognitive development', value: 82, color: '#39A9F9' },
  { key: 'Physical development', value: 76, color: '#3FB27F' },
  { key: 'Emotional & social development', value: 71, color: '#FF8C78' },
  { key: 'Creativity & imagination', value: 79, color: '#E9B21A' },
];
