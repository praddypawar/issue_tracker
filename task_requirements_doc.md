# Mini Issue Tracker (Frontend + Backend)

## Requirements

### Problem Statement

Build a Mini Issue Tracker where users can create, update, and view issues in a dashboard. This is a full-stack task using a React + Django with GraphQL stack, incorporating an AI-powered feature using LangChain and Google Gemini for enhancing issue descriptions. You're free to use any AI tools (e.g., Copilot, Cursor, Windsurf, ChatGPT) to assist your work.

## Functional Requirements

### Backend (Django with GraphQL)

• **User Authentication:** Implement JWT-based or session-based authentication.

• **GraphQL APIs for:**
  ○ **Issues:** CRUD operations for issues (fields: title, description, status (OPEN, IN_PROGRESS, CLOSED)).
  ○ **Optional:** Support for tags or priority fields.
  ○ Query to fetch issues assigned to a user.
  ○ Mutation to invite a team member to the board.

• **Permissions:** Users can only edit/delete their own issues.

• **AI Feature:** Integrate LangChain with Google Gemini to enhance issue descriptions. When a user submits a rough description, the Gemini model refines it into a clear, professional format before saving.

### Frontend (React with GraphQL)

• **Login Page:** Simple authentication interface.

• **Issue Dashboard:** Display issues with status badges (OPEN, IN_PROGRESS, CLOSED).

• **Create/Edit Issue Modal or Page:** Form to create or update issues, including AI-enhanced description processing.

• **Filters:** Filter issues by status.

• **Invite Team Member:** Interface to invite a team member to the board.

• **Real-Time Updates:** Use WebSocket (e.g., via Graphene-Django subscriptions) or polling for real-time issue updates.

• **Drag-and-Drop Status Update:** Allow users to drag issues between status columns (e.g., Kanban-style board).

## Optional Extras (Nice-to-Have)

• **Markdown support** for issue descriptions (post-AI enhancement).

## AI Tools Requirement

You must use at least one AI-based tool in your workflow, in addition to the mandatory LangChain + Google Gemini integration for enhancing issue descriptions. Examples of additional AI tool usage:

• **Cursor:** Generate boilerplate code or React components.

• **Copilot:** Assist with form handling, GraphQL schema generation, or Django models.

• **ChatGPT/Codeium:** Generate README, test cases, or code optimizations.

## Submission Guidelines

• **GitHub Repository:** Create a public GitHub repository.

• **README.md:**
  ○ Project setup instructions (backend and frontend separately).
  ○ GraphQL APIs used (queries, mutations, subscriptions).
  ○ Tooling used (explicitly mention AI tools and their purposes, including LangChain + Google Gemini for description enhancement).
  ○ Known limitations.

• **Loom Video Demo (2–3 mins, strongly preferred):**
  ○ Walkthrough of the app (login, issue creation, AI-enhanced description, drag-and-drop, etc.).
  ○ Highlight which parts were assisted by AI tools (including LangChain + Google Gemini).

• **Sample .env.example:** Include if environment variables are needed (e.g., for Google Gemini API keys, Django settings, etc.).

• **AI Tool Clarification:** Specify which AI tools were used and for what purpose (e.g., "Used Cursor for React component scaffolding, Copilot for GraphQL schema, LangChain + Google Gemini for description enhancement").

## ⏱️ Time Expectation

Aim to complete the project within **3 days of focused effort**.

## 🧠 Evaluation Criteria

| Area | Evaluation Focus |
|------|------------------|
| **Technical Accuracy** | Clean Django + GraphQL and React + GraphQL code, working APIs, correct AI integration. |
| **AI Usage** | Effective use of LangChain + Google Gemini for description enhancement and other AI tools. |
| **Code Structure** | Logical folder structure, modularity, adherence to GraphQL and React/Django best practices. |
| **Dev Experience** | Clear setup instructions, high-quality README, proper environment variable handling. |
| **Product Thinking** | Intuitive UX (modals, dashboard, status filters, drag-and-drop), responsiveness. |
| **Delivery** | Promptness, clarity, and completeness of submission. |

## 📩 Final Delivery

Please share:
• **GitHub repository URL.**
• **Loom video link**