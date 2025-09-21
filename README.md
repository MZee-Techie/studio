# EaseMyJournAI ✨

**EaseMyJournAI** is a next-generation travel planning application that leverages the power of Generative AI to create personalized, end-to-end trip itineraries. Say goodbye to generic travel plans and hello to journeys crafted just for you.

---

### 🎯 The Problem

Traditional travel planning is often a fragmented and time-consuming process. It involves juggling multiple websites for booking, manually mapping out destinations, struggling with budget management, and ending up with rigid, one-size-fits-all itineraries that don't cater to personal tastes or last-minute changes. This complexity can make trip planning more of a chore than a joy.

### 💡 Our Solution

**EaseMyJournAI** transforms travel planning into a seamless, conversational, and intelligent experience. By combining a user-friendly interface with powerful AI, our application acts as a personal travel assistant that understands your needs and crafts a detailed, actionable plan. Our goal is to make planning your next adventure as exciting as the journey itself.

---

### 🔥 Key Features

- **🤖 Smart Itinerary Generation**: Describe your ideal trip using a mix of structured inputs (dates, budget, destination) and natural language. Our AI processes your request to generate a detailed, day-by-day plan.

- **✍️ Dynamic AI Adjustments**: Your plan isn't set in stone. Use natural language prompts like _"Make day 2 more relaxed"_ or _"Add a museum visit"_ to have the AI instantly modify and update your itinerary.

- **💵 Budget & Expense Tracking**: Set a total budget and see a real-time progress bar of your estimated expenses, helping you stay on track.

- **🗺️ Interactive Itinerary View**: Explore your journey through a beautiful, collapsible timeline. Each segment includes rich details like descriptions, ratings, and risk assessments (e.g., crowds, weather).

- **🚀 Actionable Links**: Go from planning to doing with a single click. Segments include integrated links to **View in Google Maps**, book transport or hotels on **EaseMyTrip**, or hail a ride with **Ola**.

- **📄 PDF Export**: Download your complete itinerary as a professionally formatted PDF for easy offline access on any device.

- **💾 Personalized Dashboard**: Save your favorite itineraries to a personal dashboard to view or modify them anytime.

---

### 🔴 Live Demo

See the application live in action!

[![Open Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=firebase)](https://studio--studio-6944501012-4baeb.us-central1.hosted.app/)

---

### 🛠️ Tech Flow & Architecture

EaseMyJournAI is built on a modern, serverless technology stack designed for performance, scalability, and rapid development.

1.  **Frontend (Next.js & React)**: The user interface is built with **Next.js** and **React**, using **ShadCN UI** components and **Tailwind CSS** for a clean, responsive design. The app is a Single Page Application (SPA) that makes calls to our backend services.

2.  **AI Backend (Genkit)**: All AI-powered features are driven by **Genkit**, an open-source framework for building with large language models.
    -   **Itinerary Generation (`itinerary-generator.ts`)**: A Genkit flow takes the user's structured and natural language input, constructs a detailed prompt, and calls the Google AI model to generate a structured JSON itinerary.
    -   **Dynamic Adjustments (`dynamic-itinerary-adjustment.ts`)**: Another Genkit flow takes the existing itinerary and a user's modification prompt. It intelligently revises the plan without losing context.

3.  **Data Persistence (Browser Storage)**: To provide a seamless user experience without requiring a full database setup for this hackathon, saved itineraries are persisted in the browser's `localStorage`. This allows for the dashboard functionality.

4.  **Deployment (Firebase App Hosting)**: The entire application is deployed on **Firebase App Hosting**, providing a robust, scalable, and secure serverless environment.

---

### 🚀 Getting Started

To run this project locally:

1.  **Clone the repository:**
    ```bash
    git clone [your-repo-url]
    cd [your-repo-name]
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    - Create a `.env` file in the root of the project.
    - Add your Google AI API key:
      ```
      GEMINI_API_KEY=your_api_key_here
      ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
