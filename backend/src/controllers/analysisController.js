const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');
const CandidateProfile = require('../models/CandidateProfile');
const profileAggregationService = require('../services/profileAggregationService');
const aiService = require('../services/aiService');
const roleService = require('../services/roleService');

// Helper to validate MongoDB ObjectId
function isValidObjectId(id) {
  return id && mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Background worker executing AI analysis request and persisting results.
 * Handles timeouts and exceptions without crashing Node.
 */
async function executeAnalysis(analysisId, aiPayload) {
  try {
    const aiResult = await aiService.analyzeCandidateProfile(aiPayload);

    const updated = await Analysis.findByIdAndUpdate(
      analysisId,
      {
        $set: {
          status: 'completed',
          result: aiResult.result,
          aiMetadata: aiResult.aiMetadata,
          error: null,
        },
      },
      { new: true }
    );

    // Sync result with CandidateProfile document for cached dashboard view
    if (updated) {
      await CandidateProfile.findByIdAndUpdate(updated.candidateId, {
        $set: {
          analysis: {
            readinessScore: aiResult.result.readinessScore,
            scoreBreakdown: aiResult.result.scoreBreakdown,
            skills: aiResult.result.skills,
            strengths: aiResult.result.strengths,
            gaps: aiResult.result.gaps,
            roadmap: aiResult.result.roadmap,
            analyzedAt: aiResult.aiMetadata?.analyzedAt || new Date(),
          },
        },
      });
      console.log(`[Analysis Controller] Analysis ${analysisId} successfully completed and stored in MongoDB`);
    }

    return updated;
  } catch (err) {
    console.error(`[Analysis Controller] Analysis ${analysisId} failed: ${err.message}`);

    await Analysis.findByIdAndUpdate(analysisId, {
      $set: {
        status: 'failed',
        error: err.message || 'AI service processing failed',
      },
    });

    return null;
  }
}

/**
 * Initiate profile analysis and evidence normalization
 * POST /api/analysis
 */
async function startAnalysis(req, res, next) {
  try {
    const rawCandidateId = req.body?.candidateId || req.body?.profileId || req.params?.candidateId;

    // 1. Validate candidate ID
    if (!rawCandidateId || !isValidObjectId(rawCandidateId)) {
      return res.status(400).json({
        success: false,
        error: 'Valid candidateId (24-character hexadecimal MongoDB ID) is required',
      });
    }

    // 2. Load candidate profile and confirm it exists
    const candidateProfile = await CandidateProfile.findById(rawCandidateId);
    if (!candidateProfile) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    // 3. Retrieve normalized unified candidate profile
    const unified = await profileAggregationService.getUnifiedCandidateProfile(rawCandidateId);
    if (!unified) {
      return res.status(404).json({
        success: false,
        error: 'Failed to retrieve unified candidate profile',
      });
    }

    // 4. Confirm target role exists / is selected
    const targetRoleFromBody = req.body?.targetRole;
    let targetRoleObj = {
      roleId: '',
      roleName: '',
    };

    if (typeof targetRoleFromBody === 'string' && targetRoleFromBody.trim()) {
      targetRoleObj.roleName = targetRoleFromBody.trim();
    } else if (targetRoleFromBody && typeof targetRoleFromBody === 'object') {
      targetRoleObj.roleId = targetRoleFromBody.roleId || '';
      targetRoleObj.roleName = targetRoleFromBody.roleName || '';
    } else if (req.body?.targetRoleId || req.body?.targetRoleName) {
      targetRoleObj.roleId = req.body.targetRoleId || '';
      targetRoleObj.roleName = req.body.targetRoleName || '';
    } else if (unified.candidate?.targetRole?.roleName || unified.candidate?.targetRole?.roleId) {
      targetRoleObj.roleId = unified.candidate.targetRole.roleId || '';
      targetRoleObj.roleName = unified.candidate.targetRole.roleName || '';
    }

    if (!targetRoleObj.roleName && !targetRoleObj.roleId) {
      return res.status(400).json({
        success: false,
        error: 'Target role is required to analyze profile readiness. Please select a target role.',
      });
    }

    // Lookup JobRole to attach slug and role requirements snapshot if available
    const roleDoc = await roleService.findRoleByNameOrId(targetRoleObj.roleId || targetRoleObj.roleName || targetRoleObj.slug);
    if (roleDoc) {
      targetRoleObj.roleId = targetRoleObj.roleId || roleDoc._id.toString();
      targetRoleObj.roleName = targetRoleObj.roleName || roleDoc.name;
      targetRoleObj.slug = roleDoc.slug;
      targetRoleObj.requirements = {
        requiredSkills: roleDoc.requiredSkills,
        preferredSkills: roleDoc.preferredSkills,
        responsibilities: roleDoc.responsibilities,
        commonTechnologies: roleDoc.commonTechnologies,
      };
    }

    // 5. Duplicate handling: if an analysis is already processing/pending, return existing
    const existingActiveAnalysis = await Analysis.findOne({
      candidateId: rawCandidateId,
      status: { $in: ['pending', 'processing'] },
    });

    if (existingActiveAnalysis) {
      console.log(`[Analysis Controller] Returning active in-flight analysis ${existingActiveAnalysis._id} for candidate ${rawCandidateId}`);
      return res.status(200).json({
        success: true,
        message: 'Analysis already in progress for this candidate',
        data: {
          analysisId: existingActiveAnalysis._id,
          status: existingActiveAnalysis.status,
        },
      });
    }

    // 6. Create Analysis document with status = "processing"
    const analysis = new Analysis({
      candidateId: rawCandidateId,
      targetRole: targetRoleObj,
      status: 'processing',
    });
    await analysis.save();

    console.log(`[Analysis Controller] Analysis record created with ID=${analysis._id}, status="processing"`);

    // 7. Prepare clean AI payload conforming strictly to contract
    const aiPayload = aiService.prepareAiPayload(rawCandidateId, targetRoleObj, unified);


    // If caller requests synchronous execution (e.g., test suites or explicit sync query)
    const isSync = req.query.sync === 'true' || req.body?.sync === true;
    if (isSync) {
      await executeAnalysis(analysis._id, aiPayload);
      const freshAnalysis = await Analysis.findById(analysis._id);
      return res.status(200).json({
        success: true,
        message: freshAnalysis.status === 'completed' ? 'Analysis completed' : 'Analysis processing finished',
        data: {
          analysisId: freshAnalysis._id,
          status: freshAnalysis.status,
          analysis: freshAnalysis,
        },
      });
    }

    // Otherwise, dispatch asynchronous execution and return processing status immediately
    executeAnalysis(analysis._id, aiPayload).catch((err) => {
      console.error('[Analysis Controller] Uncaught background analysis error:', err.message);
    });

    return res.status(202).json({
      success: true,
      message: 'Candidate profile analysis initialized and processing',
      data: {
        analysisId: analysis._id,
        status: analysis.status,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve analysis result by ID
 * GET /api/analysis/:id
 */
async function getAnalysisById(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis ID (must be a valid 24-character hexadecimal MongoDB ID)',
      });
    }

    const analysis = await Analysis.findById(id);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: `Analysis record not found with ID '${id}'`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Analysis record retrieved successfully',
      data: {
        analysis,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Check AI service connectivity
 * GET /api/ai/health
 */
async function getAiHealth(req, res, next) {
  try {
    const healthResult = await aiService.checkAiHealth();

    if (healthResult.available) {
      return res.status(200).json({
        success: true,
        message: 'AI service is available and healthy',
        data: {
          aiService: 'available',
        },
      });
    }


    return res.status(503).json({
      success: false,
      error: healthResult.error || 'AI service unavailable',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  startAnalysis,
  getAnalysisById,
  getAiHealth,
  executeAnalysis,
};
