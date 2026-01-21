# BuildMate — Backend

The BuildMate backend powers the AI-driven collaboration and project management platform. It handles authentication, AI matching logic, project workflows, and observability (Opik) to ensure transparent and auditable AI decisions.

---

[![License](https://img.shields.io/badge/license-MIT-blue)]() [![Built with Node.js](https://img.shields.io/badge/node-%3E%3D18-green)]()

## Table of contents
- [Overview](#overview)
- [Core responsibilities](#core-responsibilities)
- [Tech stack](#tech-stack)
- [AI matching flow](#ai-matching-flow)
- [Opik integration](#opik-integration)
- [Project structure](#project-structure)
- [Environment variables](#environment-variables)
- [Running locally](#running-locally)
- [Security & privacy](#security--privacy)
- [Contributing](#contributing)
- [License](#license)

---

## Overview
This service runs match generation, project and task APIs, user auth, and AI observability to make BuildMate's AI decisions explainable and improvable. It combines LLM-based reasoning with Opik-powered logging and evaluation to record prompts, inputs, outputs, and quality signals.

## Core responsibilities
- AI-powered team matching and match score generation
- Produce human-readable reasoning for match decisions
- Project and task management APIs (projects, invites, tasks, milestones)
- Collect user feedback to refine matching
- Log AI prompts, inputs, outputs, and quality metrics through Opik

## Tech stack
- Runtime: Node.js
- Framework: Express.js
- Database: MongoDB + Mongoose
- LLM provider(s): OpenAI / Gemini / Cerebras (pluggable)
- Observability: Opik (AI observability & evaluation)
- Auth: JWT-based authentication
- API: REST

## AI matching flow
1. User submits an idea or profile.
2. AI Matching Agent analyzes:
   - skills, experience, preferences, project goals
3. AI outputs:
   - Match score (0–100)
   - Human-readable reasoning
4. Opik records:
   - Prompt, inputs, outputs, latency, and match quality signals

## Opik integration
Opik is used to:
- Trace and audit AI prompts and responses
- Log match scores, reasoning, and evaluation metrics
- Monitor latency, errors, and drift
- Support reproducibility and model evaluation

## Project structure
backend/
├── src/  
│   ├── controllers/       # HTTP handlers  
│   ├── routes/            # Express routes  
│   ├── models/            # Mongoose models (User, Project, Match, Task)  
│   ├── services/          # Business logic & integrations  
│   │   ├── aiMatching.service.js  
│   │   └── opik.service.js  
│   ├── middlewares/       # Auth, validation, error handling  
│   ├── utils/             # Helpers, logging, encryption  
│   └── app.js             # App entry & server setup  
├── .env  
├── package.json  
└── README.md

(Adjust paths to match your implementation.)

## Environment variables
Create a `.env` file with values for:
PORT=5000  
MONGO_URI=your_mongodb_connection  
JWT_SECRET=your_secret_key  
LLM_API_KEY=your_llm_api_key  
OPIK_API_KEY=your_opik_api_key

Add a `.env.example` (no secrets) for contributors.

## Running locally
1. Install dependencies:
   npm install

2. Start the dev server:
   npm run dev

3. Server runs at:
   http://localhost:5000

4. Run workers or scheduled jobs (if applicable):
   npm run worker

Health endpoints (example):
- GET /health
- GET /ready

## Security & privacy
- Encrypt and rotate JWT and service credentials.
- Do not store repository or personal secrets unless explicitly required; if stored, encrypt at rest.
- Log minimal sensitive info to Opik; anonymize PII where appropriate.
- Implement least privilege for LLM and Opik access keys.

## Contributing
- Open issues for feature requests or bugs.
- Fork and open a PR with focused changes.
- Include tests and update `.env.example` for new settings.
- Document significant model or prompt changes and Opik evaluation configs.
---
 
