### **Prerequisites (Software to Install)**

- Node.js (v18 or later)
    
- Python (v3.9 or later)
    
- PostgreSQL Server
    
- Redis Server
    
- Git
    
- A code editor (e.g., VS Code)
    
- A tool for API testing (e.g., Postman/Insomnia)
    

---

### **Phase 1: Complete Developer Todo List (Estimated Timeline: 7 Weeks)**

---

### **Week 1: Foundations & Project Setup**

**Goal:** Get all services running locally. Establish basic communication from WhatsApp to the backend.

- **[ ] Git & Project Structure**
    
    - [x] Initialize a new Git repository.
        
    - [x] Create a monorepo structure with two main directories: `/core-service` (Node.js) and `/nlp-service` (Python).
        
    - [x] Add a `.gitignore` file to exclude `node_modules`, `__pycache__`, environment files (`.env`), etc.
        
- **[ ] Database Setup (PostgreSQL)**
    
    - [x] Install PostgreSQL and start the service.
        
    - [x] Create a new database user and password for the application.
        
    - [x] Create the primary database (e.g., `trustledger_dev`).
        
    - [x] In `/core-service`, choose and install a migration tool (e.g., `node-pg-migrate`) or an ORM with migration support (e.g., `Prisma`, `Sequelize`).
        
    - [x] Write and run the **first migration script** to create the `Users` and `trackableItems` tables as defined in the technical report.
        
- **[ ] Core Service Setup (Node.js/Express)**
    
    - [x] Inside `/core-service`, run `npm init` and install dependencies: `express`, `pg` (or your ORM), `redis`, `dotenv`, `axios`.
        
    - [x] Create the basic Express server file (`index.js` or `app.js`).
        
    - [x] Create a `/webhook` POST endpoint that simply logs the request body to the console for now.
        
    - [x] Set up database connection logic.
        
- **[ ] WhatsApp Gateway Setup (`whatsapp-web.js`)**
    
    - [x] Create a separate directory for this temporary tool, e.g., `/dev-gateway`.
        
    - [x] Install `whatsapp-web.js` and `qrcode-terminal`.
        
    - [x] Write the script to initialize the client, generate the QR code, and listen for the `ready` event.
        
    - [x] Implement the `on('message')` event listener.
        
    - [x] Inside the listener, use `axios` to forward the message object to your Node.js service's `/webhook` endpoint.
        

**🏁 Definition of Done for Week 1:** You can send a message on your personal WhatsApp, see the QR code, scan it, and see the message content printed in the console of your running Node.js application. The `Users` and `trackableItems` tables exist in your PostgreSQL database.

---

### **Week 2: User Onboarding & State Management**

**Goal:** A new user can be recognized, onboarded, and can add/list their custom trackable items through a multi-step conversation.

- **[ ] User Management Logic (Node.js)**
    
    - [x] In the `/webhook` handler, extract the sender's phone number (`message.from`).
        
    - [x] Write a database function `findOrCreateUser(phoneNumber)` that checks if the user exists and creates a new record if they don't.
        
    - [x] Implement the initial onboarding logic: if user `status` is `pending_onboarding`, send a welcome message and T&Cs.
        
- **[ ] State Machine & Redis Integration (Node.js)**
    
    - [x] Design the Finite State Machine (FSM) states on paper (e.g., `IDLE`, `AWAITING_ITEM_NAME`).
        
    - [x] Connect your Node.js app to the local Redis server.
        
    - [x] Create helper functions: `setUserState(userId, state)` and `getUserState(userId)`.
        
    - [x] Modify the `/webhook` handler to fetch the user's state from Redis before processing a message.
        
- **[ ] Item Management Flow (Node.js)**
    
    - [x] If a user in the `IDLE` state sends "add item", set their state to `AWAITING_ITEM_NAME` in Redis and reply with "What is the name of the item?".
        
    - [x] If a message comes from a user in the `AWAITING_ITEM_NAME` state, treat the message content as the new item name.
        
    - [x] Write the database logic to insert the new item into the `trackableItems` table, linked to the `user_id`.
        
    - [x] Set the user's state back to `IDLE` in Redis and send a confirmation message.
        
    - [x] Implement the "list items" command.
        

**🏁 Definition of Done for Week 2:** A brand-new user can join, and through a conversation, successfully add multiple items to their personal list. The bot correctly remembers which step of the conversation they are in.

---

### **Weeks 3-4: The NLP Service**

**Goal:** Build and train a reliable NLP model and expose it via a Flask API.

- **[ ] NLP Project Setup (Python)**
    
    - [x] Inside `/nlp-service`, set up a Python virtual environment.
        
    - [x] `pip install flask rasa spacy`.
        
    - [x] Download the necessary spaCy model (e.g., `python -m spacy download en_core_web_sm`).
        
    - [x] Run `rasa init` to create the standard Rasa project structure.
        
- **[ ] NLU Model Training (Rasa/spaCy)**
    
    - [x] Edit `data/nlu.yml`. **This is the most critical task.**
        
    - [x] For each intent (`log_personal_expense`, `log_shared_expense`, `query_balance`, etc.), write **at least 30-50 diverse examples**.
        
    - [x] Annotate all relevant entities (`AMOUNT`, `ITEM`, `PERSON`, etc.) in your examples.
        
    - [x] Edit `config.yml` to define your NLU pipeline. Ensure you include spaCy for entity extraction if needed.
        
    - [x] Train the model using `rasa train nlu`.
        
    - [x] Test and debug the model's performance using `rasa shell nlu`.
        
- **[ ] Flask API Development (Python)**
    
    - [x] Create a `app.py` file.
        
    - [x] Load the trained Rasa model.
        
    - [x] Create a `/parse` POST endpoint that accepts JSON with a `"text"` field.
        
    - [x] Inside the endpoint, run the input text through the Rasa model.
        
    - [x] Format the output (intent and entities) into a clean JSON response and send it back.
        

**🏁 Definition of Done for Week 4:** The Python Flask server is running. The Node.js service can send it any user message as a string and receive a structured JSON object with the correct intent and entities.

---

### **Weeks 5-6: End-to-End Expense Logging**

**Goal:** Connect all the pieces. A user can log personal and shared expenses using natural language, and the data is stored correctly.

- **[ ] Database Schema Extension**
    
    - [x] Write and run the migration scripts to create the `Expenses` and `SharedParticipants` tables.
        
- **[ ] NLP Integration in Core Service (Node.js)**
    
    - [x] In the main `/webhook` handler, add the primary logic: if a user is `IDLE`, send their message to the NLP service.
        
    - [x] Create a `switch` statement or handler map to route the request based on the returned `intent`.
        
- **[ ] Business Logic for Intents (Node.js)**
    
    - [x] Implement the handler for `log_personal_expense`. It should extract the entities, validate them (e.g., ensure `AMOUNT` is a number), and insert a new row into the `Expenses` table.
        
    - [x] Implement the handler for `log_shared_expense`. This is more complex:
        
        - [x] Create one record in `Expenses` with `expense_type = 'shared'`.
            
        - [x] Create one (or more, for future group shares) records in `SharedParticipants`, linking back to the `expense_id`.
            
    - [x] Implement the handler for `query_balance`.
        
        - [x] Write the SQL query to `JOIN` tables and `SUM` the `share_amount` for a given `user_id` and `entity_name`.
            
        - [x] Format the result into a user-friendly message.
            
- **[ ] Error Handling and Clarifications**
    
    - [ ] Implement logic for when the NLP service returns an intent but is missing a required entity (e.g., `AMOUNT`). The bot should ask a clarifying question ("I see you bought a 'cigar', how much was it?"). This will require using the FSM.
        

**🏁 Definition of Done for Week 6:** A user can have a full conversation: "I spent 150 on lunch." "Shared a 50 rs coffee with Jane." "show share with Jane." The bot understands, stores, and retrieves the information correctly.

---

### **Week 7: Testing, Refinement & Deployment Prep**

**Goal:** Harden the application, fix bugs, and create a clear plan for launching a private beta.

- **[ ] End-to-End Testing**
    
    - [ ] Recruit 3-5 friends or family members for a "pre-beta" test.
        
    - [ ] Create a shared document where they can report bugs or confusing conversations.
        
    - [ ] Actively monitor logs to see how the NLP performs with real, unpredictable user messages.
        
- **[ ] NLP Model Refinement**
    
    - [ ] Collect all messages from your testers that the bot misunderstood.
        
    - [ ] Add them as new examples to your `nlu.yml` file with the correct annotations.
        
    - [ ] Retrain and redeploy your NLP model. Repeat this cycle.
        
- **[ ] Deployment Planning**
    
    - [ ] Research hosting providers (Heroku for ease of use, or DigitalOcean/AWS for more control).
        
    - [ ] Write a `Dockerfile` for the Node.js service and another for the Python service. This makes deployment much easier.
        
    - [ ] Practice deploying the services using Docker.
        
    - [ ] Create a production configuration (e.g., using `.env` files for database URLs, ports, etc.).
        
    - [ ] **Crucially, complete the research and begin the application process for the official Meta Business API.** This can take time, so start now.
        

**🏁 Definition of Done for Week 7:** The application is stable and running (even if locally via Docker). The NLP model has been improved with real-world data. You have a clear, documented plan for deploying the application to a live server and migrating from `whatsapp-web.js` to the official API.