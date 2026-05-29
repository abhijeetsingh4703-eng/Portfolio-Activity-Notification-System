# Portfolio Activity & Notification System


## How it's built (Architecture)

- *API Gateway (Port 3010)*: The main entry point. It just takes incoming requests and routes them to the right backend service.
- *Portfolio Service (Port 3011)*: Handles the heavy lifting for portfolio data and user preferences. It talks directly to a PostgreSQL database.
- *Notification Service (Port 3012)*: Listens for events and sends out the actual alerts. 

- *Microservices over a Monolith*: It's definitely a bit more complex to set up (hence the Docker Compose file), but it means we can scale the notification engine completely independently if there's a huge spike in market activity.
- *RabbitMQ for Events*: I wanted the services to be decoupled. If the Notification service crashes for some reason, RabbitMQ will just hold onto the messages until it's back up, so we never lose an alert.
- *Postgres + Prisma*: Standard, reliable choice for financial data where consistency matters. Prisma just makes it way easier to work with types in TypeScript.
- *Redis Cache*: Added this into the Notification service to quickly look up user preferences without having to spam the main Postgres database on every single transaction.


## What's included
- API Gateway, Portfolio, and Notification services
- Event-driven async processing (RabbitMQ)
- Database persistence (Postgres)
- Caching (Redis)
- Docker Compose for easy local setup

## How to run it locally

1. Make sure you have Docker and Docker Compose installed.
2. Clone the repo and open a terminal in the root folder.
3. Boot everything up:
   ```
   docker compose up --build -d
   ```

4. To test it out, I included a quick script that creates a preference and a transaction. Just run:
   ```
   node test.js
   ```

5. You can watch the Notification service process the event and "send" the email by checking the logs:
   ```
   docker compose logs -f notification
   ```

-`docker compose down -v` to clean up the containers and volumes. 


<img width="1919" height="1079" alt="Screenshot 2026-05-29 125255" src="https://github.com/user-attachments/assets/c0e95809-eac4-4007-9fdc-c5866f17c502" />
