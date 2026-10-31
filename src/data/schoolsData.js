// All schools, centres and teachers below are fictional sample records.
export const buildSchools = (now) => {
  const rows = [
    ['Little Stars Preschool', 'Kochi', 'Kerala', 'Active', 410],
    ['Bright Beginnings', 'Bengaluru', 'Karnataka', 'Active', 380],
    ['Happy Kids Learning Centre', 'Kozhikode', 'Kerala', 'Active', 350],
    ['Sunshine Early Learning', 'Chennai', 'Tamil Nadu', 'Active', 330],
    ['Rainbow Roots Montessori', 'Thiruvananthapuram', 'Kerala', 'Active', 300],
    ['Tiny Steps Academy', 'Coimbatore', 'Tamil Nadu', 'Trial', 120],
    ['Curious Minds Nursery', 'Mysuru', 'Karnataka', 'Active', 260],
    ['Blossom Buds Kindergarten', 'Alappuzha', 'Kerala', 'Active', 240],
    ['Sprouts Play School', 'Hyderabad', 'Telangana', 'Trial', 90],
    ['Wonder Years Preschool', 'Pune', 'Maharashtra', 'Pending', 40],
    ['Kiddo Kingdom', 'Thrissur', 'Kerala', 'Expired', 200],
    ['Little Explorers Centre', 'Mangaluru', 'Karnataka', 'Active', 180],
  ];
  return rows.map(([name, city, state, status, daysAgo], i) => ({
    id: `SCH-${101 + i}`,
    name,
    city,
    state,
    location: `${city}, ${state}`,
    status, // Active | Trial | Pending | Expired
    registeredAt: new Date(now - daysAgo * 86400000).toISOString(),
    contactEmail: `office${i + 1}@example.com`,
    classrooms: 2 + (i % 5),
  }));
};

export const buildTeachers = (now, schools) => {
  const names = [
    'Meera Krishnan', 'Anjali Varma', 'Rohan Iyer', 'Sneha Pillai', 'Farah Khan', 'Joseph Mathew',
    'Lakshmi Narayanan', 'Priya Das', 'Kavya Reddy', 'Suresh Babu', 'Nisha George', 'Imran Sheikh',
    'Divya Menon', 'Arjun Nambiar', 'Tara Fernandes', 'Vikram Rao', 'Leena Joseph', 'Hari Prasad',
  ];
  const activity = [
    'Generated a weekly learning report', 'Assigned Egg Game to a classroom', 'Reviewed session results',
    'Added a new student', 'Exported class progress', 'Started a live class session',
  ];
  const statuses = ['Active', 'Active', 'Active', 'Active', 'On leave', 'Active'];
  return names.map((name, i) => ({
    id: `TCH-${301 + i}`,
    name,
    schoolId: schools[i % schools.length].id,
    email: `${name.split(' ')[0].toLowerCase()}.${i + 1}@example.com`,
    status: statuses[i % statuses.length],
    reportsGenerated: 3 + ((i * 7) % 19),
    lastActive: new Date(now - (i * 5 + 1) * 3600000 * 3).toISOString(),
    recentActivity: activity[i % activity.length],
  }));
};
