const calculateMatchScore = (profile, project) => {
  if (!profile) return { score: 0, reasons: [] };
  
  let score = 0;
  let totalCriteria = 0;
  const reasons = [];

  // Check roles (mapped to rolesNeeded in project)
  if (project.rolesNeeded && project.rolesNeeded.length > 0) {
    totalCriteria += project.rolesNeeded.length;
    // Roles are now strings, not objects
    const userRoles = profile.roles ? profile.roles.map(r => 
      typeof r === 'string' ? r.toLowerCase() : (r.type || '').toLowerCase()
    ) : [];
    const matchedRoles = project.rolesNeeded.filter(role => 
      userRoles.includes(role.toLowerCase())
    );
    score += matchedRoles.length;
    
    if (matchedRoles.length > 0) {
      matchedRoles.forEach(role => {
        reasons.push({ 
          type: 'strength', 
          text: `Your ${role} expertise aligns perfectly with this project's needs` 
        });
      });
    } else if (userRoles.length > 0) {
      reasons.push({ 
        type: 'consideration', 
        text: `While your primary roles differ, your diverse skill set could bring unique value` 
      });
    }
  }

  // Check tech stack
  if (project.techStack && project.techStack.length > 0) {
    totalCriteria += project.techStack.length;
    // Skills can be objects with name property or strings
    const userSkills = profile.skills ? profile.skills.map(s => 
      typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase()
    ) : [];
    const matchedSkills = project.techStack.filter(skill => 
      userSkills.includes(skill.toLowerCase())
    );
    score += matchedSkills.length;

    if (matchedSkills.length > 0) {
      const skillList = matchedSkills.slice(0, 3).join(', ');
      const moreCount = matchedSkills.length - 3;
      reasons.push({ 
        type: 'strength', 
        text: `You have hands-on experience with ${skillList}${moreCount > 0 ? ` and ${moreCount} more` : ''}` 
      });
    }
  }

  // Check experience level compatibility
  if (profile.experienceLevel && project.projectDetails?.experienceLevel) {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const userLevel = levels.indexOf(profile.experienceLevel.toLowerCase());
    const projectLevel = levels.indexOf(project.projectDetails.experienceLevel.toLowerCase());
    
    if (userLevel >= projectLevel) {
      totalCriteria++;
      score++;
      reasons.push({ 
        type: 'strength', 
        text: `Your ${profile.experienceLevel} experience level meets the project requirements` 
      });
    } else if (userLevel === projectLevel - 1) {
      reasons.push({ 
        type: 'consideration', 
        text: `This project seeks slightly more experience, but could be a great growth opportunity` 
      });
    }
  }

  // Check availability/timeline compatibility
  if (profile.availability && project.projectDetails?.timeline) {
    const flexibleAvailability = ['flexible', 'part-time'];
    const isFlexible = flexibleAvailability.includes(profile.availability.toLowerCase());
    
    if (isFlexible) {
      reasons.push({ 
        type: 'strength', 
        text: `Your flexible availability matches the project's ${project.projectDetails.timeline} timeline` 
      });
    }
  }

  // Add personalized encouragement
  if (score > totalCriteria * 0.6) {
    reasons.push({ 
      type: 'strength', 
      text: `Based on your profile, you're among the top candidates for this opportunity` 
    });
  }

  const finalScore = totalCriteria > 0 ? Math.round((score / totalCriteria) * 100) : 0;
  return { score: finalScore, reasons };
};

module.exports = { calculateMatchScore };
