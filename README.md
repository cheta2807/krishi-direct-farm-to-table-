# 🌾 KrishiDirect | Full-Stack Farm-to-Table E-Commerce & Traceability Platform

🔗 **Live Frontend:** [https://krishidirect-farm-to-table-ezp2.vercel.app/](https://krishidirect-farm-to-table-ezp2.vercel.app/)

A complete full-stack Farm-to-Table e-commerce and supply-chain traceability web application built with **React.js**, **Tailwind CSS**, **Leaflet Maps**, **FastAPI**, and **SQLAlchemy**.

---

## 🏗️ Monorepo Structure

```text
krishidirect-fullstack/
├── backend/                  # FastAPI REST API + JWT Auth + SQLAlchemy Database
│   ├── main.py               # Auth endpoints (/login, /signup), Batches & Orders API
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React + Vite + Tailwind + Leaflet Map Frontend
│   ├── src/
│   │   ├── App.jsx           # Connected to FastAPI with JWT Auth & Home Delivery Checkout
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env                  # VITE_API_BASE_URL configuration
│   ├── index.html
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## 🚀 How to Run Locally (Full-Stack)

### 1. Start the FastAPI Backend
```bash
cd backend
python -m venv venv
# Activate on Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*API Docs available at `http://localhost:8000/docs`*  
*Demo Login Account: `chetan@krishidirect.in` / `demo123`*

### 2. Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 👨‍💻 Developer
**Chetan Sudhir Patil**  
Full-Stack Developer | Python (FastAPI, Django) • React.js • PostgreSQL
