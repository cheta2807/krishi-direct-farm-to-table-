import os
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from passlib.context import CryptContext
import jwt

# Database Setup (SQLite local by default, easily switchable to PostgreSQL via DATABASE_URL)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./krishidirect.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security & JWT Config
SECRET_KEY = os.getenv("SECRET_KEY", "krishidirect_super_secret_portfolio_key_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# ==========================================
# SQLAlchemy Models
# ==========================================
class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Customer")  # Customer | Farmer | Admin

class BatchDB(Base):
    __tablename__ = "batches"
    id = Column(String, primary_key=True, index=True)
    crop = Column(String, nullable=False)
    category = Column(String, nullable=False)
    farmer = Column(String, nullable=False)
    location = Column(String, nullable=False)
    coords = Column(String, default="19.9975° N, 73.7898° E")
    quantityKg = Column(Float, nullable=False)
    pricePerKg = Column(Float, nullable=False)
    harvestDate = Column(String, nullable=False)
    qualityGrade = Column(String, nullable=False)
    status = Column(String, default="Harvested")
    image = Column(String, nullable=False)

class OrderDB(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, index=True)
    customerName = Column(String, nullable=False)
    customerEmail = Column(String, nullable=False)
    items = Column(String, nullable=False)
    total = Column(Float, nullable=False)
    batchCode = Column(String, nullable=False)
    status = Column(String, default="Processing at Farm")
    address = Column(String, nullable=False)
    paymentMethod = Column(String, default="UPI / Google Pay")

Base.metadata.create_all(bind=engine)

# ==========================================
# Pydantic Schemas
# ==========================================
class UserSignup(BaseModel):
    name: str
    email: str
    password: str
    role: str = "Customer"

class UserLogin(BaseModel):
    email: str
    password: str

class BatchCreate(BaseModel):
    id: str
    crop: str
    category: str
    farmer: str
    location: str
    coords: Optional[str] = "19.9975° N, 73.7898° E"
    quantityKg: float
    pricePerKg: float
    harvestDate: str
    qualityGrade: str
    status: str = "Harvested"
    image: str

class StatusUpdate(BaseModel):
    status: str

class OrderCreate(BaseModel):
    id: str
    customerName: str
    customerEmail: Optional[str] = "guest@krishidirect.in"
    items: str
    total: float
    batchCode: str
    status: str = "Processing at Farm"
    address: str
    paymentMethod: str = "UPI / Google Pay"

# ==========================================
# FastAPI App & CORS
# ==========================================
app = FastAPI(title="KrishiDirect Full-Stack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Seed Initial Data on Startup
@app.on_event("startup")
def seed_initial_data():
    db = SessionLocal()
    if db.query(BatchDB).count() == 0:
        initial_batches = [
            BatchDB(
                id="BATCH-20261119-TOM",
                crop="Heirloom Organic Tomatoes",
                category="Vegetables",
                farmer="Patil Organic Farms",
                location="Nashik, Maharashtra",
                coords="19.9975° N, 73.7898° E",
                quantityKg=140,
                pricePerKg=48,
                harvestDate="2026-11-19",
                qualityGrade="Grade A Organic",
                status="Dispatched",
                image="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80"
            ),
            BatchDB(
                id="BATCH-20261119-MILK",
                crop="A2 Desi Cow Milk (1L)",
                category="Dairy",
                farmer="Gokul Dairy Hub",
                location="Dhule, Maharashtra",
                coords="20.9042° N, 74.7749° E",
                quantityKg=50,
                pricePerKg=75,
                harvestDate="2026-11-19",
                qualityGrade="100% Grass-Fed",
                status="Packed",
                image="https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80"
            ),
            BatchDB(
                id="BATCH-20261119-WHEAT",
                crop="Lokwan Organic Wheat",
                category="Grains",
                farmer="Shirpur Agro Producers",
                location="Shirpur, Maharashtra",
                coords="21.3500° N, 74.8833° E",
                quantityKg=250,
                pricePerKg=42,
                harvestDate="2026-11-19",
                qualityGrade="Stone-Ground Certified",
                status="Harvested",
                image="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80"
            ),
            BatchDB(
                id="BATCH-20261119-SPIC",
                crop="Byadagi Kashmiri Chilli Powder",
                category="Spices",
                farmer="Konkan Spice Guild",
                location="Kolhapur, Maharashtra",
                coords="16.7050° N, 74.2433° E",
                quantityKg=30,
                pricePerKg=220,
                harvestDate="2026-11-19",
                qualityGrade="Sun-Dried Pure",
                status="Dispatched",
                image="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80"
            )
        ]
        db.add_all(initial_batches)
        db.commit()

    # Seed Demo Account (chetan@krishidirect.in / demo123)
    if not db.query(UserDB).filter(UserDB.email == "chetan@krishidirect.in").first():
        demo_user = UserDB(
            name="Chetan Sudhir Patil",
            email="chetan@krishidirect.in",
            hashed_password=pwd_context.hash("demo123"),
            role="Admin"
        )
        db.add(demo_user)
        db.commit()
    db.close()

# ==========================================
# Authentication Routes
# ==========================================
@app.post("/api/v1/auth/signup")
def signup(user: UserSignup, db: Session = Depends(get_db)):
    existing = db.query(UserDB).filter(UserDB.email == user.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered. Please log in.")
    
    new_user = UserDB(
        name=user.name,
        email=user.email.lower(),
        hashed_password=pwd_context.hash(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_access_token({"sub": new_user.email, "role": new_user.role, "name": new_user.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": new_user.id, "name": new_user.name, "email": new_user.email, "role": new_user.role}
    }

@app.post("/api/v1/auth/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == credentials.email.lower()).first()
    if not user or not pwd_context.verify(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user.email, "role": user.role, "name": user.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
    }

@app.get("/api/v1/auth/me")
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(UserDB).filter(UserDB.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ==========================================
# Harvest Batches & Inventory Routes
# ==========================================
@app.get("/api/v1/batches")
def get_batches(db: Session = Depends(get_db)):
    return db.query(BatchDB).all()[::-1]

@app.post("/api/v1/batches")
def create_batch(batch: BatchCreate, db: Session = Depends(get_db)):
    db_batch = BatchDB(**batch.model_dump())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch

@app.patch("/api/v1/batches/{batch_id}/status")
def update_batch_status(batch_id: str, payload: StatusUpdate, db: Session = Depends(get_db)):
    batch = db.query(BatchDB).filter(BatchDB.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    batch.status = payload.status
    db.commit()
    db.refresh(batch)
    return batch

# ==========================================
# Orders Routes
# ==========================================
@app.get("/api/v1/orders")
def get_orders(db: Session = Depends(get_db)):
    return db.query(OrderDB).all()[::-1]

@app.post("/api/v1/orders")
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    db_order = OrderDB(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order
