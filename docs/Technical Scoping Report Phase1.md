
---

### **Technical Scoping Report: Phase 1**

- **Project Name:** "TrustLedger" (Working Title)
    
- **Phase:** 1 - Core Bot Functionality & NLP Integration
    
- **Version:** 1.0
    
- **Date:** Wednesday, September 3, 2025
    

### 1.0 Executive Summary

This report outlines the technical architecture and implementation plan for Phase 1 of the TrustLedger project. The primary objective of this phase is to deliver a functional WhatsApp bot capable of intelligent expense tracking for individual users. The system will leverage a microservices-oriented architecture, with a Node.js core service for business logic and a separate Python service for advanced Natural Language Processing. The chosen stack provides a robust, scalable, and future-proof foundation for the features planned in subsequent phases.

### 2.0 System Architecture

The Phase 1 architecture is designed for modularity and separation of concerns. It consists of several key services that communicate via internal API calls.

**Architectural Diagram:**

```
[ User on WhatsApp ] <--> [ 1. WhatsApp Gateway ] <--> [ 2. Core Service (Node.js) ]
                                                            |           ^
                                                            |           | (State/Cache)
                                                            |           v
                                                            +-----> [ 5. Redis ]
                                                            |
                                                            | (Data Persistence)
                                                            v
                                                        [ 4. PostgreSQL DB ]
                                                            ^
                                                            |
                                                            | (NLP Request)
                                                            v
                                                        [ 3. NLP Service (Python) ]
```

**Component Interaction Flow:**

1. A user sends a message via WhatsApp.
    
2. The **WhatsApp Gateway** receives the message and forwards it to the **Core Service (Node.js)**.
    
3. The Core Service determines if the message requires natural language understanding. If so, it sends the text to the **NLP Service (Python)**.
    
4. The NLP Service processes the text using Rasa/spaCy and returns structured data (intent, entities).
    
5. The Core Service uses this structured data to execute business logic (e.g., create a new expense). It interacts with the **PostgreSQL Database** for data storage and retrieval.
    
6. The **Redis Cache & FSM** are used by the Core Service to manage conversation state and cache frequently accessed user data.
    
7. The Core Service formulates a reply and sends it back through the WhatsApp Gateway to the user.
    

### 3.0 Component Deep Dive

#### 3.1 WhatsApp Gateway

- **Development:** `whatsapp-web.js` will be used. This is an excellent choice for rapid prototyping as it automates a browser, allowing you to use a standard WhatsApp account.
    
    - **CRITICAL NOTE:** This library is unofficial and should **not** be used for production. It is prone to breaking when WhatsApp updates its web client.
        
- **Production Plan:** The system must be migrated to the official **Meta Business API** before launch. The architecture is designed to make this a simple swap, as the Core Service will be insulated from the gateway's implementation details.
    

#### 3.2 Core Application Service (Node.js / Express)

This is the central nervous system of the application.

- **Responsibilities:**
    
    - Expose a single webhook endpoint to receive all incoming messages from the WhatsApp Gateway.
        
    - Handle user authentication and session management.
        
    - Orchestrate communication with all other services (NLP, DB, Cache).
        
    - Contain all core business logic: user onboarding, expense creation/updating, relationship management (at the entity level), and formatting responses.
        
    - Manage the Finite State Machine (FSM) for multi-turn conversations.
        

#### 3.3 NLP Service (Python / Flask / Rasa / spaCy)

This service is dedicated solely to understanding user messages. It will be a separate application that communicates with the Node.js service, likely via a simple REST API.

- **Framework:** Flask will be used to create a lightweight web server with a single endpoint (e.g., `/parse`).
    
- **Rasa NLU:** Will be used to identify the user's **intent**.
    
    - **Example Intents:** `log_personal_expense`, `log_shared_expense`, `query_balance`, `add_item`, `greet`.
        
- **spaCy (Entity Extraction):** Will be used within the Rasa pipeline to extract key pieces of information (**entities**).
    
    - **Example Entities:** `AMOUNT` (e.g., 160), `CURRENCY` (e.g., Rs.), `ITEM` (e.g., cigarette), `PERSON` (e.g., Kamal).
        
- **Example Workflow:**
    
    1. Node.js sends `{"text": "shared Rs. 160 cigar with Kamal"}` to the Flask server.
        
    2. Rasa/spaCy processes this.
        
    3. The Flask server returns a JSON response:
        
        JSON
        
        ```
        {
          "intent": "log_shared_expense",
          "entities": [
            { "entity": "AMOUNT", "value": "160" },
            { "entity": "CURRENCY", "value": "Rs." },
            { "entity": "ITEM", "value": "cigar" },
            { "entity": "PERSON", "value": "Kamal" }
          ]
        }
        ```
        

#### 3.4 Data Persistence Layer (PostgreSQL)

A relational database is the correct choice for this project's structured data. The initial schema will be designed for scalability.

**Proposed Phase 1 Schema:**

- `Users`
    
    - `user_id` (SERIAL PRIMARY KEY)
        
    - `phone_number` (VARCHAR(20) UNIQUE NOT NULL)
        
    - `status` (ENUM('pending_onboarding', 'active', 'disabled') DEFAULT 'pending_onboarding')
        
    - `created_at` (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
        
- `trackableItems`
    
    - `item_id` (SERIAL PRIMARY KEY)
        
    - `user_id` (INTEGER REFERENCES Users(user_id))
        
    - `item_name` (VARCHAR(100) NOT NULL)
        
    - `created_at` (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
        
- `Expenses`
    
    - `expense_id` (SERIAL PRIMARY KEY)
        
    - `user_id` (INTEGER REFERENCES Users(user_id))
        
    - `item_name` (VARCHAR(100) NOT NULL)
        
    - `total_amount` (DECIMAL(10, 2) NOT NULL)
        
    - `expense_type` (ENUM('personal', 'shared') NOT NULL)
        
    - `transaction_time` (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
        
- `SharedParticipants`
    
    - `share_id` (SERIAL PRIMARY KEY)
        
    - `expense_id` (INTEGER REFERENCES Expenses(expense_id))
        
    - `entity_name` (VARCHAR(100) NOT NULL) -- This stores "Kamal"
        
    - `share_amount` (DECIMAL(10, 2) NOT NULL)
        

#### 3.5 State & Cache Layer (Redis / FSM)

- **Finite State Machine (FSM):** The logic will be implemented within the Node.js service. It's not a separate service but a programming pattern. It will manage conversations like adding an item.
    
    - **Flow:** `State: IDLE` -> User says "add item" -> `State: AWAITING_ITEM_NAME` -> Bot asks "What is the name of the item?" -> User replies "Cigarettes" -> Bot saves item -> `State: IDLE`.
        
- **Redis:** Will be used as a high-speed cache to:
    
    - Store the current state of each user's conversation (the FSM state).
        
    - Cache frequently accessed data like user profiles or item lists to reduce load on PostgreSQL.
        

### 4.0 Phase 1 Implementation Plan & Milestones

1. **Milestone 1: Environment Setup & Core Models (1 week)**
    
    - Initialize Node.js and Python projects.
        
    - Set up PostgreSQL and create the database schema.
        
    - Establish basic connection between `whatsapp-web.js` and the Node.js server.
        
2. **Milestone 2: User Onboarding & Item Management (1 week)**
    
    - Implement the FSM for the new user welcome flow (T&Cs).
        
    - Build the logic for adding and listing `trackableItems`.
        
3. **Milestone 3: Core NLP Service (2 weeks)**
    
    - Set up the Flask server.
        
    - Train an initial Rasa/spaCy model with training data for the key intents and entities.
        
    - Build the API endpoint and ensure it can correctly parse test sentences.
        
4. **Milestone 4: Expense Logging Integration (2 weeks)**
    
    - Integrate the Node.js service with the NLP service.
        
    - Implement the business logic for creating `personal` and `shared` expense records in the database based on the NLP output.
        
    - Build the query logic to show a user their shares with an entity.
        
5. **Milestone 5: Testing and Refinement (1 week)**
    
    - Conduct end-to-end testing with a small group of users.
        
    - Gather feedback, fix bugs, and refine the NLP model with new training data from real-world messages.
        

### 5.0 Conclusion

The selected technology stack is powerful and well-suited for the project's requirements. This plan for Phase 1 focuses on building a robust and intelligent core system. By separating concerns between the main application and the NLP service, we create a scalable architecture that is ready for the advanced features planned in future phases, such as real-time user linking, trust score calculation, and the full mobile application. The immediate priority is to develop a stable MVP based on this report to begin gathering user feedback.