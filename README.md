# 🧠 TaskFlow API

A production-ready **NestJS** backend project for managing tasks with full support for job queuing, scheduled overdue checks, and robust filtering, built as part of a Senior Backend Engineer challenge.

---

## 📌 Overview

The **TaskFlow API** is a RESTful task management service that supports:

- ✅ Creating, updating, and deleting tasks
- 🔄 Background task processing with **BullMQ**
- ⏰ Hourly cron job for overdue task detection
- 🧵 Batch operations and job queuing
- 🔐 Authentication & role-based authorization
- 💥 Resilient and secure architecture

This challenge project includes **intentional architectural, performance, and security issues**—your task is to identify, refactor, and improve them.

---

## 🧱 Tech Stack

| Tool               | Role                              |
|-----------------   |-----------------------------------|
| **NestJS**         | Core framework                    |
| **TypeScript**     | Language                          |
| **TypeORM**        | ORM for PostgreSQL                |
| **PostgreSQL**     | Primary database                  |
| **BullMQ + Redis** | Background processing queue       |
| **Bun**            | Package manager and script runner |
| **Swagger**        | API documentation (OpenAPI)       |

---

## ⚙️ Getting Started

### 🧾 Prerequisites

- Node.js v16+
- [Bun](https://bun.sh/)
- PostgreSQL
- Redis

### 🛠 Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/taskflow-api.git
cd taskflow-api

# 2. Install dependencies
bun install

# 3. Create and configure environment variables
cp .env.example .env
# ➜ Update DB and Redis connection info

### Default Users

The seeded database includes two users:

1. Admin User:
   - Email: admin@example.com
   - Password: admin123
   - Role: admin

2. Regular User:
   - Email: user@example.com
   - Password: user123
   - Role: user
