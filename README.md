# Wryte AI API

> [!WARNING]
> **Under Development**: This project is currently in active development. Features and APIs are subject to change.

## Overview
Wryte AI API is the backend service for the Wryte AI platform, designed to help organizations streamline their content creation workflow using AI.

## Tech Stack
This project is built with a modern, type-safe backend stack:

-   **Runtime**: Node.js
-   **Language**: TypeScript
-   **Framework**: Express.js (v5)
-   **Database**: PostgreSQL
-   **ORM**: Prisma
-   **Validation**: Zod

## Getting Started

### Prerequisites
-   Node.js
-   PostgreSQL

### Installation

1.  Clone the repository
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    ```bash
    cp .env.example .env
    # Update .env with your database credentials
    ```
4.  Run database migrations:
    ```bash
    npx prisma migrate dev
    ```

### Development

Start the development server:
```bash
npm run dev
```
