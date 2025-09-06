### **Project Root: `trustledger/`**

This is the main project folder that you will initialize with Git.

```
trustledger/
├── .git/                     # Git repository data
├── .gitignore                # Specifies intentionally untracked files to ignore
├── core-service/             # The main Node.js backend application (Service 1)
├── nlp-service/              # The Python NLP microservice (Service 2)
├── dev-gateway/              # Temporary whatsapp-web.js tool for development
└── README.md                 # Project overview, setup, and deployment instructions
```

---

### **1. `core-service/` (Node.js Express App)**

This follows a standard feature-driven and layered architecture for scalability.

```
core-service/
├── node_modules/             # Project dependencies
├── src/                      # Main source code directory
│   ├── api/                  # API routes and versions
│   │   └── v1/
│   │       ├── webhook.route.js    # Defines the /webhook endpoint
│   │       └── index.js            # Combines all v1 routes
│   │
│   ├── config/               # Application configuration
│   │   ├── config.js         # General config (ports, env)
│   │   └── db.config.js      # Database connection details
│   │
│   ├── controllers/          # Handles req/res cycle, calls services
│   │   └── webhook.controller.js # Logic for handling incoming messages
│   │
│   ├── database/             # Database related files
│   │   ├── migrations/       # Database migration scripts
│   │   │   └── 001_initial_schema.js
│   │   ├── models/           # Database models (if using an ORM like Sequelize)
│   │   │   ├── user.model.js
│   │   │   └── expense.model.js
│   │   └── db.js             # Database connection pool setup
│   │
│   ├── services/             # Core business logic
│   │   ├── userService.js          # Handles user creation, state, etc.
│   │   ├── expenseService.js       # Logic for logging and querying expenses
│   │   ├── messageService.js       # Formats and sends replies to WhatsApp
│   │   └── nlpClient.js            # A client for communicating with the Python NLP service
│   │
│   └── utils/                # Reusable helper functions
│       ├── logger.js         # For logging events and errors
│       └── fsm.js            # Finite State Machine implementation
│
├── tests/                    # Unit and integration tests
│   ├── services/
│   │   └── expenseService.test.js
│   └── setup.js              # Test environment setup
│
├── .env                      # Environment variables (DB_USER, REDIS_URL, etc.) - DO NOT COMMIT TO GIT
├── .eslintrc.js              # ESLint configuration for code quality
├── app.js                    # Initializes and configures the Express app
├── Dockerfile                # Instructions to containerize this service
├── package.json              # Project dependencies and scripts
└── server.js                 # The main entry point that starts the server
```

---

### **2. `nlp-service/` (Python Flask & Rasa App)**

This structure is a standard Rasa project, wrapped within a Flask API.

```
nlp-service/
├── data/                     # Rasa training data
│   ├── nlu.yml               # The MOST IMPORTANT file: intents, entities, examples
│   └── rules.yml             # For simple dialogue flows (if needed)
│
├── models/                   # Where trained Rasa models (*.tar.gz) are stored
│   └── 20250903-211909-fluffy-avenue.tar.gz
│
├── .venv/                    # Python virtual environment folder
├── app.py                    # The Flask application entry point
├── config.yml                # Rasa model configuration (NLU pipeline, policies)
├── domain.yml                # Defines all intents, entities, and responses for Rasa
├── Dockerfile                # Instructions to containerize this service
└── requirements.txt          # List of Python dependencies (rasa, flask, spacy, etc.)
```

---

### **3. `dev-gateway/` (`whatsapp-web.js` Tool)**

This is a minimal setup, as it's temporary.

```
dev-gateway/
├── node_modules/
├── .env                  # Environment variable for the core service webhook URL
├── index.js              # The main script to run the whatsapp-web.js client
└── package.json          # Dependencies (whatsapp-web.js, qrcode-terminal, axios)
```

### Best Practices & Recommendations

1. **Environment Variables:** Use `.env` files in each service directory to manage sensitive information and configuration. Never commit these files to Git.
    
2. **Linting:** Use ESLint for the Node.js service and a linter like `flake8` or `black` for the Python service to maintain consistent code quality.
    
3. **Scripts:** In the root `package.json`, you can add scripts to run all services at once for easy development, for example, using a tool like `concurrently`.
    
4. **README:** Your root `README.md` is your project's front door. It should clearly explain how to set up the environment, install dependencies for all services, and run the entire project locally.
    
