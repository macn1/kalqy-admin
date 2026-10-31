// Egg Game, Plant Power and Marble Madness are listed on kalqy.in. The other three
// (and every description) are SAMPLE content for the demo.
export const GAME_CATEGORIES = ['Mathematics', 'English & Language', 'Science', 'Colours & Matching'];

export const DEV_AREAS = [
  'Cognitive development',
  'Physical development',
  'Emotional & social development',
  'Creativity & imagination',
];

export const buildGames = (now) => [
  {
    id: 'GAME-01', name: 'Egg Game', category: 'English & Language', status: 'Published',
    description: 'Sample: Move your body to catch and sort letter eggs while building early vocabulary.',
    thumbnail: '/images/chicken.png', devArea: 'Cognitive development', origin: 'kalqy.in', ageRange: '3–5',
    color: '#39A9F9', icon: 'Egg', updatedAt: new Date(now - 4 * 86400000).toISOString(),
  },
  {
    id: 'GAME-02', name: 'Plant Power', category: 'Science', status: 'Published',
    description: 'Sample: Stretch, jump and reach to help a seedling grow through the seasons.',
    thumbnail: '/images/plant.png', devArea: 'Physical development', origin: 'kalqy.in', ageRange: '3–5',
    color: '#3FB27F', icon: 'Sprout', updatedAt: new Date(now - 9 * 86400000).toISOString(),
  },
  {
    id: 'GAME-03', name: 'Marble Madness', category: 'Colours & Matching', status: 'Published',
    description: 'Sample: Guide colourful marbles to matching targets using body movement.',
    thumbnail: '/images/wiz.png', devArea: 'Creativity & imagination', origin: 'kalqy.in', ageRange: '3–5',
    color: '#FF8C78', icon: 'Circle', updatedAt: new Date(now - 15 * 86400000).toISOString(),
  },
  {
    id: 'GAME-04', name: 'Math Quest', category: 'Mathematics', status: 'Published',
    description: 'Sample: Count, compare and add with playful movement challenges.',
    thumbnail: '', devArea: 'Cognitive development', origin: 'sample', ageRange: '4–5',
    color: '#E9B21A', icon: 'Calculator', updatedAt: new Date(now - 21 * 86400000).toISOString(),
  },
  {
    id: 'GAME-05', name: 'Science Lab', category: 'Science', status: 'Published',
    description: 'Sample: Explore simple experiments about water, light and sound.',
    thumbnail: '', devArea: 'Emotional & social development', origin: 'sample', ageRange: '4–5',
    color: '#8A7BE0', icon: 'FlaskConical', updatedAt: new Date(now - 30 * 86400000).toISOString(),
  },
  {
    id: 'GAME-06', name: 'Word Jungle', category: 'English & Language', status: 'Draft',
    description: 'Sample: Match jungle animals with the first sound of their names.',
    thumbnail: '', devArea: 'Creativity & imagination', origin: 'sample', ageRange: '3–5',
    color: '#5B6B8C', icon: 'BookOpen', updatedAt: new Date(now - 2 * 86400000).toISOString(),
  },
];
