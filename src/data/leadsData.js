import { mulberry32, between, DAY } from './seedUtils.js';

export const LEAD_STATUSES = ['New', 'Contacted', 'Demo Scheduled', 'Qualified', 'Converted', 'Closed'];
export const LEAD_TYPES = ['Preschool', 'School', 'Parent', 'Learning centre'];
export const LEAD_SOURCES = ['Website form', 'WhatsApp', 'Manorama Elevate', 'Referral', 'Instagram', 'Event'];

// Fictional enquiries with example.com addresses and non-routable phone numbers.
const ROWS = [
  ['Anita Sebastian', 'Tiny Tots Playhouse', 'Preschool', 'New'],
  ['Mohammed Rafi', 'Green Valley School', 'School', 'Contacted'],
  ['Divya Chandran', 'Parent enquiry', 'Parent', 'New'],
  ['Joseph Antony', 'Little Lambs Nursery', 'Preschool', 'Demo Scheduled'],
  ['Prerna Shah', 'Bloom Early Years', 'Learning centre', 'Qualified'],
  ['Gopal Krishnan', 'Rising Sun Public School', 'School', 'Converted'],
  ['Sheela Mathew', 'Parent enquiry', 'Parent', 'Contacted'],
  ['Ramesh Pai', 'Sunny Days Kindergarten', 'Preschool', 'Demo Scheduled'],
  ['Fathima Beevi', 'Little Champs Centre', 'Learning centre', 'New'],
  ['Arvind Swamy', 'Starfish Montessori', 'Preschool', 'Qualified'],
  ['Lekha Unnikrishnan', 'Parent enquiry', 'Parent', 'Closed'],
  ['Cyril Dsouza', 'Harbour View School', 'School', 'Contacted'],
  ['Bindu Nair', 'Playpen Preschool', 'Preschool', 'Converted'],
  ['Harish Menon', 'Bright Futures Academy', 'School', 'New'],
  ['Sana Qureshi', 'Parent enquiry', 'Parent', 'Demo Scheduled'],
  ['Elizabeth Koshy', 'Cuddles Daycare & Preschool', 'Preschool', 'Contacted'],
  ['Vinod Kumar', 'Little Genius Hub', 'Learning centre', 'Closed'],
  ['Tessa Paul', 'Mango Tree Nursery', 'Preschool', 'New'],
];

export const buildLeads = (now) =>
  ROWS.map(([contactName, organisation, type, status], i) => {
    const rng = mulberry32(5000 + i);
    const receivedAt = new Date(now - (i * 2 + between(rng, 0, 2)) * DAY - between(rng, 1, 10) * 3600000).toISOString();
    return {
      id: `LD-${2001 + i}`,
      contactName,
      organisation,
      type,
      email: `${contactName.split(' ')[0].toLowerCase()}${i + 1}@example.com`,
      phone: `+91 98000 ${String(20000 + i * 53).slice(-5)}`,
      source: LEAD_SOURCES[(i * 5) % LEAD_SOURCES.length],
      status,
      receivedAt,
      followUp: ['Demo Scheduled', 'Contacted', 'Qualified'].includes(status)
        ? new Date(now + between(rng, 1, 9) * DAY).toISOString().slice(0, 10)
        : '',
      notes: status === 'New' ? [] : [{ at: receivedAt, text: 'Sample note: initial outreach logged.' }],
    };
  });
