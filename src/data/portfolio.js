// Replace placeholders with your real details. Add array entries to extend the page.
export const profile = {
  name: 'Nguyen Minh Son',
  publicationNames: ['Minh Son Nguyen', 'Son Minh Nguyen'],
  initials: 'SYNA',
  role: 'University Student, AI Researcher, 3D Creator',
  location: 'Hanoi, Vietnam',
  greeting: "Hehe, I'm",
  headline: ['Turning ideas', 'into experiences.'],
  introduction: 'A space for the things I created, the milestones I reach, and the journey that keeps unfolding.',
  about: 'Dedicated researcher specializing in Artificial Intelligence, with a focus on Machine Learning, Computer Vision, and Deep Learning. Proven academic track record with publications in international conferences and ongoing research in scientific journals. Proficient in Python, C++, and C#, with extensive experience using deep learning frameworks, web deployment tools, 3D modeling and game engine software. Adept at independent research and highly adaptable to emerging technologies.',
  disciplines: ['Machine Learning', 'Computer Vision', 'Medical Image Analysis', 'Technology', '3D Modeling', '3D Deep Learning', 'Attention Mechanisms', 'Generative Models (Diffusion)', 'AI for Computer Graphics', 'AI Agent'],
  email: 'synaisgood@gmail.com',
  portrait: '', // e.g. images/portrait.jpg in public/. Empty uses the artwork.
  portraitAlt: 'Portrait',
  resume: '', // e.g. resume.pdf in public/. Empty hides the resume link.
  socials: [{ label: 'GitHub', url: 'https://github.com/MinhSon090' }, { label: 'LinkedIn', url: 'https://www.linkedin.com/in/minh-son-nguyen-bab42b3b7' }], // e.g. { label: 'GitHub', url: 'https://github.com/yourname' }
};

export const achievements = [
  {
    // https://link.springer.com/book/9789819239344
    id: 'publication-u-mamba', type: 'Publication', year: '2026',
    title: 'U-Mamba: Lightweight Ultrasound Segmentation Using Selective State Space Models',
    organization: 'Quang-Tiep Tran, Dinh Thai Kim, Minh Son Nguyen, Lan Anh Nguyen, Quang Lam Chu and Nhat Anh Dang',
    description: 'An innovative approach to ultrasound segmentation using selective state space models.',
    icon: 'publication', tags: ['Research', 'AI in Medical Imaging', 'Segmentation', 'ICISN Conference'], url: 'https://www.researchgate.net/publication/411038876_U-Mamba_Lightweight_Ultrasound_Segmentation_Using_Selective_State_Space_Models', isPlaceholder: false,
  },
  {
    id: 'publication-soft-voting', type: 'Publication', year: '2026',
    title: 'An Optimized Soft Voting Ensemble Approach for Heart Disease Prediction',
    organization: 'Tiep Quang Tran, Hung Ha Manh , Son Minh Nguyen, Quan Minh Le and Gia Thanh Nguyen',
    description: 'Ensemble methods for heart disease prediction using weighted soft voting techniques.',
    icon: 'publication', tags: ['Research', 'AI in Medical', 'Detection', 'EAI RAIDS Conference'], url: '', isPlaceholder: false,
  },
  {
    id: 'publication-malssm', type: 'Publication', year: '2026',
    title: 'MalSSM: Efficient State Space Modeling for Dynamic Malware Analysis',
    organization: 'Tiep Quang Tran, Son Minh Nguyen, Hoang Diem Cong',
    description: 'Applying state space modeling methods to enhance dynamic malware analysis and detection.',
    icon: 'publication', tags: ['Research', 'AI in Cybersecurity', 'Malware Analysis', 'CITA Conference'], url: '', isPlaceholder: false,
  },
  {
    id: 'publication-essf-net', type: 'Publication', year: '2026',
    title: 'ESSF-Net: An Expert-Guided State Space Framework for Blood Cell Segmentation',
    organization: 'Tiep Quang Tran, Manh-Hung Ha, Son Minh Nguyen, Vu-Anh Tran, Quan Minh Le, Ha An Nguyen',
    description: 'A mixture of experts (MoE) approach for improving the quality of blood cell segmentation in medical imaging.',
    icon: 'publication', tags: ['Research', 'AI in Medical Imaging', 'Segmentation', 'ICTA Conference'], url: '', isPlaceholder: false,
  }
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
