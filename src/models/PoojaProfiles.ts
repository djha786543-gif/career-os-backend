export const poojaProfiles: Record<string, {
  specialization: string;
  experienceYears: number;
  skills: string[];
  jobTitles: string[];
}> = {
  Academic: {
    specialization: 'Molecular Genetics & Cardiovascular Research Scientist',
    experienceYears: 10,
    skills: [
      'transgenic mouse models', 'cardiac physiology', 'molecular biology',
      'pregnancy-associated cardiac dysfunction', 'senescence biology',
      'RNA-seq', 'IPA', 'systems biology', 'histology', 'microscopy',
      'Cre-lox models', 'Langendorff perfusion', 'publication',
      'teaching', 'mentorship', 'peer review'
    ],
    jobTitles: [
      'Postdoctoral Researcher', 'Research Scientist', 'Assistant Professor',
      'Core Facility Scientist', 'Translational Research Fellow'
    ]
  },
  Industry: {
    specialization: 'Molecular Genetics & Cardiovascular Research Scientist',
    experienceYears: 10,
    skills: [
      'in vivo models', 'transgenic mice', 'conditional knockouts',
      'cardiovascular disease modeling', 'molecular biology assays',
      'Western blot', 'IHC', 'ICC', 'ELISA', 'TUNEL', 'senescence assays',
      'RNA-seq', 'transcriptomics', 'DESeq2', 'EdgeR', 'IPA',
      'primary cell culture', 'fibrosis assays', 'imaging',
      'bioinformatics', 'scientific visualization', 'BioRender', 'Illustrator'
    ],
    jobTitles: [
      'Scientist', 'Senior Scientist', 'In Vivo Scientist',
      'Translational Research Scientist', 'Preclinical Research Scientist',
      'Molecular Biology Scientist', 'Bioinformatics Scientist',
      'Research Associate III', 'Staff Scientist'
    ]
  }
};
