import os
from fastapi import FastAPI, Header, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import httpx
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ─── Task 2: Ensure DATABASE_URL uses internal hostname ───
DATABASE_URL = os.getenv("DATABASE_URL", "")
if "proxy.rlwy.net" in DATABASE_URL:
    # DJ: Railway internal hostname update for performance & stability
    DATABASE_URL = DATABASE_URL.replace("proxy.rlwy.net", "railway.internal")

ADZUNA_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_KEY = os.getenv("ADZUNA_APP_KEY")

# SQLAlchemy setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class JobDB(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(String)
    title = Column(String)
    company = Column(String)
    location = Column(String)
    is_remote = Column(Boolean, default=False)
    source = Column(String)
    apply_url = Column(String)
    salary = Column(String)

app = FastAPI(title="Career OS Backend")

async def fetch_adzuna_jobs(profile_id: str):
    """Fetches jobs with Task 1: Broader keywords retry and Task 4: console.log debugging"""
    countries = ["us"] if profile_id == "dj" else ["gb", "ca", "de", "au"]
    
    # Broad keywords to fallback to if primary search returns 0
    primary_what = "IT Audit" if profile_id == "dj" else "Cardiovascular Research"
    broad_what = "Audit" if profile_id == "dj" else "Biology Research"
    
    results = []
    async with httpx.AsyncClient() as client:
        for country in countries:
            for what in [primary_what, broad_what]:
                url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
                params = {
                    "app_id": ADZUNA_ID,
                    "app_key": ADZUNA_KEY,
                    "what": what,
                    "content-type": "application/json"
                }
                try:
                    resp = await client.get(url, params=params)
                    data = resp.json()
                    res_list = data.get("results", [])
                    
                    # ─── Task 4: Specific console.log request ───
                    print(f"console.log: Adzuna response: {resp.status_code}, length: {len(res_list)}")
                    
                    if resp.status_code == 200 and len(res_list) > 0:
                        results.extend(res_list)
                        break # Found results, skip broader keyword for this country
                except Exception as e:
                    print(f"Adzuna fetch error: {e}")
                    continue
    return results

async def background_sync_jobs(profile_id: str):
    """BackgroundTask to prevent timeouts (Task 3) with deduplication hardening"""
    live_market_data = await fetch_adzuna_jobs(profile_id)
    db = SessionLocal()
    try:
        # ─── Hardening: Clear old market results for this profile to prevent duplicates ───
        db.query(JobDB).filter(JobDB.profile_id == profile_id, JobDB.source == "adzuna").delete()
        
        for r in live_market_data:
            # Simple ingestion into 'jobs' table
            job = JobDB(
                profile_id=profile_id,
                title=r.get("title"),
                company=r.get("company", {}).get("display_name"),
                location=r.get("location", {}).get("display_name"),
                is_remote="remote" in (r.get("title", "").lower() + r.get("description", "").lower()),
                source="adzuna",
                apply_url=r.get("redirect_url"),
                salary=f"{r.get('salary_min')} - {r.get('salary_max')}" if r.get('salary_min') else "Not disclosed"
            )
            db.add(job)
        db.commit()
        print(f"Sync complete: {len(live_market_data)} market jobs updated for {profile_id}")
    except Exception as e:
        db.rollback()
        print(f"Sync error: {e}")
    finally:
        db.close()

@app.get("/jobs")
async def get_jobs(background_tasks: BackgroundTasks, x_profile_id: str = Header("dj")):
    """Retrieves cached results and triggers background update (Task 3)"""
    db = SessionLocal()
    try:
        # Get all jobs for this profile from DB
        all_jobs = db.query(JobDB).filter(JobDB.profile_id == x_profile_id).all()
        
        # Trigger background refresh to keep data fresh without blocking
        background_tasks.add_task(background_sync_jobs, x_profile_id)
        
        return {
            "leads": [j for j in all_jobs if j.source != "adzuna"],
            "market": [j for j in all_jobs if j.source == "adzuna"]
        }
    finally:
        db.close()
