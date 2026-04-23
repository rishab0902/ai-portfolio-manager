# 🚀 Context-Aware AI Portfolio Manager

An elite, full-stack financial advisory engine that transcends traditional rule-based portfolio analyzers. Built with **FastAPI**, **React (Vite)**, and **Gemini 2.5 Flash**, this application leverages sophisticated Prompt Engineering to act as a personalized hedge fund manager.

Unlike standard apps that mindlessly recommend selling at a loss, this engine requires users to define their **Investment Goal, Risk Appetite, Time Horizon, and Emotional Bias**, allowing the AI to dynamically justify holding or rebalancing positions based on deep context and live market data.

*(Screenshot placeholder - Add a screenshot of your dashboard here!)*

## ✨ Core Features
*   **Context-Aware AI Engine:** Powered by Gemini 2.5 Flash, strictly constrained by custom prompt architectures to prevent LLM hallucinations.
*   **Dirty Data Processing:** Custom `pandas` and `openpyxl` backend parsers utilizing dynamic row-scanning to bypass junk metadata in proprietary broker statements (Groww `.xlsx` and `.csv`).
*   **Automated Zerodha Auth Handshake:** Self-healing internal authentication pipeline to seamlessly intercept Request Tokens and maintain active API access.
*   **Glassmorphism UI:** Built with React, Tailwind CSS, and Lucide Icons for a premium, highly responsive user experience.

---

## 🛠️ Tech Stack
*   **Frontend:** React 18, Vite, Tailwind CSS, Axios, Lucide React
*   **Backend:** Python 3.9+, FastAPI, Uvicorn, Pandas, Openpyxl
*   **AI & APIs:** Google Gemini 2.5 Flash, KiteConnect (Zerodha), Yahoo Finance (yfinance)

---

## 💻 Local Setup Guide (For Developers)

Follow these instructions to clone this project, add your own API keys, and run it locally.

### Prerequisites
Ensure you have the following installed on your machine before you begin:
*   **Node.js** (v18 or higher) - for the frontend React application.
*   **Python** (v3.9 or higher) - for the backend FastAPI server.
*   **Git** - for cloning the repository.
*   **Google Gemini API Key** (Free from Google AI Studio).

### 1. Clone the Repository
```bash
git clone https://github.com/rishab0902/ai-portfolio-manager.git
cd ai-portfolio-manager
```

### 2. Backend Setup
Navigate to the backend folder and create a virtual environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

#### Environment Variables
Create a `.env` file inside the `backend/` directory:
```bash
touch .env
```
Paste the following securely into your `.env` file (never commit this file to GitHub!):
```env
# Required for AI Analysis
GEMINI_API_KEY="your_gemini_api_key_here"

# Required ONLY if using the live Zerodha integration
ZERODHA_API_KEY="your_kite_api_key"
ZERODHA_API_SECRET="your_kite_api_secret"
ZERODHA_REQUEST_TOKEN="paste_daily_token_here_to_auto_exchange"
```

Start the FastAPI server:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
Open a **new terminal tab**, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```

The application will now be running at `http://localhost:5173`. You can upload a mock `.csv` or `.xlsx` file, or paste your Kite request token in the backend `.env` to connect live.

---

## 📈 How to Use the Groww Integration (No API Keys Required)
If you do not have a Zerodha Developer API key, you can still use the full power of the AI engine by uploading your Groww holding statement.

1. **Download your Statement:**
   - Log into your [Groww](https://groww.in) account (via web or app).
   - Navigate to your Profile/Reports section.
   - Download the **Holdings Statement** (it will download as an Excel `.xlsx` or `.csv` file).
2. **Upload to the Dashboard:**
   - Open your local running dashboard (`http://localhost:5173`).
   - Click the **Upload Statement** button in the top right corner.
   - Select your downloaded Groww file.
   - *(Note: The backend is engineered to automatically bypass the 10 lines of junk metadata Groww places in their Excel files!)*
3. **Run AI Analysis:**
   - Set your specific Investment Goal, Risk Appetite, and Emotional Bias using the dropdowns.
   - Click **Run Context-Aware Analysis** to generate your Hedge Fund-level strategy.

---

## 🧠 Architecture Details
- **The Payload Pipeline:** The frontend intercepts user configuration arrays (Goal, Risk, Emotion) and packages them alongside raw portfolio asset data into a unified `AnalysisRequest` Pydantic model.
- **Dynamic Header Parsing:** The backend natively handles corrupted Excel files by searching iteratively for the `Stock Name` row string, dynamically promoting it to a valid pandas dataframe header.

---
*Developed by Kumar Rishab.*
