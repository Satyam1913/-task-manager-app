# Task Manager Web Application

A full-stack task management app: a Java Spring Boot REST API backed by MySQL,
with a lightweight HTML/CSS/JS frontend. Built as a personal project to practice
REST API design, relational data modeling, and cloud deployment on AWS.

## Tech Stack

- **Backend:** Java 17, Spring Boot 3, Spring Data JPA
- **Database:** MySQL
- **Frontend:** HTML, CSS, vanilla JavaScript (fetch API)
- **Deployment:** AWS EC2 (backend + MySQL), AWS S3 (static frontend hosting)
- **Version control:** Git

## Project Structure

```
task-manager-app/
├── backend/                 Spring Boot REST API
│   ├── pom.xml
│   └── src/main/java/com/taskmanager/
│       ├── controller/       REST endpoints
│       ├── service/          Business logic
│       ├── repository/       Spring Data JPA repositories
│       ├── model/            JPA entities
│       ├── dto/              Request/response DTOs
│       └── exception/        Global error handling
├── frontend/                 Static UI (HTML/CSS/JS)
├── DEPLOYMENT.md              AWS EC2 + S3 deployment steps
└── README.md
```

## API Reference

| Method | Endpoint                  | Description             |
|--------|----------------------------|--------------------------|
| GET    | `/api/tasks`               | List all tasks          |
| GET    | `/api/tasks/{id}`          | Get a single task       |
| POST   | `/api/tasks`                | Create a task           |
| PUT    | `/api/tasks/{id}`          | Update a task           |
| PATCH  | `/api/tasks/{id}/complete` | Mark a task complete    |
| DELETE | `/api/tasks/{id}`          | Delete a task            |

All responses are wrapped in a consistent shape:

```json
{
  "success": true,
  "message": "Tasks fetched successfully",
  "data": [ { "id": 1, "title": "Set up EC2", "status": "PENDING", "...": "..." } ]
}
```

Validation and not-found errors return a matching structured error body with
`message`, `status`, and `timestamp`.

## Running Locally

### 1. Prerequisites

- Java 17+
- Maven 3.8+
- MySQL 8+ running locally (or accessible remotely)

### 2. Create the database

```sql
CREATE DATABASE taskmanager;
```

(The app also auto-creates it on first run via `createDatabaseIfNotExist=true`,
as long as the configured MySQL user has permission to do so.)

### 3. Configure environment variables

The app reads DB credentials from environment variables, falling back to local
defaults if unset:

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=taskmanager
export DB_USERNAME=root
export DB_PASSWORD=your_password
```

### 4. Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API will be live at `http://localhost:8080/api/tasks`.

### 5. Run the frontend

Just open `frontend/index.html` in a browser (or serve it with any static
file server). It's already pointed at `http://localhost:8080/api/tasks` in
`script.js`.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full AWS EC2 + S3 deployment
walkthrough, including environment setup, building the JAR, and running it as
a persistent service.
