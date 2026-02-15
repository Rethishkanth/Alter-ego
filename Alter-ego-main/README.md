# ALTER-EGO: Social Media Avatar Analyzer

A full-stack application that analyzes your YouTube Watch History to create an interactive "AI-Twin" avatar. The system ingests your data, identifies behavioral patterns using AI, and allows you to have a voice conversation with your algorithmic self.

## Features
- **Data Ingestion**: Securely upload your YouTube `watch-history.json` (via Google Takeout).
- **AI Analysis**:
  - **Sentiment Analysis**: Understanding the emotional tone of your content consumption.
  - **Topic Clustering**: Grouping videos into core interest areas.
  - **Summarization**: Generating a behavioral profile using GPT-4.
- **Interactive Avatar**: A 3D character that speaks to you, referencing your actual viewing history as evidence.
- **Privacy-First**: Data is processed locally/temporarily and not stored permanently.

## Tech Stack
- **Backend**: Python, FastAPI, SQLAlchemy (PostgreSQL), Pinecone (Vector DB), OpenAI GPT-4, Transformers.
- **Frontend**: React, Vite, TailwindCSS, Three.js (R3F), Web Speech API.

## Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL
- Pinecone Account (API Key)
- OpenAI Account (API Key)

## Installation & Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

**Configuration**:
1. Rename `.env.example` to `.env`.
2. Fill in your API keys (`DATABASE_URL`, `PINECONE_API_KEY`, `OPENAI_API_KEY`, etc.).

**Initialize Database**:
```bash
python setup_db.py
```

**Run Server**:
```bash
python main.py
# Server will start at http://localhost:8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

**Configuration**:
1. Rename `.env.example` to `.env` (Defaults should work).

**Run Client**:
```bash
npm run dev
# App will open at http://localhost:3000
```

### 3. Chrome Extension Setup
1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" (top right).
3. Click "Load unpacked" and select the `extension` folder in this repository.
4. The extension "Social Transcription Extension" should now appear in your list.

## Usage Guide
1. **Export Data**: Go to Google Takeout, export "YouTube and YouTube Music" (specifically "history").
2. **Upload**: Drop the `Takeout.zip` file into the app.
3. **Analyze**: Wait for the AI to process your history (Setup DB, embeddings, etc.).
4. **Interact**: Chat with your avatar! Ask "What do I watch when I'm sad?" or "Show me my obsession with cats."

## License
MIT
