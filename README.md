# Sovereign AI Console Prototype (Hi-Fi)

This repository contains a high-fidelity prototype of a "Sovereign AI Console." It serves as a dashboard for managing, governing, and monitoring AI projects that must comply with strict data sovereignty, governance, and transparency regulations.

The design is specifically tailored to address requirements found in data protection laws (like Indonesia's UU PDP 27/2022) and data residency rules (like PP 71/2019), ensuring that sensitive data remains on-shore and that all operations are auditable.

---

## Key Features

This prototype is built as a single-page dashboard with several key modules:

* **📁 Project Dashboard:** Configure high-level project details like name, sector (e.g., Finance, Health), and the base model being used.
* **🔐 Data Policy Management:** Interactively set and view the JSON-based data policy.
    * Configure **Data Residency** (e.g., `Indonesia-only (on-shore)`).
    * Set data **Retention** periods.
    * Manage **PII Handling** methods (e.g., Anonymization/Redaction).
    * Toggle **Training Opt-ins** from users.
    * Import/Export the policy as a `.json` file.
* **⚖️ Bias & Accuracy Evaluation:** Run simulated evaluations for model fairness (Disparate Impact), accuracy (Exact Match/F1), and toxicity. Includes a latency trend chart.
* **🧪 Test Scenarios:** Define and review specific test cases, such as a RAG (Retrieval-Augmented Generation) prompt for customer support.
* **📜 Audit Trail:** View a persistent log of all system actions, policy changes, and evaluation runs, with options to export as CSV or JSONL.
* **📊 FAIR Principles Checklist:** An automated checklist that verifies if the current data policy settings align with FAIR data principles (Findable, Accessible, Interoperable, Reusable).

## Tech Stack

This project is built using a modern web stack:

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Language:** JavaScript (React / JSX)
* **UI Library:** [React](https://react.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Components:** [shadcn/ui](https://ui.shadcn.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Charts:** [Recharts](https://recharts.org/)
* **Animation:** [Framer Motion](https://www.framer.com/motion/)

## Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

* [Node.js](https://nodejs.org/en) (v18.0 or later)
* [Git](https://git-scm.com/)

### 1. Clone the Repository

First, clone the repository to your local machine:

```bash
git clone https://github.com/fauzantaufiq1211/console-sovereign-ai.git
cd console-sovereign-ai
```

### 2.Install Dependencies

Install all the required npm packages:

```bash
npm install
```

### 3. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open http://localhost:3000 with your browser to see the running application.

### Project Context & References
This prototype is designed as an exploration of practical, UI-driven AI governance. It is heavily inspired by and references several key industry and academic frameworks:

* [NIST AI Risk Management Framework (RMF)](https://www.nist.gov/itl/ai-risk-management-framework)
* [Model Cards for Model Reporting](https://modelcards.withgoogle.com/about)
* [The FAIR Guiding Principles for Data Management](https://www.go-fair.org/fair-principles/)
* [AIF360: The AI Fairness 360 Toolkit](https://www.google.com/search?q=https://aif360.mybluemix.net/)

### License
This project is licensed under the [MIT License](https://opensource.org/license/mit).
