// Replace placeholders with your real details. Add array entries to extend the page.
export const profile = {
  name: 'Your Name',
  initials: 'YN',
  role: 'Your discipline / expertise',
  location: 'Your City, Vietnam',
  greeting: "Hello, I'm",
  headline: ['Turning ideas', 'into experiences.'],
  introduction: 'A space for the things I create, the milestones I reach, and the journey that keeps unfolding.',
  about: 'Share a little about yourself here: what sparks your curiosity, how you approach your work, and what you hope to bring to every project.',
  disciplines: ['Design', 'Technology', '3D Exploration'],
  email: '', // e.g. you@example.com. Empty hides email links.
  portrait: '', // e.g. images/portrait.jpg in public/. Empty uses the artwork.
  portraitAlt: 'Portrait',
  resume: '', // e.g. resume.pdf in public/. Empty hides the resume link.
  socials: [], // e.g. { label: 'GitHub', url: 'https://github.com/yourname' }
};

export const achievements = [
  {
    id: 'award', type: 'Award', year: 'Year awarded',
    title: 'A milestone to be proud of',
    organization: 'Competition / organization',
    description: 'Add an award or achievement that matters to you. Share the context, your role, and the result you helped create.',
    icon: 'award', tags: ['Recognition', 'Your field'], url: '', isPlaceholder: true,
  },
  {
    id: 'certificate', type: 'Certification', year: 'Year completed',
    title: 'Learning, then going further',
    organization: 'Issuing institution',
    description: 'Add a certification or course you have completed, along with the skills and knowledge you gained along the way.',
    icon: 'certificate', tags: ['Certificate', 'Your skill'], url: '', isPlaceholder: true,
  },
  {
    id: 'milestone', type: 'Milestone', year: 'Year created',
    title: 'An idea brought to life',
    organization: 'Project / initiative',
    description: 'Tell the story of a project or personal milestone. What made it special, and how did you contribute to its success?',
    icon: 'spark', tags: ['Project', 'Creativity'], url: '', isPlaceholder: true,
  },
];

export const site = {
  title: 'Personal Portfolio',
  description: 'A personal portfolio of ideas, achievements, and interactive 3D explorations.',
  navigation: [
    { id: 'about', label: 'About' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'collection', label: '3D Playground' },
  ],
};
