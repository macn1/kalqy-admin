const RANK = { none: 0, view: 1, edit: 2 };

// Maps each admin page to the permission resource that guards it (frontend simulation only).
export const ROUTE_RESOURCE = {
  students: 'students', parents: 'students', schools: 'schools', teachers: 'schools',
  games: 'games', 'game-sessions': 'analytics', 'learning-analytics': 'analytics', downloads: 'analytics',
  reports: 'reports', website: 'website', leads: 'website', team: 'team', settings: 'settings',
};

export const level = (matrix, role, resource) => (resource ? matrix?.[role]?.[resource] || 'none' : 'edit');
export const canView = (matrix, role, resource) => RANK[level(matrix, role, resource)] >= RANK.view;
export const canEdit = (matrix, role, resource) => RANK[level(matrix, role, resource)] >= RANK.edit;
