const Project = require("../models/CreateProject");
const { CollaboratorProfile } = require("../models/CollaboratorProfile");
const { calculateMatchScore } = require("../utils/matchingEngine");

const getMatches = async (req, res) => {
  try {
    const userId = req.userId;
    const profile = await CollaboratorProfile.findOne({ userId });
    
    const projects = await Project.find({ projectStatus: "active" })
      .populate("owner", "fullName avatar")
      .select("-applicants");

    const matchedProjects = projects.map(project => {
      const { score, reasons } = calculateMatchScore(profile, project);
      return {
        ...project.toObject(),
        matchScore: score,
        matchReasons: reasons
      };
    })
    .filter(p => p.matchScore > 10) 
    .sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      matches: matchedProjects
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
    try {
        const userId = req.userId;
        const profile = await CollaboratorProfile.findOne({ userId });
        
        const allProjects = await Project.find({ projectStatus: "active" });
        const applications = await Project.find({ "applicants.user": userId });
        
        const projectsJoined = applications.filter(p => 
            p.applicants.some(a => a.user.toString() === userId && a.status === 'accepted')
        ).length;

        // Calculate real match stats
        let totalScore = 0;
        let matchCount = 0;

        allProjects.forEach(project => {
            const { score } = calculateMatchScore(profile, project);
            if (score > 10) {
                totalScore += score;
                matchCount++;
            }
        });

        const avgScore = matchCount > 0 ? Math.round(totalScore / matchCount) : 0;

        const stats = {
            matchesReceived: matchCount,
            projectsJoined: projectsJoined,
            completedProjects: applications.filter(p => p.projectStatus === 'completed').length,
            matchScore: avgScore
        };

        res.status(200).json({ success: true, stats });
    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

const getApplications = async (req, res) => {
  try {
    const userId = req.userId;
    const profile = await CollaboratorProfile.findOne({ userId });

    const projects = await Project.find({
      "applicants.user": userId
    })
    .populate("owner", "fullName avatar");

    const applications = projects.map(project => {
      const application = project.applicants.find(app => app.user.toString() === userId);
      const { score, reasons } = calculateMatchScore(profile, project);
      
      return {
        _id: application._id, 
        project: {
            _id: project._id,
            title: project.projectTitle,
            roles: project.rolesNeeded,
            owner: {
                name: project.owner.fullName,
                avatar: project.owner.avatar
            },
            company: "BuildGether", 
        },
        status: application.status || "pending",
        appliedAt: application.appliedAt || project.createdAt,
        matchScore: score || 85,
        matchReasons: reasons
      };
    });

    res.status(200).json({
      success: true,
      applications
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMatches,
  getApplications,
  getDashboardStats,
};
