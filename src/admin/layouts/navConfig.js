import { LayoutDashboard, GraduationCap, School, Users, UserSquare2, Gamepad2, PlayCircle, LineChart, FileBarChart, Globe, Inbox, Download, ShieldCheck, Settings } from 'lucide-react';

export const NAV = [
  { section: 'MAIN', items: [
    { slug: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { slug: 'students', label: 'Students', icon: GraduationCap },
    { slug: 'schools', label: 'Schools & Centres', icon: School },
    { slug: 'parents', label: 'Parents', icon: Users },
    { slug: 'teachers', label: 'Teachers', icon: UserSquare2 },
  ] },
  { section: 'LEARNING', items: [
    { slug: 'games', label: 'Games Library', icon: Gamepad2 },
    { slug: 'game-sessions', label: 'Game Sessions', icon: PlayCircle },
    { slug: 'learning-analytics', label: 'Learning Analytics', icon: LineChart },
    { slug: 'reports', label: 'Reports & Exports', icon: FileBarChart },
  ] },
  { section: 'GROWTH', items: [
    { slug: 'website', label: 'Website Content', icon: Globe },
    { slug: 'leads', label: 'Demo Requests & Leads', icon: Inbox },
    { slug: 'downloads', label: 'Downloads & Installations', icon: Download },
  ] },
  { section: 'MANAGEMENT', items: [
    { slug: 'team', label: 'Team & Roles', icon: ShieldCheck },
    { slug: 'settings', label: 'Settings', icon: Settings },
  ] },
];
