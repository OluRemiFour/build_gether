const Project = require("../models/CreateProject");
const { CollaboratorProfile } = require("../models/CollaboratorProfile");

const getMatches = async (req, res) => {
  try {
    const userId = req.userId;
    // Get user profile to find skills/roles
    // For now, we'll return all active projects as "matches" 
    // In a real recommendation system, this would be more complex
    
    // Optional: Filter by roles if profile exists and has roles
    // const profile = await CollaboratorProfile.findOne({ userId });
    
    const projects = await Project.find({ projectStatus: "active" })
      .populate("owner", "fullName avatar")
      .select("-applicants"); 

    // Simple matching logic could go here, for now return all
    res.status(200).json({
      success: true,
      matches: projects
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const applications = await Project.find({ "applicants.user": userId });
        
        const projectsJoined = applications.filter(p => 
            p.applicants.some(a => a.user.toString() === userId && a.status === 'accepted')
        ).length;

        // Basic stats
        const stats = {
            matchesReceived: 3, // Still mocked as match algorithm is complex
            projectsJoined: projectsJoined,
            completedProjects: 0, // Mock
            matchScore: 92 // Mock
        };

        res.status(200).json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getApplications = async (req, res) => {
  try {
    const userId = req.userId;

    // Find projects where the applicants array has an entry with user: userId
    const projects = await Project.find({
      "applicants.user": userId
    })
    .populate("owner", "fullName avatar")
    .select("projectTitle projectStatus applicants rolesNeeded techsStack projectDetails owner");

    // Map projects to extract the specific application status for this user
    const applications = projects.map(project => {
      const application = project.applicants.find(app => app.user.toString() === userId);
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
            // defaulting company/timeline as they might not map 1:1 to current UI expectations
            company: "BuildGether", 
        },
        status: application.status || "pending",
        appliedAt: application.appliedAt || project.createdAt,
        matchScore: 85 // Mock or calculate
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
