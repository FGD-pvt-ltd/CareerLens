from fastapi import FastAPI

from routers.resume import router as resume_router
from routers.skills import router as skills_router
from routers.evidence import router as evidence_router
from routers.roles import router as roles_router
from routers.readiness import router as readiness_router
from routers.roadmap import router as roadmap_router
from routers.analysis import router as analysis_router
from routers.llm import router as llm_router
from routers.report import router as report_router
from routers.compatibility import router as compatibility_router

app = FastAPI(
    title="ProfiQ AI Service",
    description="AI/ML Microservice for Employability and Career Readiness Analysis",
    version="0.9.0",
)

# Mount resume endpoints
app.include_router(resume_router, prefix="/resume", tags=["Resume"])
app.include_router(resume_router, prefix="/api/resume", tags=["Resume"])

# Mount skill extraction endpoints
app.include_router(skills_router, prefix="/skills", tags=["Skills"])
app.include_router(skills_router, prefix="/api/skills", tags=["Skills"])

# Mount evidence verification endpoints
app.include_router(evidence_router, prefix="/evidence", tags=["Evidence"])
app.include_router(evidence_router, prefix="/api/evidence", tags=["Evidence"])

# Mount role requirements endpoints
app.include_router(roles_router, prefix="/roles", tags=["Roles"])
app.include_router(roles_router, prefix="/api/roles", tags=["Roles"])

# Mount job readiness endpoints
app.include_router(readiness_router, prefix="/readiness", tags=["Readiness"])
app.include_router(readiness_router, prefix="/api/readiness", tags=["Readiness"])

# Mount personalized roadmap endpoints
app.include_router(roadmap_router, prefix="/roadmap", tags=["Roadmap"])
app.include_router(roadmap_router, prefix="/api/roadmap", tags=["Roadmap"])

# Mount unified analysis orchestrator endpoints
app.include_router(analysis_router, prefix="/analysis", tags=["Analysis"])
app.include_router(analysis_router, prefix="/api/analysis", tags=["Analysis"])

# Mount LLM explanation endpoints
app.include_router(llm_router, prefix="/llm", tags=["LLM"])
app.include_router(llm_router, prefix="/api/llm", tags=["LLM"])

# Mount candidate readiness report endpoints
app.include_router(report_router, prefix="/report", tags=["Report"])
app.include_router(report_router, prefix="/api/report", tags=["Report"])
app.include_router(report_router, prefix="/api", tags=["Report"])
app.include_router(report_router, prefix="", tags=["Report"])

# Mount legacy backend compatibility endpoints
app.include_router(compatibility_router, prefix="/api", tags=["Compatibility"])


@app.get("/")
def read_root():
    return {
        "service": "ProfiQ AI Service",
        "status": "running",
        "version": "0.9.0",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
