const calculateMatchScore = (profile, project) => {
  if (!profile) return { score: 0, reasons: [] };
  
  let score = 0;
  let totalCriteria = 0;
  const reasons = [];

  // Check roles (mapped to rolesNeeded in project)
  if (project.rolesNeeded && project.rolesNeeded.length > 0) {
    totalCriteria += project.rolesNeeded.length;
    const userRoles = profile.roles ? profile.roles.map(r => 
      typeof r === 'string' ? r.toLowerCase() : (r.type || '').toLowerCase()
    ) : [];
    const matchedRoles = project.rolesNeeded.filter(role => 
      userRoles.includes(role.toLowerCase())
    );
    score += matchedRoles.length;
    
    matchedRoles.forEach(role => {
      reasons.push({ type: 'strength', text: `Matched role: ${role}` });
    });
  }

  // Check tech stack
  if (project.techStack && project.techStack.length > 0) {
    totalCriteria += project.techStack.length;
    const userSkills = profile.skills ? profile.skills.map(s => 
      typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase()
    ) : [];
    const matchedSkills = project.techStack.filter(skill => 
      userSkills.includes(skill.toLowerCase())
    );
    score += matchedSkills.length;

    matchedSkills.forEach(skill => {
        reasons.push({ type: 'strength', text: `Expertise in ${skill}` });
    });
  }

  const finalScore = totalCriteria > 0 ? Math.round((score / totalCriteria) * 100) : 0;
  return { score: finalScore, reasons };
};

module.exports = { calculateMatchScore };
