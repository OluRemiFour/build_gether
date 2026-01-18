const Applicant = require("../models/Applicant");
const Project = require("../models/CreateProject");
const User = require("../models/User");
const { CollaboratorProfile } = require("../models/CollaboratorProfile");
const { calculateMatchScore } = require("../utils/matchingEngine");

const createProject = async (req, res) => {
  try {
    const {
      projectTitle,
      projectDescription,
      rolesNeeded,
      projectDetails,
      techStack,
      applicant,
    } = req.body;
    if (
      !projectTitle ||
      !projectDescription ||
      !rolesNeeded ||
      !techStack ||
      !projectDetails.experienceLevel ||
      !projectDetails.timeline ||
      !projectDetails.teamSize
    ) {
      return res.status(400).json({
        message:
          "Project title, Project Description, Roles, Project Details, Project Stack are required",
      });
    }

    // Use the authenticated user's ID from the middleware
    const ownerId = req.userId;
    
    if (!ownerId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify the user exists
    const ownerExists = await User.findById(ownerId);
    if (!ownerExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const applicantId = await Applicant.findOne({ _id: applicant });
    if (applicant && !applicantId) {
      return res.status(400).json({ message: "Invalid applicant ID provided" });
    }

    const newProject = new Project({
      projectTitle,
      projectDescription,
      rolesNeeded,
      projectDetails,
      techStack,
      owner: ownerId,
    });
    if (applicantId) newProject.applicants = applicantId;
    await newProject.save();
    res
      .status(201)
      .json({ message: "Project created successfully", newProject });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;
    
    // Ensure only owner can update
    // Depending on middleware, req.userId or req.user.id is set
    const userId = req.userId || req.user.id;

    const project = await Project.findOne({ _id: projectId, owner: userId });

    if (!project) {
      return res.status(404).json({ message: "Project not found or unauthorized" });
    }

    // Prevent updating sensitive fields if necessary, but generally allow full update
    // excluding owner and applicants structure directly might be safe
    const allowedUpdates = [
        "projectTitle", "projectDescription", "projectStatus", 
        "rolesNeeded", "techStack", "projectDetails"
    ];

    Object.keys(updates).forEach((key) => {
       if (allowedUpdates.includes(key)) {
           project[key] = updates[key];
       }
    });

    await project.save();

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// const getTotalProjects = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     if (!userId) {
//       return res.status(400).json({
//         message: "User ID is required",
//       });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     const projects = await Project.find({ userId });

//     res.status(200).json({
//       success: true,
//       message: "Projects fetched successfully",
//       data: {
//         projects,
//         total: projects.length,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching projects:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch projects",
//       error: error.message,
//     });
//   }
// };

const getTotalProjects = async (req, res) => {
  try {
    // Get user ID from req.userId (set by your protect middleware)
    const userId = req.userId;
    
    console.log("User ID from token:", userId);
    console.log("User role:", req.userRole);

    // Validate user ID
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    // Optional: Get user details from database
    const user = await User.findById(userId).select("name email role");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    // Find all projects belonging to this user
    // const projects = await Project.find({ userId: userId });
    const projects = await Project.find({ owner: userId }).populate("applicants.user", "fullName avatar");
    
    console.log(`Found ${projects.length} projects for user ${userId}`);

    res.status(200).json({
      success: true,
      message: "Projects fetched successfully",
      data: {
        projects,
        total: projects.length,
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch projects",
      error: error.message 
    });
  }
};

const getActiveProjects = async (req, res) => {
  try {
    const owner = req.userId || req.user?.userId || req.user?._id;
    const activeProject = await Project.find({
      projectStatus: "active",
      owner,
    });
    res.status(200).json({
      message: "Active projects fetched successfully",
      activeProject,
      total: activeProject.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getAchProjects = async (req, res) => {
  try {
    const owner = req.userId || req.user?.userId || req.user?._id;
    const achProjects = await Project.find({
      projectStatus: "achieved",
      owner,
    });
    res.status(200).json({
      message: "Achieved projects fetched successfully",
      achProjects,
      total: achProjects.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDraftProjects = async (req, res) => {
  try {
    const owner = req.userId || req.user?.userId || req.user?._id;
    const draftProject = await Project.find({
      projectStatus: "draft",
      owner,
    });
    res.status(200).json({
      message: "Draft projects fetched successfully",
      draftProject,
      total: draftProject.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const completedProjects = async (req, res) => {
  try {
    const owner = req.userId || req.user?.userId || req.user?._id;
    const completedProjects = await Project.find({
      projectStatus: "completed",
      owner,
    });
    res.status(200).json({
      message: "Completed projects fetched successfully",
      completedProjects,
      total: completedProjects.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const markProjectAsCompleted = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { projectId } = req.params;

    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
      return res.status(404).json({ message: "Project not found or unauthorized" });
    }

    if (project.lifecycleStage !== 'ongoing' && project.lifecycleStage !== 'review') {
      return res.status(400).json({ message: "Project must be in 'ongoing' or 'review' stage to be marked as completed" });
    }

    project.projectStatus = "completed";
    project.lifecycleStage = "completed";
    await project.save();

    const populatedProject = await Project.findById(project._id)
        .populate('owner', 'fullName avatar')
        .populate('team.user', 'fullName avatar');

    res.status(200).json({ 
        success: true,
        message: "Project marked as completed", 
        project: {
            ...populatedProject.toObject(),
            ownerId: project.owner?._id || project.owner,
            permissions: {
                isOwner: true,
                isMember: true
            }
        }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const archiveProject = async (req, res) => {
  const owner = req.user.userId;
  const projectId = req.params.projectId;
  try {
    const archiveProject = await Project.findById({ _id: projectId, owner });
    if (!archiveProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    archiveProject.projectStatus = "archived";
    await archiveProject.save();
    res
      .status(200)
      .json({ message: "Project archived successfully", archiveProject });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unarchiveProject = async (req, res) => {
  const owner = req.userId || req.user?.userId;
  const projectId = req.params.projectId;
  try {
    const project = await Project.findOne({ _id: projectId, owner });
    if (!project) {
      return res.status(404).json({ message: "Project not found or unauthorized" });
    }
    project.projectStatus = "active";
    await project.save();
    res
      .status(200)
      .json({ message: "Project unarchived successfully", project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const deleteProject = async (req, res) => {
  const projectId = req.params.projectId;
  const owner = req.userId || req.user.userId; // Handle potentially different middleware props
  try {
    const projectToRemove = await Project.findOneAndDelete({ _id: projectId, owner });
    
    if (!projectToRemove) {
      return res.status(404).json({ message: "Project not found or unauthorized" });
    }
    
    res.status(200).json({ message: "Project removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const applyToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId; // From protect middleware
    const { roleAppliedFor, message } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if already applied
    const alreadyApplied = project.applicants.some(
      (a) => a.user && a.user.toString() === userId.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: "You have already applied to this project" });
    }

    // Add application
    project.applicants.push({
      user: userId,
      roleAppliedFor: roleAppliedFor || "collaborator",
      message: message || "",
      status: "pending",
      appliedAt: new Date()
    });

    await project.save();

    res.status(200).json({ 
      success: true,
      message: "Application submitted successfully" 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const inviteCollaborator = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.body;
    const ownerId = req.user._id;

    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only owner can invite
    if (project.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Already collaborator?
    if (project.collaborators.includes(userId)) {
      return res.status(400).json({ message: "User already a collaborator" });
    }

    // Already invited?
    const alreadyInvited = project.invites.some(
      (i) => i.user.toString() === userId && i.status === "pending"
    );

    if (alreadyInvited) {
      return res.status(400).json({ message: "User already invited" });
    }

    project.invites.push({ user: userId });

    await project.save();

    res.status(200).json({ message: "Invite sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const userId = req.userId;
    const profile = await CollaboratorProfile.findOne({ userId });

    const projects = await Project.find({ projectStatus: "active" })
      .populate("owner", "fullName avatar")
      .sort({ createdAt: -1 });

    const projectsWithScores = projects.map(p => {
        const { score, reasons } = calculateMatchScore(profile, p);
        const hasApplied = p.applicants.some(a => a.user && a.user.toString() === userId?.toString());
        return {
            ...p.toObject(),
            matchScore: score,
            matchReasons: reasons,
            hasApplied
        };
    });

    res.status(200).json({
      success: true,
      data: projectsWithScores
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllApplicants = async (req, res) => {
  try {
    const userId = req.userId;
    const projects = await Project.find({ owner: userId }).populate("applicants.user", "fullName avatar email");

    const applicants = [];
    for (const project of projects) {
        if(project.applicants && project.applicants.length > 0) {
            for (const app of project.applicants) {
                if(app.user) {
                    const collabProfile = await CollaboratorProfile.findOne({ userId: app.user._id });
                    const { score, reasons } = calculateMatchScore(collabProfile, project);
                    
                    applicants.push({
                        id: app._id,
                        name: app.user.fullName,
                        avatar: app.user.avatar,
                        email: app.user.email,
                        role: app.roleAppliedFor || "collaborator",
                        matchScore: score,
                        matchReasons: reasons,
                        project: project.projectTitle,
                        projectId: project._id,
                        appliedAt: app.appliedAt,
                        status: app.status,
                        bio: collabProfile?.bio || "No bio provided", 
                        skills: collabProfile?.skills?.map(s => s.name) || [], 
                        experience: collabProfile?.experienceLevel || "Intermediate"
                    });
                }
            }
        }
    }

    res.status(200).json({
        success: true,
        applicants
    });
  } catch (error) {
     res.status(500).json({ message: error.message });
  }
};

// Helper for Safe ID Extraction
const safeId = (val) => {
    if (!val) return null;
    if (val._id) return val._id.toString(); // Handle populated object or ObjectId object
    if (val.id) return val.id.toString();
    return val.toString(); // Handle string ID
};

const getProjectById = async (req, res) => {
  try {
    const userId = req.userId;
    const project = await Project.findById(req.params.projectId)
      .populate("owner", "fullName avatar")
      .populate("team.user", "fullName avatar");
    if(!project) return res.status(404).json({message: "Project not found"});
    
    // Increment view count
    project.views = (project.views || 0) + 1;
    await project.save();
    
    // Calculate match score if user is a collaborator
    let matchScore = 0;
    let matchReasons = [];
    let hasApplied = false;
    
    if (userId) {
      const profile = await CollaboratorProfile.findOne({ userId });
      if (profile) {
        const matchData = calculateMatchScore(profile, project);
        matchScore = matchData.score;
        matchReasons = matchData.reasons;
      }
      
      // Check if user has already applied
      hasApplied = project.applicants.some(app => 
        safeId(app.user) === safeId(userId)
      );
    }
    
    // Get applicant status if user has applied
    const applicantStatus = userId ? project.applicants.find(app => 
      safeId(app.user) === safeId(userId)
    )?.status || null : null;
    
    // Compute permissions server-side with Standardized ID Comparison
    const currentUserId = safeId(userId);
    const ownerId = safeId(project.owner);
    
    const isOwner = !!(currentUserId && ownerId && currentUserId === ownerId);
    // Handle both populated team.user objects and raw IDs using safeId
    const isMember = !!(currentUserId && project.team.some(m => safeId(m.user) === currentUserId));

    const projectData = {
      ...project.toObject(),
      ownerId: ownerId, // Return purely the string ID
      permissions: {
          isOwner,
          isMember
      },
      matchScore,
      matchReasons,
      hasApplied,
      applicantStatus
    };
    
    res.status(200).json({ success: true, project: projectData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        const projects = await Project.find({ owner: userId }).sort({ createdAt: -1 });

        // Calculate stats validation might be needed if they are virtuals or aggregated
        // For now, assuming direct properties or simple mapping
        const mappedProjects = projects.map(p => ({
            id: p._id,
            title: p.projectTitle,
            description: p.projectDescription,
            status: p.projectStatus,
            roles: p.rolesNeeded,
            applicants: p.applicants?.length || 0,
            views: p.views || 0, // Assuming views field exists or defaulting
            createdAt: p.createdAt,
            techStack: p.techStack,
            lifecycleStage: p.lifecycleStage || 'team-search'
        }));

        res.status(200).json({
            success: true,
            projects: mappedProjects
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getApplicantById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    // Find project containing the applicant subdocument
    const project = await Project.findOne({ "applicants._id": applicationId })
        .populate("applicants.user", "fullName avatar email")
        .populate("owner", "fullName");

    if(!project) return res.status(404).json({ message: "Application not found" });

    const applicant = project.applicants.id(applicationId);
    if(!applicant) return res.status(404).json({ message: "Applicant subdocument not found" });

    const collabProfile = await CollaboratorProfile.findOne({ userId: applicant.user?._id });
    const { score, reasons } = calculateMatchScore(collabProfile, project);

    // Map to frontend interface
    const response = {
         id: applicant._id,
         name: applicant.user?.fullName || "Unknown",
         avatar: applicant.user?.avatar || "",
         email: applicant.user?.email || "",
         role: applicant.roleAppliedFor || "collaborator",
         matchScore: score,
         matchReasons: reasons,
         project: project.projectTitle,
         projectId: project._id,
         appliedAt: applicant.appliedAt,
         status: applicant.status,
         message: applicant.message || "",
         bio: collabProfile?.bio || "No bio provided",
         skills: collabProfile?.skills?.map(s => s.name) || [],
         experience: collabProfile?.experienceLevel || "Intermediate",
    };

    res.status(200).json({ success: true, applicant: response });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOwnerDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const projects = await Project.find({ owner: userId });
        
        let totalApplicants = 0;
        let activeProjects = 0;
        let successfulMatches = 0;
        let totalViews = 0;

        projects.forEach(p => {
            if(p.projectStatus === 'active') activeProjects++;
            if(p.applicants) {
                totalApplicants += p.applicants.length;
                successfulMatches += p.applicants.filter(a => a.status === 'accepted').length;
            }
            totalViews += (p.views || 0);
        });

        res.status(200).json({
            success: true,
            stats: {
                activeProjects,
                totalApplicants,
                successfulMatches,
                totalViews
            }
        });
    } catch (error) {
         res.status(500).json({ message: error.message });
    }
};

const completeTeamSelection = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { projectId } = req.params;

    const project = await Project.findOne({ _id: projectId, owner: userId });
    
    console.log(`[completeTeamSelection] Requesting User: ${userId}`);
    if (project) {
        console.log(`[completeTeamSelection] Found Project Owner (Raw): ${project.owner}`);
    } else {
        console.log(`[completeTeamSelection] Project NOT found for User: ${userId}`);
    }

    if (!project) {
      return res.status(404).json({ message: "Project not found or unauthorized" });
    }

    // Mark as ongoing and transition lifecycle
    project.lifecycleStage = "ongoing";
    
    // Move accepted applicants to team if not already there
    const acceptedApplicants = project.applicants.filter(a => a.status === 'accepted');
    acceptedApplicants.forEach(app => {
        const alreadyInTeam = project.team.some(tm => tm.user.toString() === app.user.toString());
        if (!alreadyInTeam) {
            project.team.push({
                user: app.user,
                role: app.roleAppliedFor,
                joinedAt: app.appliedAt
            });
        }
    });

    await project.save();

    const populatedProject = await Project.findById(project._id)
        .populate('owner', 'fullName avatar')
        .populate('team.user', 'fullName avatar');

    console.log(`[completeTeamSelection] Populated Owner ID: ${populatedProject.owner?._id}`);
    
    res.status(200).json({ 
        success: true,
        message: "Team selection completed. Project is now ongoing.", 
        project: {
            ...populatedProject.toObject(),
            ownerId: safeId(project.owner),
            permissions: {
                isOwner: true, // Known because performable only by owner
                isMember: true // Owner is implicitly member or manager
            }
        }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const leaveProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.userId;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        // Check if user is in team
        const teamIndex = project.team.findIndex(m => m.user.toString() === userId);
        if (teamIndex === -1) {
            return res.status(400).json({ message: "You are not a member of this project team" });
        }

        // Remove from team
        project.team.splice(teamIndex, 1);
        
        // Also update any other status if needed? No, just remove from team.
        await project.save();

        res.json({ success: true, message: "You have left the project" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
  createProject,
  getTotalProjects,
  getActiveProjects,
  deleteProject,
  completedProjects,
  getAchProjects,
  getDraftProjects,
  archiveProject,
  unarchiveProject,
  applyToProject,
  inviteCollaborator,
  getAllProjects,
  getAllApplicants,
  getProjectById,
  getApplicantById,
  getMyProjects,
  getOwnerDashboardStats,
  updateProject,
  markProjectAsCompleted,
  completeTeamSelection,
  leaveProject,
};
