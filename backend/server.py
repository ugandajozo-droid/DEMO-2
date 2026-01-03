from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.responses import FileResponse
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import aiofiles
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME')]

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'pocketbuddy-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# LLM settings
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# File upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="PocketBuddy API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserRole:
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class RegistrationStatus:
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_approved: bool
    is_active: bool
    grade_id: Optional[str] = None
    class_id: Optional[str] = None
    created_at: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    grade_id: Optional[str] = None
    class_id: Optional[str] = None
    is_active: Optional[bool] = None

# Grade Models
class GradeCreate(BaseModel):
    name: str
    order: int = 1

class GradeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    order: int
    created_at: str

# Class Models
class ClassCreate(BaseModel):
    name: str
    grade_id: str

class ClassResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    grade_id: str
    created_at: str

# Subject Models
class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class SubjectResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: Optional[str] = None
    created_at: str

# Teacher Subject Assignment
class TeacherSubjectCreate(BaseModel):
    subject_id: str
    grade_id: Optional[str] = None

# AI Source Models
class AISourceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    uploaded_by_user_id: str
    uploaded_by_name: Optional[str] = None
    subject_id: Optional[str] = None
    subject_name: Optional[str] = None
    grade_id: Optional[str] = None
    grade_name: Optional[str] = None
    file_name: str
    file_path: str
    description: Optional[str] = None
    is_active: bool
    created_at: str

class AISourceUpdate(BaseModel):
    description: Optional[str] = None
    subject_id: Optional[str] = None
    grade_id: Optional[str] = None
    is_active: Optional[bool] = None

# Chat Models
class ChatCreate(BaseModel):
    title: str = "Nová konverzácia"

class ChatResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    title: str
    created_at: str
    updated_at: str
    is_deleted: bool

class MessageCreate(BaseModel):
    content: str
    attachment_ids: Optional[List[str]] = None

class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    chat_id: str
    sender_type: str
    content: str
    created_at: str
    attachments: Optional[List[dict]] = None

# Chat File Upload Model
class ChatAttachmentResponse(BaseModel):
    id: str
    file_name: str
    file_type: str
    file_path: str

# Registration Request Models
class RegistrationRequestResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    first_name: str
    last_name: str
    role_requested: str
    status: str
    created_at: str

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token vypršal")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Neplatný token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Používateľ nebol nájdený")
    if not user.get("is_active"):
        raise HTTPException(status_code=403, detail="Váš účet bol deaktivovaný")
    return user

async def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Prístup povolený len pre administrátorov")
    return user

async def require_teacher(user: dict = Depends(get_current_user)):
    if user["role"] not in [UserRole.ADMIN, UserRole.TEACHER]:
        raise HTTPException(status_code=403, detail="Prístup povolený len pre učiteľov")
    return user

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Používateľ s touto emailovou adresou už existuje")
    
    # Create registration request
    request_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Create user with pending approval
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role if user_data.role in [UserRole.STUDENT, UserRole.TEACHER] else UserRole.STUDENT,
        "is_approved": False,
        "is_active": False,
        "grade_id": None,
        "class_id": None,
        "created_at": now,
        "updated_at": now
    }
    
    registration_doc = {
        "id": request_id,
        "user_id": user_id,
        "email": user_data.email,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role_requested": user_data.role,
        "status": RegistrationStatus.PENDING,
        "created_at": now,
        "updated_at": now,
        "processed_by_admin_id": None
    }
    
    await db.users.insert_one(user_doc)
    await db.registration_requests.insert_one(registration_doc)
    
    return {"message": "Registrácia bola odoslaná. Čakáte na schválenie administrátorom."}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Nesprávne prihlasovacie údaje")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Nesprávne prihlasovacie údaje")
    
    if not user.get("is_approved"):
        raise HTTPException(status_code=403, detail="Váš účet ešte nebol schválený administrátorom")
    
    if not user.get("is_active"):
        raise HTTPException(status_code=403, detail="Váš účet bol deaktivovaný")
    
    token = create_token(user["id"], user["email"], user["role"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "role": user["role"],
            "is_approved": user["is_approved"],
            "is_active": user["is_active"],
            "grade_id": user.get("grade_id"),
            "class_id": user.get("class_id")
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

# ==================== ADMIN ENDPOINTS ====================

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [UserResponse(**u) for u in users]

@api_router.get("/admin/registration-requests", response_model=List[RegistrationRequestResponse])
async def get_registration_requests(admin: dict = Depends(require_admin)):
    requests = await db.registration_requests.find({"status": RegistrationStatus.PENDING}, {"_id": 0}).to_list(1000)
    return [RegistrationRequestResponse(**r) for r in requests]

@api_router.post("/admin/approve/{request_id}")
async def approve_registration(request_id: str, admin: dict = Depends(require_admin)):
    request = await db.registration_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Žiadosť nebola nájdená")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update user
    await db.users.update_one(
        {"id": request["user_id"]},
        {"$set": {"is_approved": True, "is_active": True, "updated_at": now}}
    )
    
    # Update request
    await db.registration_requests.update_one(
        {"id": request_id},
        {"$set": {"status": RegistrationStatus.APPROVED, "processed_by_admin_id": admin["id"], "updated_at": now}}
    )
    
    return {"message": "Registrácia bola schválená"}

@api_router.post("/admin/reject/{request_id}")
async def reject_registration(request_id: str, admin: dict = Depends(require_admin)):
    request = await db.registration_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Žiadosť nebola nájdená")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Delete user
    await db.users.delete_one({"id": request["user_id"]})
    
    # Update request
    await db.registration_requests.update_one(
        {"id": request_id},
        {"$set": {"status": RegistrationStatus.REJECTED, "processed_by_admin_id": admin["id"], "updated_at": now}}
    )
    
    return {"message": "Registrácia bola zamietnutá"}

@api_router.put("/admin/users/{user_id}")
async def update_user(user_id: str, update: UserUpdate, admin: dict = Depends(require_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Používateľ nebol nájdený")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    return {"message": "Používateľ bol aktualizovaný"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Nemôžete zmazať svoj vlastný účet")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Používateľ nebol nájdený")
    
    # Delete related data
    await db.chats.delete_many({"user_id": user_id})
    await db.messages.delete_many({"sender_user_id": user_id})
    
    return {"message": "Používateľ bol zmazaný"}

@api_router.post("/admin/users/{user_id}/deactivate")
async def deactivate_user(user_id: str, admin: dict = Depends(require_admin)):
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Účet bol deaktivovaný"}

@api_router.post("/admin/users/{user_id}/activate")
async def activate_user(user_id: str, admin: dict = Depends(require_admin)):
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Účet bol aktivovaný"}

@api_router.post("/admin/users/{user_id}/promote-grade")
async def promote_student_grade(user_id: str, admin: dict = Depends(require_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Používateľ nebol nájdený")
    
    if user["role"] != UserRole.STUDENT:
        raise HTTPException(status_code=400, detail="Len študentov je možné preradiť")
    
    current_grade_id = user.get("grade_id")
    if not current_grade_id:
        raise HTTPException(status_code=400, detail="Študent nemá priradený ročník")
    
    current_grade = await db.grades.find_one({"id": current_grade_id}, {"_id": 0})
    if not current_grade:
        raise HTTPException(status_code=404, detail="Aktuálny ročník nebol nájdený")
    
    next_grade = await db.grades.find_one({"order": current_grade["order"] + 1}, {"_id": 0})
    if not next_grade:
        raise HTTPException(status_code=400, detail="Študent je už v najvyššom ročníku")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"grade_id": next_grade["id"], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": f"Študent bol preradený do ročníka: {next_grade['name']}"}

# ==================== GRADES ENDPOINTS ====================

@api_router.get("/grades", response_model=List[GradeResponse])
async def get_grades(user: dict = Depends(get_current_user)):
    grades = await db.grades.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return [GradeResponse(**g) for g in grades]

@api_router.post("/grades", response_model=GradeResponse)
async def create_grade(grade: GradeCreate, admin: dict = Depends(require_admin)):
    grade_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    grade_doc = {
        "id": grade_id,
        "name": grade.name,
        "order": grade.order,
        "created_at": now,
        "updated_at": now
    }
    
    await db.grades.insert_one(grade_doc)
    return GradeResponse(**grade_doc)

@api_router.delete("/grades/{grade_id}")
async def delete_grade(grade_id: str, admin: dict = Depends(require_admin)):
    result = await db.grades.delete_one({"id": grade_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ročník nebol nájdený")
    return {"message": "Ročník bol zmazaný"}

# ==================== CLASSES ENDPOINTS ====================

@api_router.get("/classes", response_model=List[ClassResponse])
async def get_classes(user: dict = Depends(get_current_user)):
    classes = await db.classes.find({}, {"_id": 0}).to_list(100)
    return [ClassResponse(**c) for c in classes]

@api_router.post("/classes", response_model=ClassResponse)
async def create_class(class_data: ClassCreate, admin: dict = Depends(require_admin)):
    class_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    class_doc = {
        "id": class_id,
        "name": class_data.name,
        "grade_id": class_data.grade_id,
        "created_at": now,
        "updated_at": now
    }
    
    await db.classes.insert_one(class_doc)
    return ClassResponse(**class_doc)

@api_router.delete("/classes/{class_id}")
async def delete_class(class_id: str, admin: dict = Depends(require_admin)):
    result = await db.classes.delete_one({"id": class_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trieda nebola nájdená")
    return {"message": "Trieda bola zmazaná"}

# ==================== SUBJECTS ENDPOINTS ====================

@api_router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects(user: dict = Depends(get_current_user)):
    subjects = await db.subjects.find({}, {"_id": 0}).to_list(100)
    return [SubjectResponse(**s) for s in subjects]

@api_router.post("/subjects", response_model=SubjectResponse)
async def create_subject(subject: SubjectCreate, admin: dict = Depends(require_admin)):
    subject_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    subject_doc = {
        "id": subject_id,
        "name": subject.name,
        "description": subject.description,
        "created_at": now,
        "updated_at": now
    }
    
    await db.subjects.insert_one(subject_doc)
    return SubjectResponse(**subject_doc)

@api_router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str, admin: dict = Depends(require_admin)):
    result = await db.subjects.delete_one({"id": subject_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Predmet nebol nájdený")
    return {"message": "Predmet bol zmazaný"}

# ==================== TEACHER SUBJECTS ENDPOINTS ====================

@api_router.get("/teacher/my-subjects")
async def get_teacher_subjects(teacher: dict = Depends(require_teacher)):
    assignments = await db.teacher_subjects.find({"teacher_id": teacher["id"]}, {"_id": 0}).to_list(100)
    
    result = []
    for assignment in assignments:
        subject = await db.subjects.find_one({"id": assignment["subject_id"]}, {"_id": 0})
        grade = await db.grades.find_one({"id": assignment.get("grade_id")}, {"_id": 0}) if assignment.get("grade_id") else None
        
        result.append({
            "id": assignment["id"],
            "subject": subject,
            "grade": grade,
            "created_at": assignment["created_at"]
        })
    
    return result

@api_router.post("/teacher/my-subjects")
async def assign_teacher_subject(assignment: TeacherSubjectCreate, teacher: dict = Depends(require_teacher)):
    assignment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    assignment_doc = {
        "id": assignment_id,
        "teacher_id": teacher["id"],
        "subject_id": assignment.subject_id,
        "grade_id": assignment.grade_id,
        "created_at": now,
        "updated_at": now
    }
    
    await db.teacher_subjects.insert_one(assignment_doc)
    return {"message": "Predmet bol priradený", "id": assignment_id}

@api_router.delete("/teacher/my-subjects/{assignment_id}")
async def remove_teacher_subject(assignment_id: str, teacher: dict = Depends(require_teacher)):
    result = await db.teacher_subjects.delete_one({"id": assignment_id, "teacher_id": teacher["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Priradenie nebolo nájdené")
    return {"message": "Priradenie bolo zmazané"}

# ==================== AI SOURCES ENDPOINTS ====================

@api_router.get("/ai-sources", response_model=List[AISourceResponse])
async def get_ai_sources(user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] == UserRole.TEACHER:
        query["uploaded_by_user_id"] = user["id"]
    
    sources = await db.ai_sources.find(query, {"_id": 0}).to_list(1000)
    
    result = []
    for source in sources:
        uploader = await db.users.find_one({"id": source["uploaded_by_user_id"]}, {"_id": 0})
        subject = await db.subjects.find_one({"id": source.get("subject_id")}, {"_id": 0}) if source.get("subject_id") else None
        grade = await db.grades.find_one({"id": source.get("grade_id")}, {"_id": 0}) if source.get("grade_id") else None
        
        result.append(AISourceResponse(
            **source,
            uploaded_by_name=f"{uploader['first_name']} {uploader['last_name']}" if uploader else None,
            subject_name=subject["name"] if subject else None,
            grade_name=grade["name"] if grade else None
        ))
    
    return result

@api_router.post("/ai-sources/upload")
async def upload_ai_source(
    file: UploadFile = File(...),
    description: str = Form(None),
    subject_id: str = Form(None),
    grade_id: str = Form(None),
    user: dict = Depends(require_teacher)
):
    source_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Save file
    file_ext = Path(file.filename).suffix if file.filename else ''
    file_path = UPLOAD_DIR / f"{source_id}{file_ext}"
    
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
    except Exception as e:
        logger.error(f"File upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Chyba pri nahrávaní súboru")
    
    source_doc = {
        "id": source_id,
        "uploaded_by_user_id": user["id"],
        "subject_id": subject_id if subject_id and subject_id != '' else None,
        "grade_id": grade_id if grade_id and grade_id != '' else None,
        "file_name": file.filename,
        "file_path": str(file_path),
        "description": description if description else None,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    
    await db.ai_sources.insert_one(source_doc)
    
    return {"message": "Súbor bol nahraný", "id": source_id, "file_name": file.filename}

@api_router.put("/ai-sources/{source_id}")
async def update_ai_source(source_id: str, update: AISourceUpdate, user: dict = Depends(require_teacher)):
    query = {"id": source_id}
    if user["role"] != UserRole.ADMIN:
        query["uploaded_by_user_id"] = user["id"]
    
    source = await db.ai_sources.find_one(query, {"_id": 0})
    if not source:
        raise HTTPException(status_code=404, detail="Zdroj nebol nájdený")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.ai_sources.update_one({"id": source_id}, {"$set": update_data})
    return {"message": "Zdroj bol aktualizovaný"}

@api_router.delete("/ai-sources/{source_id}")
async def delete_ai_source(source_id: str, user: dict = Depends(require_teacher)):
    query = {"id": source_id}
    if user["role"] != UserRole.ADMIN:
        query["uploaded_by_user_id"] = user["id"]
    
    source = await db.ai_sources.find_one(query, {"_id": 0})
    if not source:
        raise HTTPException(status_code=404, detail="Zdroj nebol nájdený")
    
    # Delete file
    try:
        os.remove(source["file_path"])
    except:
        pass
    
    await db.ai_sources.delete_one({"id": source_id})
    return {"message": "Zdroj bol zmazaný"}

# ==================== CHAT ENDPOINTS ====================

@api_router.get("/chats", response_model=List[ChatResponse])
async def get_chats(user: dict = Depends(get_current_user)):
    chats = await db.chats.find(
        {"user_id": user["id"], "is_deleted": False},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    return [ChatResponse(**c) for c in chats]

@api_router.post("/chats", response_model=ChatResponse)
async def create_chat(chat_data: ChatCreate, user: dict = Depends(get_current_user)):
    chat_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    chat_doc = {
        "id": chat_id,
        "user_id": user["id"],
        "title": chat_data.title,
        "created_at": now,
        "updated_at": now,
        "is_deleted": False
    }
    
    await db.chats.insert_one(chat_doc)
    return ChatResponse(**chat_doc)

@api_router.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str, user: dict = Depends(get_current_user)):
    result = await db.chats.update_one(
        {"id": chat_id, "user_id": user["id"]},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Konverzácia nebola nájdená")
    return {"message": "Konverzácia bola zmazaná"}

@api_router.get("/chats/{chat_id}/messages", response_model=List[MessageResponse])
async def get_chat_messages(chat_id: str, user: dict = Depends(get_current_user)):
    chat = await db.chats.find_one({"id": chat_id, "user_id": user["id"]}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Konverzácia nebola nájdená")
    
    messages = await db.messages.find({"chat_id": chat_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    
    result = []
    for msg in messages:
        attachments = await db.attachments.find({"message_id": msg["id"]}, {"_id": 0}).to_list(10)
        result.append(MessageResponse(**msg, attachments=attachments))
    
    return result

@api_router.post("/chats/{chat_id}/messages")
async def send_message(chat_id: str, message: MessageCreate, user: dict = Depends(get_current_user)):
    chat = await db.chats.find_one({"id": chat_id, "user_id": user["id"]}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Konverzácia nebola nájdená")
    
    now = datetime.now(timezone.utc).isoformat()
    user_msg_id = str(uuid.uuid4())
    
    # Save user message
    user_msg_doc = {
        "id": user_msg_id,
        "chat_id": chat_id,
        "sender_type": "user",
        "sender_user_id": user["id"],
        "content": message.content,
        "created_at": now
    }
    await db.messages.insert_one(user_msg_doc)
    
    # Get conversation history
    history = await db.messages.find({"chat_id": chat_id}, {"_id": 0}).sort("created_at", 1).to_list(50)
    
    # Get active AI sources for context
    sources_query = {"is_active": True}
    if user["role"] == UserRole.STUDENT:
        if user.get("grade_id"):
            sources_query["$or"] = [
                {"grade_id": user["grade_id"]},
                {"grade_id": None}
            ]
    
    ai_sources = await db.ai_sources.find(sources_query, {"_id": 0}).to_list(100)
    
    # Build system message with context
    system_message = """Si PocketBuddy, priateľský a inteligentný AI asistent pre slovenské stredné školy. 😊

Tvoje hlavné vlastnosti:
- Komunikuješ po slovensky
- Si trpezlivý a povzbudzujúci 💪
- Vysvetľuješ veci jednoducho a zrozumiteľne
- Pri matematických úlohách vysvetľuješ krok po kroku, ako keby si učil bežného stredoškoláka
- Nepoužívaš príliš formálny alebo akademický jazyk
- Si tu, aby si pomohol študentom pochopiť látku, nie len dal odpovede
- Používaš emotikony na oživenie konverzácie 🎓📚✨
- NIKDY nepoužívaj hviezdičky (**) na formátovanie textu, píš normálne

Pri riešení matematických úloh:
1. Najprv vysvetli, čo je úlohou 🤔
2. Ukáž riešenie krok po kroku
3. Pri každom kroku vysvetli PREČO sa robí daný krok
4. Na konci zhrň riešenie ✅

Buď priateľský a používaj emotikony! 😄
"""
    
    if ai_sources:
        system_message += "\nMáš prístup k nasledujúcim študijným materiálom:\n"
        for source in ai_sources[:10]:
            system_message += f"- {source['file_name']}"
            if source.get('description'):
                system_message += f": {source['description']}"
            system_message += "\n"
    
    # Call AI
    try:
        llm_chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=chat_id,
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        # Build conversation for context
        for msg in history[-10:]:
            if msg["sender_type"] == "user":
                await llm_chat.send_message(UserMessage(text=msg["content"]))
        
        # Reinitialize for clean response
        llm_chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"{chat_id}-{now}",
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        ai_response = await llm_chat.send_message(UserMessage(text=message.content))
        
    except Exception as e:
        logger.error(f"AI Error: {str(e)}")
        ai_response = "Ospravedlňujem sa, momentálne mám technické problémy. Skús to prosím znova neskôr."
    
    # Save AI response
    ai_msg_id = str(uuid.uuid4())
    ai_now = datetime.now(timezone.utc).isoformat()
    
    ai_msg_doc = {
        "id": ai_msg_id,
        "chat_id": chat_id,
        "sender_type": "ai",
        "sender_user_id": None,
        "content": ai_response,
        "created_at": ai_now
    }
    await db.messages.insert_one(ai_msg_doc)
    
    # Update chat timestamp
    await db.chats.update_one({"id": chat_id}, {"$set": {"updated_at": ai_now}})
    
    return {
        "user_message": MessageResponse(**user_msg_doc, attachments=[]),
        "ai_message": MessageResponse(**ai_msg_doc, attachments=[])
    }

# ==================== FILE UPLOAD FOR CHAT ====================

@api_router.post("/chat/attachments/upload")
async def upload_chat_attachment(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    attachment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Save file
    file_ext = Path(file.filename).suffix if file.filename else ''
    file_path = UPLOAD_DIR / f"chat_{attachment_id}{file_ext}"
    
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
    except Exception as e:
        logger.error(f"Chat attachment upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Chyba pri nahrávaní súboru")
    
    attachment_doc = {
        "id": attachment_id,
        "message_id": None,
        "uploaded_by_user_id": user["id"],
        "file_name": file.filename,
        "file_path": str(file_path),
        "file_type": file.content_type or "application/octet-stream",
        "created_at": now
    }
    
    await db.chat_attachments.insert_one(attachment_doc)
    
    return {"id": attachment_id, "file_name": file.filename, "file_type": file.content_type}

@api_router.post("/attachments/upload")
async def upload_attachment(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    attachment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Save file
    file_ext = Path(file.filename).suffix
    file_path = UPLOAD_DIR / f"attachment_{attachment_id}{file_ext}"
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    attachment_doc = {
        "id": attachment_id,
        "message_id": None,
        "uploaded_by_user_id": user["id"],
        "file_name": file.filename,
        "file_path": str(file_path),
        "file_type": file.content_type,
        "created_at": now
    }
    
    await db.attachments.insert_one(attachment_doc)
    
    return {"id": attachment_id, "file_name": file.filename, "file_type": file.content_type}

@api_router.get("/attachments/{attachment_id}")
async def download_attachment(attachment_id: str, user: dict = Depends(get_current_user)):
    attachment = await db.attachments.find_one({"id": attachment_id}, {"_id": 0})
    if not attachment:
        raise HTTPException(status_code=404, detail="Príloha nebola nájdená")
    
    return FileResponse(attachment["file_path"], filename=attachment["file_name"])

# ==================== STATISTICS ====================

@api_router.get("/admin/statistics")
async def get_statistics(admin: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    students = await db.users.count_documents({"role": UserRole.STUDENT})
    teachers = await db.users.count_documents({"role": UserRole.TEACHER})
    pending_requests = await db.registration_requests.count_documents({"status": RegistrationStatus.PENDING})
    total_sources = await db.ai_sources.count_documents({})
    total_chats = await db.chats.count_documents({"is_deleted": False})
    
    return {
        "total_users": total_users,
        "students": students,
        "teachers": teachers,
        "pending_requests": pending_requests,
        "total_sources": total_sources,
        "total_chats": total_chats
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Create initial admin user and sample data"""
    # Check if admin exists
    admin = await db.users.find_one({"role": UserRole.ADMIN})
    if admin:
        return {"message": "Dáta už existujú"}
    
    now = datetime.now(timezone.utc).isoformat()
    admin_id = str(uuid.uuid4())
    
    # Create admin user
    admin_doc = {
        "id": admin_id,
        "email": "admin@pocketbuddy.sk",
        "password_hash": hash_password("admin123"),
        "first_name": "Admin",
        "last_name": "PocketBuddy",
        "role": UserRole.ADMIN,
        "is_approved": True,
        "is_active": True,
        "grade_id": None,
        "class_id": None,
        "created_at": now,
        "updated_at": now
    }
    await db.users.insert_one(admin_doc)
    
    # Create grades
    grades = [
        {"id": str(uuid.uuid4()), "name": "1. ročník", "order": 1, "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "2. ročník", "order": 2, "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "3. ročník", "order": 3, "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "4. ročník", "order": 4, "created_at": now, "updated_at": now},
    ]
    await db.grades.insert_many(grades)
    
    # Create subjects - full list of Slovak high school subjects
    subjects = [
        {"id": str(uuid.uuid4()), "name": "Matematika", "description": "Algebra, geometria, funkcie, pravdepodobnosť", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Slovenský jazyk a literatúra", "description": "Gramatika, sloh, literatúra", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Anglický jazyk", "description": "Angličtina pre stredné školy", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Nemecký jazyk", "description": "Nemčina pre stredné školy", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Francúzsky jazyk", "description": "Francúzština pre stredné školy", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Ruský jazyk", "description": "Ruština pre stredné školy", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Fyzika", "description": "Mechanika, termodynamika, elektrina, optika", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Chémia", "description": "Organická a anorganická chémia, biochémia", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Biológia", "description": "Botanika, zoológia, anatómia, genetika", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Geografia", "description": "Fyzická a humánna geografia", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Dejepis", "description": "Svetové a slovenské dejiny", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Občianska náuka", "description": "Právo, politológia, sociológia", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Informatika", "description": "Programovanie, databázy, siete", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Ekonomika", "description": "Základy ekonómie a podnikania", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Účtovníctvo", "description": "Finančné a manažérske účtovníctvo", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Telesná výchova", "description": "Šport a zdravý životný štýl", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Výtvarná výchova", "description": "Kresba, maľba, dejiny umenia", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Hudobná výchova", "description": "Hudba, spev, dejiny hudby", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Etická výchova", "description": "Morálka, etika, hodnoty", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Náboženská výchova", "description": "Náboženstvo a duchovné hodnoty", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Psychológia", "description": "Základy psychológie", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Filozofia", "description": "Dejiny filozofie, logika", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Technická výchova", "description": "Technické kreslenie, práca s materiálmi", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Administratíva a korešpondencia", "description": "Písomná komunikácia, kancelárska práca", "created_at": now, "updated_at": now},
    ]
    await db.subjects.insert_many(subjects)
    
    # Create sample classes
    classes = [
        {"id": str(uuid.uuid4()), "name": "1.A", "grade_id": grades[0]["id"], "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "1.B", "grade_id": grades[0]["id"], "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "2.A", "grade_id": grades[1]["id"], "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "2.B", "grade_id": grades[1]["id"], "created_at": now, "updated_at": now},
    ]
    await db.classes.insert_many(classes)
    
    return {
        "message": "Dáta boli vytvorené",
        "admin_email": "admin@pocketbuddy.sk",
        "admin_password": "admin123"
    }

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "PocketBuddy API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
