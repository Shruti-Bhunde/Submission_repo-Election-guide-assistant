# Election Guide Assistant

An interactive and intelligent web application designed to help citizens navigate the democratic process seamlessly. From registration to casting the final vote, this project breaks down the election lifecycle into a digestible timeline, provides a step-by-step personalized wizard, and features an integrated AI chatbot powered by Google's Gemini API to answer specific voting queries.

## Chosen Vertical
**Civic Technology / E-Governance**
This suite tackles the domain of civic engagement by attempting to reduce voter friction, educate constituents, and democratize access to accurate, instantaneous election guidance.

## Approach and Logic
- **Dual-Learning Interface:** Built to support both structured learning and dynamic queries. A static timelines handles the predictable lifecycle of voting, while a dynamic chat assistant answers niche or specific user questions.
- **Robust API Integration:** We chose to use the **Gemini 2.5 Flash** model because of its exceptional speed and robust capability in processing natural language queries. 
- **Continuation Safety Logic:** Large language models can sometimes hit `MAX_TOKENS` constraints or stop mid-sentence. We implemented a dedicated backend loop that evaluates the API `"finishReason"` and dynamically prompts the model to naturally continue its answer if it detects truncation.
- **Secure Architecture:** The backend acts as a proxy for the Gemini API. By maintaining the API key in the Node.js `.env` configuration, we ensure the client front-end never has direct access to our API credentials. 

## How the Solution Works
1. **Frontend Experience:** Written in simple, performant HTML/CSS/Vanilla JS. The user is greeted by an engaging hero section containing a scrolling timeline detailing the 5 pivotal steps of the voting lifecycle.
2. **Interactive Wizard:** A JavaScript-powered questionnaire rapidly assesses voter readiness by checking their registration status and polling station familiarity.
3. **Chat Automation:** 
   - A floating widget toggles the chat panel GUI.
   - User inputs are sent via a `POST` request to the backend `/chat` route.
   - The Node.js server appends system instructions (*"You are an election assistant."*) to the user's question, constructs the JSON payload, and calls the Google Generative Language API.
   - The backend aggregates chunks of text, applies timeout limits via an `AbortController`, and loops to construct a fully complete final paragraph.
   - The synthesized response payload is securely rendered on the client browser window.

## Assumptions Made
- **API Availability & Rate Limits:** It is assumed that the system environment `.env` provides a `GEMINI_API_KEY` that is fully operational and queries stay within standard quota limits.
- **Frontend Environment:** The web user has JavaScript enabled on their browser to execute the interactive Wizard and Chatbot components.
- **Wizard Simplicity:** The personalized wizard currently represents a generalized template (e.g., checking registration and polling location). It assumes users will fit directly into standardized categories, omitting edge-cases like proxy voting or absentee ballots.
- **Regional Agnosticism:** The AI assistant currently fields questions in a generalized way, assuming the user's queries are explicit enough about their region or that they accept overarching civic advice, as geolocation context passing isn't strictly enforced in the current iteration.
